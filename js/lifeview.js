// LifeViewer plugin
// written by Chris Rowett
// "This started small and then kind of got away from me."

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Allocator PatternManager WaypointConstants WaypointManager Help LifeConstants IconManager Menu Life Stars MenuManager registerEvent Keywords ColourManager Script Uint32Array myRand PopupWindow typedArrays Float32 */

	// LifeViewer document configuration
	var DocConfig = {
		// meta tag name
		tagName : "LifeViewer",

		// div class name
		divClassName : "rle",

		// pattern source element name
		patternSourceName : "code",

		// maximum height of pattern source element
		patternSourceMaxHeight : 37,

		// whether to hide canvas if no support
		hide : true,

		// whether to limit width to the pattern source element width
		limitWidth : false,

		// div class name containing code block
		divCodeClassName : "codebox"
	},

	// ViewConstants singleton
	ViewConstants = {
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
		/** @const {Array<string>} */ stateNames : ["Off", "On", "History", "Mark1", "MarkOff", "Mark2", "Kill"],

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

		// frame time budget in ms
		/** @const {number} */ frameBudget : 17,
		
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
		/** @const {string} */ versionName : "LifeViewer Plugin",

		// build version
		/** @const {number} */ versionBuild : 286,

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

		// zoom scale factor for pattern fit zoom
		/** @const {number} */ zoomScaleFactor : 1.25,

		// threshold for fit zoom to round to nearest integer (percentage)
		/** @const {number} */ integerZoomThreshold : 0.99,

		// minimum and maximum depth
		/** @const {number} */ minDepth : 0,
		/** @const {number} */ maxDepth : 10,
		
		// display scale for depth
		/** @const {number} */ depthScale : 10,

		// minimum and maximum zoom
		/** @const {number} */ minZoom : 0.0625,
		/** @const {number} */ maxZoom : 32,
		
		// minimum and maximum negative zoom
		/** @const {number} */ minNegZoom : -16,
		/** @const {number} */ maxNegZoom : -1,

		// minimum and maximum generation speed
		/** @const {number} */ minGenSpeed : 1,
		/** @const {number} */ maxGenSpeed : 60,

		// minimum and maximum steps
		/** @const {number} */ minStepSpeed : 1,
		/** @const {number} */ maxStepSpeed : 50,

		// icon manager
		iconManager : null,

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
		/** @const {number} */ minViewerWidth : 480,
		/** @const {number} */ maxViewerWidth : 2048,

		// extra gui height for top and bottom row of controls (used during AutoFit)
		/** @const {number} */ guiExtraHeight : 80,

		// minimum and maximum height of the Viewer
		/** @const {number} */ minViewerHeight : 240,
		/** @const {number} */ maxViewerHeight : 2048,

		// minimum height to display navigation menu in the Viewer
		/** @const {number} */ minMenuHeight : 480,

		// custom colour usage states
		/** @const {number} */ stateNotUsed : 0,
		/** @const {number} */ stateUsedCustom : 1,
		/** @const {number} */ stateUsedDefault : 2,

		// minimum and maximum bold grid line interval (0 means no bold grid lines)
		/** @const {number} */ minBoldGridInterval : 0,
		/** @const {number} */ maxBoldGridInterval : 16,

		// help topics
		/** @const {number} */ keysTopic : 0,
		/** @const {number} */ scriptsTopic : 1,
		/** @const {number} */ informationTopic : 2,
		/** @const {number} */ memoryTopic : 3,
		/** @const {number} */ aliasesTopic : 4,
		/** @const {number} */ coloursTopic : 5
	},

	// Controller singleton
	Controller = {
		// allocator
		allocator : new Allocator(),

		// list of Canvas items and View pairs
		viewers : [],

		// standalone viewer
		standaloneIndex : -1,

		// popup window
		popupWindow : null
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

	// View object
	/**
	 * @constructor
	 */
	function View(element) {
		// cell X and Y coordinate
		this.cellX = 0;
		this.cellY = 0;

		// maximum number of history states (can be less for multi-state patterns)
		this.maxHistoryStates = 63;

		// number of history states (default and maximum is 63)
		this.historyStates = 63;

		// whether to hide source element
		this.noSource = false;

		// initial value flags
		this.initialX = false;
		this.initialY = false;
		this.initialZ = false;
		this.initialAngle = false;
		this.initialDepth = false;
		this.initialLayers = false;
		this.initialTheme = false;
		this.initialStep = false;
		this.initialGps = false;
		this.initialStop = false;
		this.initialLoop = false;

		// floating point counter
		this.floatCounter = 0;

		// floating point counter for origin
		this.originCounter = 0;

		// elapsed time at each generation
		this.elapsedTimes = null;

		// x and y offset of pattern
		this.panX = 0;
		this.panY = 0;

		// whether pattern was clipped to bounded grid
		this.wasClipped = false;

		// specified pattern width and height from RLE header
		this.specifiedWidth = -1;
		this.specifiedHeight = -1;

		// default POI
		this.defaultPOI = -1;

		// random seed
		this.randomSeed = Date.now().toString();
		this.randomSeedCustom = false;

		// whether help topics displayed
		this.showTopics = false;

		// whether labels displayed
		this.showLabels = true;

		// whether population graph displayed
		this.popGraph = false;

		// whether population graph uses lines or points
		this.popGraphLines = true;

		// graph opacity
		this.popGraphOpacity = ViewConstants.defaultOpacity;

		// whether graph disable
		this.graphDisabled = false;

		// whether integer zoom enforced
		this.integerZoom = false;

		// save the document element containing the rle
		this.element = element;

		// whether infobar displayed
		this.infoBarEnabled = false;

		// current box speed
		this.currentTrackSpeedN = 0;
		this.currentTrackSpeedS = 0;
		this.currentTrackSpeedE = 0;
		this.currentTrackSpeedW = 0;

		// track box speeds
		this.trackBoxN = 0;
		this.trackBoxS = 0;
		this.trackBoxE = 0;
		this.trackBoxW = 0;

		// whether track box defined
		this.trackBoxDefined = false;

		// whether track defined
		this.trackDefined = false;

		// whether trackloop defined
		this.trackLoopDefined = false;

		// whether track disabled
		this.trackDisabled = false;

		// whether to display generation notifications
		this.genNotifications = true;

		// whether to display generation as relative or absolute
		this.genRelative = false;

		// generation offset from CXRLE Gen command
		this.genOffset = 0;
		this.genDefined = false;

		// x and y offset from CXRLE Pos command
		this.posXOffset = 0;
		this.posYOffset = 0;
		this.posDefined = false;

		// failure reason
		this.failureReason = "";

		// x offset
		this.xOffset = 0;
		this.yOffset = 0;

		// current POI number
		this.currentPOI = -1;

		// start point for POI
		this.startXPOI = -1;
		this.startYPOI = -1;
		this.startZoomPOI = -1;
		this.startAnglePOI = -1;
		this.startDepthPOI = -1;
		this.startLayersPOI = -1;

		// destination point for POI
		this.endXPOI = -1;
		this.endYPOI = -1;
		this.endZoomPOI = -1;
		this.endAnglePOI = -1;
		this.endDepthPOI = -1;
		this.endLayersPOI = -1;

		// whether depth and layers are used at the POI
		this.depthPOIused = false;
		this.layersPOIused = false;

		// steps for POI transition
		this.stepsPOI = -1;

		// target steps for POI transition
		this.targetPOI = -1;

		// whether computing history
		this.computeHistory = false;

		// history target generation
		this.computeHistoryTarget = 0;

		// when compute history finishes clear notification
		this.computeHistoryClear = true;

		// whether autofit is on
		this.autoFit = false;

		// whether autofit is defined
		this.autoFitDefined = false;

		// delta between target auto fit zoom and current zoom
		this.autoFitDelta = 0;

		// threshold for auto fit delta to be small enough not to matter
		this.autoFitThreshold = 0.01;

		// weight for auto fit average (target is one part in n)
		this.autoFitWeight = 6;

		// whether autofit is in history fit mode
		this.historyFit = false;

		// whether autofit only uses state 1
		this.state1Fit = false;

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
		this.windowTitle = "";

		// flag if history is disabled
		this.noHistory = false;

		// flag if pattern is executable
		this.executable = false;

		// flag if stars are used
		this.starsOn = false;

		// create and initialise stars
		this.starField = null;

		// whether viewer is in popup window
		this.isInPopup = false;

		// line number for error and script drawing
		this.lineNo = 1;

		// performance colour red component
		this.perfColRed = 0;

		// performance colour green component
		this.perfColGreen = 0;

		// whether just started
		this.justStarted = false;

		// whether controls are locked (during waypoint playback)
		this.controlsLocked = false;

		// waypoint manager
		this.waypointManager = new WaypointManager();

		// last waypoint message
		this.lastWaypointMessage = "";

		// last waypoint theme
		this.lastWaypointTheme = -1;

		// whether waypoint defined
		this.waypointsDefined = false;

		// whether a manual change happened
		this.manualChange = false;

		// generations per step
		this.gensPerStep = 1;

		// number of script commands and errors
		this.numScriptCommands = 0;
		this.numScriptErrors = 0;

		// number of frames when fading after stop
		this.fading = 0;

		// maximum width due to code element
		this.maxCodeWidth = ViewConstants.maxViewerWidth;

		// generation that life died
		this.diedGeneration = -1;

		// requested viewer width and height
		this.requestedWidth = -1;
		this.requestedHeight = -1;

		// requested popup viewer width and height
		this.requestedPopupWidth = -1;
		this.requestedPopupHeight = -1;

		// pattern name and originator
		this.patternName = "";
		this.patternOriginator = "";

		// pattern width and height
		this.patternWidth = 0;
		this.patternHeight = 0;

		// number of pattern states
		this.patternStates = 0;

		// number of used pattern states
		this.patternUsedStates = 0;

		// number of cells in each state
		this.patternStateCount = null;

		// pattern format
		this.patternFormat = "";

		// pattern rule name
		this.patternRuleName = "";

		// pattern alias name
		this.patternAliasName = "";

		// whether using custom theme
		this.customTheme = false;

		// custom theme value
		this.customThemeValue = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

		// custom grid colour
		this.customGridColour = -1;

		// custom grid major colour
		this.customGridMajorColour = -1;

		// custom label colour
		this.customLabelColour = ViewConstants.labelFontColour;

		// colour set used
		this.colourSetName = "";
		this.colourSetSize = 0;
		this.colourList = [];

		// whether all colours are custom
		this.allCustom = false;

		// custom colour set
		this.customColours = [];

		// whether custom colour used
		this.customColourUsed = [];

		// script error list
		this.scriptErrors = [];

		// error display line
		this.displayErrors = 1;

		// help display line
		this.displayHelp = 0;

		// number of help lines
		this.numHelpLines = 100;

		// number of help lines per page
		this.numHelpPerPage = 10;

		// script help line
		this.scriptHelpLine = 1;

		// information help line
		this.infoHelpLine = 1;

		// further tab positions
		this.tabs = [64, 200, 290, 530, 700];

		// help information sections
		this.helpSections = [];

		// help topics
		this.helpTopics = [];

		// generation number to stop at
		this.stopGeneration = -1;

		// generation number to loop from
		this.loopGeneration = -1;

		// flag if loop temporary disabled
		this.loopDisabled = false;

		// flag if waypoints disabled
		this.waypointsDisabled = false;

		// whether to disable playback
		this.viewOnly = false;

		// whether to disable GUI
		this.noGUI = false;

		// whether NOGUI defined
		this.noGUIDefined = false;

		// whether to hide pattern source
		this.hideSource = false;

		// whether to disable pattern copy
		this.noCopy = false;

		// whether multi-state view used
		this.multiStateView = false;

		// whether to autostart
		this.autoStart = false;
		this.autoStartDisabled = false;

		// whether reset is always hard
		this.hardReset = false;

		// whether to perform strict script command validation
		this.strict = false;

		// moveable menu items original position
		this.playListX = -1;
		this.generationRangeX = -1;
		this.stepRangeX = -1;

		// life engine
		this.engine = null;

		// elapsed time
		this.elapsedTime = 0;

		// default grid width
		this.defaultGridWidth = 512;

		// default grid height
		this.defaultGridHeight = 512;

		// display width
		this.displayWidth = 640;

		// display height
		this.displayHeight = 512;

		// whether popup width has changed
		this.popupWidthChanged = false;
		this.lastPopupWidth = 640;

		// whether life generation is on
		this.generationOn = false;

		// whether to generate next step
		this.nextStep = false;

		// whether step is single generation
		this.singleStep = false;

		// whether stats displayed
		this.statsOn = false;

		// generation range item
		this.generationRange = null;

		// speed step range item
		this.stepRange = null;

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

		// help topics list
		this.topicsList = null;

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

		// hex toggle button
		this.hexButton = null;

		// graph toggle button
		this.graphButton = null;

		// close button for graph
		this.graphCloseButton = null;

		// infobar button
		this.infoBarButton = null;

		// stars button
		this.starsButton = null;

		// timing button
		this.fpsButton = null;

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

		// play list (play/pause buttons)
		this.playList = null;

		// current steps before next view theme change
		this.viewSteps = 30;

		// last drag position
		this.lastDragX = -1;
		this.lastDragY = -1;

		// mouse wheel delta
		this.wheelDelta = 0;

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
		this.genSpeed = 60;

		// menu manager
		this.menuManager = null;

		// view menu
		this.viewMenu = null;

		// target position
		this.targetX = 0;
		this.targetY = 0;

		// target zoom
		this.targetZoom = 0;

		// default camera
		this.defaultAngle = 0;
		this.defaultX = 0;
		this.defaultY = 0;
		this.defaultZoom = 1;
		this.defaultTheme = 1;
		this.defaultGPS = 60;
		this.defaultStep = 1;
		this.defaultLayers = 1;
		this.defaultDepth = 0.1;

		// saved camera
		this.savedAngle = 0;
		this.savedX = 0;
		this.savedY = 0;
		this.savedZoom = 1;

		// flags if default used
		this.defaultZoomUsed = false;
		this.defaultXUsed = false;
		this.defaultYUsed = false;

		// flag if thumbnail mode on
		this.thumbnail = false;

		// flag if thumbnail was ever on
		this.thumbnailEverOn = false;

		// thumbnail divisor
		this.thumbnailDivisor = ViewConstants.defaultThumbSize;

		// original width, height and zoom to set when thumbnail clicked
		this.thumbOrigWidth = 0;
		this.thumbOrigHeight = 0;
		this.thumbOrigZoom = 0;

		// help text position
		this.thumbOrigHelpPosition = 0;

		// whether clicking on thumbnail launches popup viewer
		this.thumbLaunch = false;

		// whether thumbnail zoom defined
		this.thumbZoomDefined = false;
		this.thumbZoomValue = 0;

		// screenshot scheduled
		this.screenShotScheduled = 0;

		// whether drawing
		this.drawing = false;

		// whether notified that Pan active
		this.panNotified = false;

		// pen colour for drawing
		this.penColour = -1;
	}

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
						// reverse order for rendering
						state = multiStateRow[x];
						if (state > 0) {
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
		// check specified width and height
		if (this.specifiedWidth !== -1) {
			width = this.specifiedWidth;
		}
		if (this.specifiedHeight !== -1) {
			height = this.specifiedHeight;
		}

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
		    
			// rotation
			theta = 0, radius = 0,

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
			yPos = Math.floor(displayY / this.engine.zoom - engineY + this.engine.originY);
			xPos = Math.floor((displayX / this.engine.zoom) + (this.engine.isHex ? engineY / 2 : 0) - engineX + this.engine.originX);

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
			yPos = Math.floor(displayY / this.engine.zoom - engineY + this.engine.originY);
			xPos = Math.floor((displayX / this.engine.zoom) + (this.engine.isHex ? engineY / 2 : 0) - engineX + this.engine.originX);
		}

		// set cell position
		this.cellX = xPos + this.panX;
		this.cellY = yPos + this.panY;
	};

	// draw a single cell
	View.prototype.drawCell = function(x, y, colour) {
		this.engine.setState(x, y, colour);
	};

	// draw a line of cells using Bresenham
	View.prototype.drawCellLine = function(startX, startY, endX, endY, colour) {
		var dx = Math.abs(endX - startX),
		    dy = Math.abs(endY - startY),
		    sx = (startX < endX) ? 1 : -1,
		    sy = (startY < endY) ? 1 : -1,
		    err = dx - dy,
		    e2 = 0,
		    w = this.engine.width,
		    h = this.engine.height;

		// see if the line is on the display
		if (!((startX < 0 && endX < 0) || (startX >= w && endX >= w) || (startY < 0 && endY < 0) || (startY >= h && endY >= h))) {
			// see if bounds checking is required
			if (startX >= 0 && startX < w && startY >=0 && startY < h && endX >= 0 && endX < w && endY >= 0 && endY < h) {
				// line all on display so no bounds checking
				// set the first point
				this.drawCell(startX, startY, colour);

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
					this.drawCell(startX, startY, colour);
				}
			} else {
				// some or all of the line is off display so use bounds checking
				// set the first point
				if (startX >= 0 && startX < w && startY >=0 && startY < h) {
					this.drawCell(startX, startY, colour);
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
						this.drawCell(startX, startY, colour);
					}
				}
			}
		}
	};

	// set the x/y position on the UI
	View.prototype.setXYPosition = function() {
		// position relative to display width and height
		var displayX = this.viewMenu.mouseX - this.displayWidth / 2,
		    displayY = this.viewMenu.mouseY - this.displayHeight / 2,

		    // engine camera x and y
		    engineY = this.panY - this.engine.yOff,
		    engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

		    // cell position
		    yPos = 0, xPos = 0,
		    
		    // display strings
		    xDisplay = "",
		    yDisplay = "",
			stateDisplay = "",
			
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
			yPos = Math.floor(displayY / this.engine.zoom - engineY + this.engine.originY);
			xPos = Math.floor((displayX / this.engine.zoom) + (this.engine.isHex ? engineY / 2 : 0) - engineX + this.engine.originX);

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
			if (xPos < -9999 || xPos > 9999) {
				xDisplay = (Number(xPos / 10000).toFixed(1)) + "K";
			} else {
				xDisplay = String(xPos);
			}
			if (yPos < -9999 || yPos > 9999) {
				yDisplay = (Number(yPos / 10000).toFixed(1)) + "K";
			} else {
				yDisplay = String(yPos);
			}

			// set the caption
			this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + stateDisplay;
			this.xyLabel.deleted = false;
		}

		// set visibility based on stats toggle and whether paused
		if (this.statsOn || (this.playList.current === ViewConstants.modePause && this.viewMenu.mouseX !== -1)) {
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

		    // colour for performance issue
		    controlColour = "", 

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
			borderSize = 0;

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
		if (me.playList.current !== ViewConstants.modePause) {
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
		if (me.waypointsDefined && !me.waypointsDisabled && me.playList.current !== ViewConstants.modePause) {
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
				if (me.playList.current !== ViewConstants.modePause) {
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
					me.engine.setTheme(currentWaypoint.theme, me.engine.colourChangeSteps);
					if (me.themeItem) {
						me.themeItem.current = [currentWaypoint.theme, currentWaypoint.theme];
					}

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
			if (me.autoFit && me.playList.current !== ViewConstants.modePause) {
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
					if (me.engine.themeHistory || ((me.engine.counter === (me.floatCounter | 0)) || bailout)) {
						// convert life grid to pen colours
						me.engine.convertToPensTile();
					}

					// save elasped time for this generation
					me.saveElapsedTime(timeSinceLastUpdate, me.gensPerStep); // TBD was stepsToTake

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
					me.fading = this.historyStates + (this.engine.multiNumStates > 0 ? this.engine.multiNumStates : 0);

					// remember the generation that life stopped
					if (me.diedGeneration === -1) {
						me.diedGeneration = me.engine.counter;

						// notify simulation stopped unless loop defined and enabled
						if (me.genNotifications && !(me.loopGeneration !== -1 && !me.loopDisabled)) {
							me.menuManager.notification.notify("Life ended at generation " + me.diedGeneration, 15, 600, 15, true);
						}
					}
				}

				// remove steps not taken from target counter
				me.floatCounter -= (stepsToTake - stepsTaken);
			} else {
				// check if still fading
				if (me.fading) {
					// decrease fade time
					me.fading -= 1;

					// update colour grid
					me.engine.convertToPensTile();
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
		}

		// lock or unlock the controls
		me.autoFitToggle.locked = me.controlsLocked && me.waypointsDefined;
		me.fitButton.locked = me.controlsLocked || me.autoFit;
		me.generationRange.locked = me.controlsLocked && me.waypointsDefined;
		me.stepRange.locked = me.controlsLocked && me.waypointsDefined;
		me.themeItem.locked = me.controlsLocked && me.waypointsDefined;
		me.zoomItem.locked = me.controlsLocked;
		me.angleItem.locked = me.controlsLocked;
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
		if (me.autoFit && (me.playList.current !== ViewConstants.modePause || me.waypointsDefined)) {
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
			if (me.engine.isHROT && ((me.engine.HROT.range * 2 + 1) > ViewConstants.maxStepSpeed)) {
				borderSize = me.engine.HROT.range * 4 + 1;
				if (this.engine.boundedGridType !== -1) {
					borderSize += this.engine.HROT.range * 2;
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

		// draw any labels
		if (me.showLabels) {
			me.waypointManager.drawLabels(me);
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

		// update gps and step control background based on performance
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

		// set the background on the generation and step UI controls
		if (me.perfColGreen < ViewConstants.perfMaxGreen) {
			controlColour = "rgb(" + me.perfColRed + "," + me.perfColGreen + ",0)";
		} else {
			controlColour = "rgb(" + me.perfColRed + "," + (2 * ViewConstants.perfMaxGreen - me.perfColGreen) + ",0)";
		}
		me.stepRange.bgCol = controlColour;

		// set the background on the generation UI control using frameskip only
		controlColour = "rgb(" + me.perfColRed + ",0,0)";
		me.generationRange.bgCol = controlColour;

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
		var i = 0;

		// top menu buttons
		this.autoFitToggle.deleted = hide;
		this.zoomItem.deleted = hide || this.popGraph;
		this.fitButton.deleted = hide;
		this.gridToggle.deleted = hide;
		this.autostartIndicator.deleted = hide || this.popGraph;
		this.stopIndicator.deleted = hide || this.popGraph;
		this.waypointsIndicator.deleted = hide || this.popGraph;
		this.loopIndicator.deleted = hide || this.popGraph;

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
		this.angleItem.deleted = hide || this.engine.isHex;
		this.depthItem.deleted = hide;
		this.themeItem.deleted = hide || this.multiStateView;
		this.layersItem.deleted = hide;
		this.fitButton.deleted = hide;
		this.shrinkButton.deleted = hide || !this.thumbnailEverOn;
		this.closeButton.deleted = !(this.isInPopup || this.scriptErrors.length);
		this.hexButton.deleted = hide;
		this.graphButton.deleted = hide;
		this.infoBarButton.deleted = hide;
		this.starsButton.deleted = hide;
		this.fpsButton.deleted = hide;
		this.timingDetailButton.deleted = hide;

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
			this.closeButton.icon = ViewConstants.iconManager.icon("esc");
			this.closeButton.preText = "";
		} else {
			this.closeButton.toolTip = "close window";
			this.closeButton.icon = null;
			this.closeButton.preText = "X";
		}

		// update help topics
		i = 0;
		while (i < this.helpTopics.length && this.helpTopics[i] <= this.displayHelp) {
			i += 1;
		}
		if (i < 1) {
			i = 1;
		}
		this.topicsList.current = [i - 1];

		// update help topics controls
		this.topicsButton.deleted = this.showTopics;
		this.topicsList.deleted = !this.showTopics;
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
			me.engine.nextGeneration(false, 0, noSnapshots, me.graphDisabled);
			me.engine.convertToPensTile();
		}

		// check if complete
		if (me.engine.counter === targetGen - 1) {
			// compute final generation with stats on if required
			me.engine.nextGeneration(me.statsOn, 0, false, me.graphDisabled);
			me.engine.convertToPensTile();

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
			me.viewAnimateNormal(timeSinceLastUpdate, me);
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
		var result, newTheme;

		// check if changing
		if (change) {
			// set the theme
			newTheme = (newValue[0] + 0.5) | 0;

			// check if it has changed
			if (me.engine.colourTheme !== newTheme) {
				me.engine.setTheme(newTheme, me.engine.colourChangeSteps);
				
				// check for custom theme
				if (me.customTheme && newTheme === me.engine.numThemes) {
					me.menuManager.notification.notify("Custom Theme", 15, 40, 15, true);
				} else {
					me.menuManager.notification.notify("Theme " + newTheme, 15, 40, 15, true);
				}
			}
			result = newValue[0];
		} else {
			result = me.engine.colourTheme;
		}

		// return value
		return [result, me.engine.colourTheme];
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
			me.engine.setTheme(me.defaultTheme, 1);
			me.themeItem.current = [me.defaultTheme, me.defaultTheme];
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
	};

	// set the pause icon to pause or step forward based on play mode
	View.prototype.setPauseIcon = function(isPlaying) {
		// check if playing
		if (isPlaying) {
			// set to pause icon
			this.playList.icon[2] = ViewConstants.iconManager.icon("pause");
			this.playList.toolTip[2] = "pause";
		} else {
			// set to step forward icon
			this.playList.icon[2] = ViewConstants.iconManager.icon("stepforward");
			this.playList.toolTip[2] = "next generation";
		}
	};

	// help topics list
	View.prototype.viewTopicsList = function(newValue, change, me) {
		var result = newValue;

		if (change) {
			// switch to required topic
			me.displayHelp = me.helpTopics[newValue];

			// close topics list
			me.showTopics = false;
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
				} else {
					newValue = ViewConstants.modePause;
					me.generationOn = false;
				}

				// reset
				me.reset(me);

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
				if (me.playList.current !== ViewConstants.modePlay) {
					// play
					me.generationOn = true;

					// zoom text
					me.menuManager.notification.notify("Play", 15, 40, 15, true);
				}
				break;

			case ViewConstants.modeStepBack:
				// step back
				if (!me.generationOn) {
					// check if at start
					if (me.engine.counter > 0) {
						// run from start to previous generation
						me.runTo(me.engine.counter - me.gensPerStep);
					}
				} else {
					// pause
					me.generationOn = false;

					// zoom text
					me.menuManager.notification.notify("Pause", 15, 40, 15, true);
				}

				// switch to pause after this
				newValue = ViewConstants.modePause;
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
			endCellY = 0;

		// check if this is the start of drawing
		if (fromX === -1 && fromY === -1) {
			// set the pen to the state at the current position
			this.penColour = this.readCell();
			if (this.engine.multiNumStates <= 2) {
				this.penColour = 1 - this.penColour;
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
			this.drawCellLine(startCellX, startCellY, endCellX, endCellY, this.penColour);
		}
	};

	// view menu background drag
	View.prototype.viewDrag = function(x, y, dragOn, me) {
		var dx = 0,
		    dy = 0,
		    angle = 0,
		    sinAngle = 0,
			cosAngle = 0,
			stillDrawing = me.drawing;

		// check if this is a drag or cancel drag
		if (dragOn) {
			if (me.drawing && me.engine.zoom < 1) {
				stillDrawing = false;
				if (!me.panNotified) {
					me.menuManager.notification.notify("Pan active: Zoom in to draw", 15, 120, 15, true);
					me.panNotified = true;
				}
			}
			if (stillDrawing) {
				me.drawCells(x, y, me.lastDragX, me.lastDragY);
			} else {
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
							dy = (me.lastDragY - y) / me.engine.camZoom;
	
							// check for hex
							if (me.engine.isHex) {
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
			}

			// save last drag position
			me.lastDragX = x;
			me.lastDragY = y;
		} else {
			// drag finished
			me.lastDragX = -1;
			me.lastDragY = -1;
			me.panNotified = false;
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
		this.viewDrag(dx, dy, true, this);
		this.lastDragX = -1;
		this.lastDragY = -1;
	};

	// create icons
	View.prototype.createIcons = function(context) {
		// load icon file
		var w = 40,
		    h = 40,
		    iconManager = null,
		    icons = ViewConstants.icons;

		// check if the icons exist
		if (icons === null) {
			// create the icon image
			icons = new Image();

			// load the icons from the image file
			icons.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAAoCAIAAACtuRNjAAAABnRSTlMAAAAAAABupgeRAAAKbElEQVR4nO2dvW/jxhLAZx9OgXSBLoUKGXCjAFSKIPUVUv8A2o2b+B8IIBcpSBfXXZkuhagihQS86goDV7k56S+QilcfrogIhI0Bp1CRE3I2YgObYimK35+7/JwfDMMWyd2dmeXO7nKGAkAQBEEQBEGQOqGqqtDPkfwRbdMm2/pF0Q1AEP5QSl2fEEJyKLmoepsGpTQf8XOrCCkWdIRIbRExhIW7vWLrbQ6EEJeL4uKxRJRZA5qgh/8U3QAEEQIbK8WVHzQ6FFVv00A9IxxBR4jUFnFjZfgoWVS9TQP1jPACHSFSZ0SMlXFGyaLqbRqoZ4QL6AiRmsN3rIw/ShZVb9NAPSPZCTR5UR0iaQACl4AFeyFZpK7TXcR0YonDKzAkshxXvbwQEUxRknrzj3rXNC3nGr2ICKMtZ2hu4fYVNKxVY7SkB4qq1wWv8yMLydjs+JcMKOX7k67lMcXhouc45RTV8WoG5pbVmzztK+JmLNttHr01WqrmlpB0+uHrt/iWWRJzl6QZCIJwh60Fy7MijPuMEN2hl1rqpFQSlaoxCILwYkC35fGCkDShnop5flM56jpAl1AuWokHCfxwmaBRsvMiaTdGJSNp3izTZHfIy1UYhHDfHTWyWaSEXpDRNF+IZCd+hyltt68xA7o1yLDoVjhI/4q1prlD7jdMRr/Fl5IPB+gLEQQRR9Y8wlo+J3NRexkrIV2WRra17YDSU23EsT0lR/sydQQVb7V22OmTm+l0QJddv2N9SoMOsWv7lA7otmfX7kg7jbjKfm3kaSWEtdz9058AwARMpdFwE3SXx6NJO2eO9uVM8uWgv6pjSJ0APi/druvqsBIeIiMVkjHtunD09bkEAK3zy7a6eYx3TXdJX96SPxfJa8sdbwT8u5+nXcn5kaScUGU/BoBr34j5GwAAGYCq6rVfJY5DZcgjrB6ScrKF+6HKemB3SXvy8WBLWZ/C+E7deK9D+xZJUL5XJILq5XV+ZCHhxYoWP2fii8NL3tQVpdfwSDultL9culctwRf0ttbsvnqw5e+A0qOw5vqMDpaTFHlmlVsRJuokae/ZkJZbK0LbUVMhlpYcSjNNFrW+YTYKt6/3/KByLKymBp0fU0VxThvQbZyinJgrQqH3I/9XrFXRH9jJrf2FJ9RX1ExJm92+PG+B/vzL7QNI3bfWzeQayKx/R73tmk23O/Pj2GSNPlm2WON49KxeHybfKBKAvh/DzlpdbNS7qxXos/sztsI1R+H+kgm17Y1cW2fmVGBA6c2XafI2+GBXYMCIdjDBZHk4U8h+XTHdfvP+UQcA6cUP9k+l9uUIAB7VoUGIcVgshuJjX/W14Wvfm//+bNnX5Zgt+/YnPJOPCxtSRpP+1hoJt33nHdrWlqfWzbv0n22Ietdo1d2haLiHjCYts9LWSdL40dfnEugf/t4svqwA5IsUY2t3SU+U41ZUS1m7pt4lYvT9CwDQP/zt2mNbnHnGWakjM6G2/zhOPk4FAKAzh06siqXu2jYtWyst2zGXAjvzkMmE3JvLx7/5PQSy4PoER+7ZJ6MhvWJ02ZYAQH/+yP5ffFkBsL6UaK3Dw772ndXY9o3gW9DZ75A1n7Bg0Ul/Pe8c+5fUUdaWStva9kSRrd7YkpUTv06FL91Gag0bgLafHgH2tysA+WXEoLPZDcd7HQDg4YoYQ/VxpL2SAUDfj4lBiDGePQGAPC/pxukP37Uc/x/XdmyN9T/tuMJ7mo0NQgxytndcYQ7ZprxXmZvEFKjP7gkxCDHI1QNAS3kbNCM5tOrqAQAk5RseenbtvXMoMRY2N8lmBjYHtj8zuxmwvYeY+/Z+9r2dTm1r6KN0Odn34OEIIQYZGmQ4oNtUW6ARdObuPTBzOjW56AAcJBrvVgAAnTdaGwBGWk+RwFIFu3n9OpUoR0gIqV/sTJ2otHXiN759ed4CAHk+oHQwlwGgc5FwZGVDz+pXcydqo35eAQC8+L6UMagff3+Ke6r++N4nNMMt7wIe4pVmDqzENl2wFygpJ+b4Ne8AAAy/8tff6rMZMGKumbjo2d5huPb81Y7YpD4Lja1aXTkXbZvd0K4oqbuOsRWcxL4/Gq99Pk5p30C86zzLHYafxg1TJ1J3vT1dXn51O7639pnNecOhU23UO0IM4hMEx98RVt0F5tN+EUmEScusqJmSNNuMF3WQane0Mmw+PYN9zrvZDT2eqRS4npblQe7PsWK4STY0m9YJmhzYz/ex78X1dVH2DXFv9qUhF50/XNmUSYhByN3Bve2uVswXtmSlO1+fUHqa8OEFT0dYdRdoJwdZXEbN/pOiDZWzV7IGs12g46Yc2a3AuTtq/t3W3tielGz+sc9l2XxTfmPuXB12Sv2XU1GNt5P6nFAWf810AOjMwb7V1n2rtAIvceKUt61lfoZkTtidXsFvVg4AAPIr8/Hh5KUMAPD8KbGegyjRi55ZQJD1sIq5t1iUyL6Rizy2NGRe8A/wTEn58bg4uyPEGI93V7MHXQeAlnXDxoNPHmEp+pYAmFyVjiuJRMR3fAsiaTdj+6JPH95b+1H721VPljsXE1h8fNYBJOjM6WDuf3lnTgdvZvdD9fNK6clSd02PS0lrZykbLs17bRFHZHfUu/HbO33alcDRYMZK/km9Bnh5AwAg2VPHjnlmr6/f6dCSnPJmyTPbMAXKPUp71of67D4gSLKlrAfK8bS/qpDKmZjF7cNc7kjKCVWOH3pDYADAaV9VVb32vQUwFeu077v/T61L49jXykGMtC+l9FvQY251sl4tzke0te2JIgGs9uOz3WKzh+9O55I5Lfj4+xPILZBfaaO9uoHRpL+edwCeZv4pmz5EpnMJigtNWhGXhmWpSLRC8iFSHF7y5lYRmDHirhgEWxy5lX1FaX/ijC/3RPBzSZ/w4pWRW3ea+L+DQ1VVv8w/V3j9yB5ezyWP0P4WFVvCnL1ebukTifSWVskJ8wh9cMYxJY2Pzc++bhXlPtYFv1nGlNHvBL/EpzT9Kmg8Eq2FpNVxaV78C4tSSw6Ei8NL3shyaqbVcLxi8hK8gl/Myy25PpHeKtq7iv1i3nyVFukIAWDUW9qmqs5kwfbEkUfY9ZvHptkaretGaBw4bpZyTyXMGIBT2j3SJvc3JB3l7Mm1Id9bcvEnidwf3+zOhruAY4+Ls7uoApI5QhySGNndoaCE+vr5QuxySFKwzyBJiesIsW95qWUoTal8Ye17nVfA2oscTJyJP4IIITp9ok5JESKon35KIk5JmoEgSO0Jc4T1G+LFkVRXZUioD6Fwu3NvAJdlbrrgoELqrT0iIqqaE6WFuEA/h9QQ6sxbovzSmMJLLqTeHAM7Tcr2fXWU0/eh8iqHL4Xbl2M3RhAkP1z5GLkVXlS9XiqYPpESK+2kVEWJQLRNM34fYaXBb59A6oyIyWyceKKi6m0aqGeEC3xesYYgJUTclk74W6OKqrdpoJ5zQ/TMoHBVoyNE6onogSxo3VBUvU0jHz0XPkCXgSYoAR0hUlvsDoNj0Epp620OXhfFRc/eMtEXNgR0hEgNETd4hZdcVL1NIzdtoNoRBEEQBKk//wISAO73Ikeq8AAAAABJRU5ErkJggg==";
				
			// save the image
			ViewConstants.icons = icons;
		}

		// create the icon manager
		iconManager = new IconManager(icons, context);

		// add the icons
		iconManager.add("play", w, h);
		iconManager.add("pause", w, h);
		iconManager.add("tostart", w, h);
		iconManager.add("menu", w, h);
		iconManager.add("stepback", w, h);
		iconManager.add("stepforward", w, h);
		iconManager.add("autofit", w, h);
		iconManager.add("fit", w, h);
		iconManager.add("grid", w, h);
		iconManager.add("help", w, h);
		iconManager.add("shrink", w, h);
		iconManager.add("fps", w, h);
		iconManager.add("hexgrid", w, h);
		iconManager.add("lines", w, h);
		iconManager.add("esc", w, h);

		// return the icon manager
		return iconManager;
	};

	// update grid icon based on hex or square mode
	View.prototype.updateGridIcon = function() {
		// check for hex mode
		if (this.engine.isHex) {
			this.gridToggle.icon = [ViewConstants.iconManager.icon("hexgrid")];
		} else {
			this.gridToggle.icon = [ViewConstants.iconManager.icon("grid")];
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
		var linearComplete = this.stepsPOI / this.targetPOI,

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
			this.engine.angle = endAngle;
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
				if (me.playList.current !== ViewConstants.modePause) {
					me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
				}
			}
		}

		// check if theme defined
		if (poi.themeDefined) {
			// set the new theme
			me.themeItem.current = me.viewThemeRange([poi.theme, poi.theme], true, me);
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

	// topics button
	View.prototype.topicsPressed = function(me) {
		me.showTopics = true;
	};

	// fit button
	View.prototype.fitPressed = function(me) {
		// fit zoom
		me.fitZoomDisplay(true, true);

		// flag manual change made if paused
		if (me.playList.current === ViewConstants.modePause) {
			me.manualChange = true;
		}
	};

	// grid toggle
	View.prototype.toggleGrid = function(newValue, change, me) {
		if (change) {
			me.engine.displayGrid = newValue[0];
			me.menuManager.notification.notify("Grid Lines " + (me.engine.displayGrid ? "On" : "Off"), 15, 40, 15, true);
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

	// autofit toggle
	View.prototype.toggleAutoFit = function(newValue, change, me) {
		if (change) {
			me.autoFit = newValue[0];
			me.menuManager.notification.notify("AutoFit " + (me.autoFit ? "On" : "Off"), 15, 40, 15, true);

			// autofit now if just switched on and playback paused
			if (me.autoFit && me.playList.current === ViewConstants.modePause) {
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
			if (me.displayHelp <= me.helpSections[i]) {
				i = i - 1;
			} else {
				found = true;
			}
		}
		if (found) {
			me.displayHelp = me.helpSections[i];
		}
	};

	// move to next help section
	View.prototype.nextHelpSection = function(me) {
		// find help section after current line
		var i = 0,
		    found = false;

		while (i < me.helpSections.length && !found) {
			if (me.displayHelp >= me.helpSections[i]) {
				i = i + 1;
			} else {
				found = true;
			}
		}
		if (found) {
			me.displayHelp = me.helpSections[i];
		}
	};

	// run to given generation (used to step back)
	View.prototype.runTo = function(targetGen) {
		// check whether history enabled
		if (this.noHistory) {
			this.menuManager.notification.notify("Step back disabled", 15, 40, 15, true);
		} else {
			// ensure target generation is not negative
			if (targetGen < 0) {
				targetGen = 0;
			}

			// restore the elapsed time
			this.elapsedTime = this.elapsedTimes[targetGen];
			this.floatCounter = targetGen;
			this.originCounter = targetGen;

			// run to target generation
			this.engine.runTo(targetGen, this.statsOn, this.graphDisabled);

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
	};

	// copy string to clipboard
	View.prototype.copyToClipboard = function(me, contents) {
		// copy the element contents to a temporary off-screen element
		// since selection doesn't work on hidden elements
		var tempInput = document.createElement("textarea");
		tempInput.innerHTML = contents;
		document.body.appendChild(tempInput);

		// select and copy the temporary elements contents to the clipboard
		tempInput.select();
		try {
			document.execCommand("copy");
		}
		catch(err) {
		}

		// remove the temporary element
		document.body.removeChild(tempInput);

		// set focus to the canvas
		me.mainContext.canvas.focus();
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
			angleStr = me.engine.angle | 0;

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

			// add theme
			string += Keywords.themeWord + " " + me.engine.colourTheme + " "; 

			// add width and height
			string += Keywords.widthWord + " " + me.displayWidth + " ";
			string += Keywords.heightWord + " " + me.displayHeight + " ";

			// add script end
			string += Keywords.scriptEndWord + "\n";
		}

		// copy to clipboard
		me.copyToClipboard(me, string);
	};

	// select and copy rle
	View.prototype.copyRLE = function(me) {
		// copy the source pattern to the clipboard
		me.copyToClipboard(me, cleanPattern(me.element));
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
			// check for control (other than control-C) or meta
			if ((event.ctrlKey && keyCode !== 67) || event.metaKey) {
				// handle control-R since it would refresh the browser and Golly uses it for pattern reset
				if (!(event.ctrlKey && keyCode === 82)) {
					// clear key code so it is not handled here
					keyCode = -1;
				}
			}

			// check for alt-number
			if (event.altKey) {
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
								value = me.defaultTheme;
								me.themeItem.current = me.viewThemeRange([value, value], true, me);
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
				break;

			// b for back one step
			case 66:
				// do not move if in view only mode
				if (!me.viewOnly) {
					// check if paused
					if (me.playList.current === ViewConstants.modePause) {
						// check if at start
						if (me.engine.counter > 0) {
							// run from start to previous generation
							me.runTo(me.engine.counter - 1);
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
							}
						} else {
							// step forward
							me.nextStep = true;
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
				}
				else{
					// stop other viewers
					value = Controller.stopOtherViewers(me);
					if (value === 0) {
						me.menuManager.notification.notify("No other LifeViewers playing", 15, 100, 15, true);
					} else {
						if (value > 1) {
							me.menuManager.notification.notify("Paused " + value + " other LifeViewers", 15, 100, 15, true);
						} else {
							me.menuManager.notification.notify("Paused " + value + " other LifeViewer", 15, 100, 15, true);
						}
					}
				}
				break;

			// x for toggle grid lines
			case 88:
				// check for shift
				if (event.shiftKey) {
					// toggle major grid lines
					me.engine.gridLineMajorEnabled = !me.engine.gridLineMajorEnabled;
					if (me.engine.gridLineMajor > 0) {
						me.menuManager.notification.notify("Major Grid Lines " + (me.engine.gridLineMajorEnabled ? "On" : "Off"), 15, 40, 15, true);
					}
				} else {
					// toggle grid
					me.engine.displayGrid = !me.engine.displayGrid;
					me.gridToggle.current = me.toggleGrid([me.engine.displayGrid], true, me);
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

			// l for decrease depth or toggle loop
			case 76:
				// check for shift
				if (event.shiftKey) {
					me.showLabels = !me.showLabels;
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

			// s for toggle starfield, shift s for toggle state1 autofit
			case 83:
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
						if (me.playList.current === ViewConstants.modePause) {
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
				// zoom to 3200%
				me.changeZoom(me, 32, false);
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
							me.currentPOI -= 1;
							if (me.currentPOI < 0) {
								me.currentPOI = me.waypointManager.numPOIs() - 1;
							}

							// set camera
							me.setCameraFromPOI(me, me.currentPOI);
						} else {

							// got to next POI
							me.currentPOI += 1;
							if (me.currentPOI >= me.waypointManager.numPOIs()) {
								me.currentPOI = 0;
							}

							// set camera
							me.setCameraFromPOI(me, me.currentPOI);
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
					}
				} else {
					// fit zoom
					if (!me.fitButton.locked) {
						me.fitZoomDisplay(true, true);
						me.menuManager.notification.notify("Fit Zoom", 15, 80, 15, true);

						// flag manual change made if paused
						if (me.playList.current === ViewConstants.modePause) {
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
						me.copyRLE(me);
						me.menuManager.notification.notify("Copied to Clipboard", 15, 180, 15, true);
					}
				} else {
					// disable colour themes in multi-state mode
					if (!me.multiStateView) {
						if (me.themeItem && !me.themeItem.locked) {
							// check for shift key
							if (event.shiftKey) {
								// decrement colour theme
								value = me.themeItem.current[0];
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
								value = me.themeItem.current[0];
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
							me.themeItem.current = me.viewThemeRange([value, value], true, me);
						}
					}
				}
				break;

			// h for display help
			case 72:
				// check for shift key
				if (event.shiftKey) {
					// toggle history fit mode
					me.historyFit = !me.historyFit;
					me.menuManager.notification.notify("AutoFit History Mode " + (me.historyFit ? "On" : "Off"), 15, 40, 15, true);
				} else {
					// if errors then set script help page
					if (me.scriptErrors.length) {
						// toggle help page
						if (me.displayHelp) {
							me.displayHelp = 0;
						} else {
							me.displayHelp = me.scriptHelpLine;
						}
					} else {
						// toggle help
						if (me.displayHelp) {
							me.displayHelp = 0;
						} else {
							// do not display help if in thumbnail mode
							if (!me.thumbnail) {
								me.displayHelp = 1;
							}
						}
					}

					// update the help UI
					me.helpToggle.current = me.toggleHelp([me.displayHelp], true, me);
					me.topicsList.current = [ViewConstants.keysTopic];
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
						// check if on the info line
						if (me.displayHelp !== me.infoHelpLine) {
							me.displayHelp = me.infoHelpLine;
						} else {
							// close help
							me.displayHelp = 0;
						}
					} else {
						// do not display information if in thumbnail mode
						if (!me.thumbnail) {
							me.displayHelp = me.infoHelpLine;
						}
					}

					// update the help UI
					me.helpToggle.current = me.toggleHelp([me.displayHelp], true, me);
					me.topicsList.current = [ViewConstants.informationTopic];
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
					}
				}
				break;

			// f1 for toggle edit mode
			case 112:
				me.drawing = !me.drawing;
				me.menuManager.notification.notify("Edit Mode " + (me.drawing ? "On" : "Off"), 15, 40, 15, true);
				break;

			// ignore other keys
			default:
				// flag not handled
				if (keyCode === -1) {
					processed = false;
				}
				break;
			}
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
			// process the key
			processed = me.processKey(me, keyCode, event);
		}

		// check if key was handled
		if (processed) {
			// ensure UI updates
			me.menuManager.setAutoUpdate(true);

			// cancel further processing
			event.preventDefault();
		}
	};

	// create menus
	View.prototype.createMenus = function() {
		// View menu

		// create the view menu
		this.viewMenu = this.menuManager.createMenu(this.viewAnimate, this.viewStart, this);

		// add callback for background drag
		this.viewMenu.dragCallback = this.viewDrag;

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
		this.autostartIndicator = this.viewMenu.addListItem(null, Menu.northWest, 90, 0, 40, 20, ["START"], [false], Menu.multi);
		this.autostartIndicator.font = ViewConstants.smallMenuFont;
		this.autostartIndicator.toolTip = ["autostart indicator"];

		// stop indicator
		this.stopIndicator = this.viewMenu.addListItem(null, Menu.northWest, 90, 20, 40, 20, ["STOP"], [false], Menu.multi);
		this.stopIndicator.font = ViewConstants.smallMenuFont;
		this.stopIndicator.toolTip = ["stop indicator"];

		// waypoints indicator
		this.waypointsIndicator = this.viewMenu.addListItem(this.toggleWP, Menu.northEast, -130, 0, 40, 20, ["WAYPT"], [false], Menu.multi);
		this.waypointsIndicator.font = ViewConstants.smallMenuFont;
		this.waypointsIndicator.toolTip = ["toggle waypoint mode"];

		// loop indicator
		this.loopIndicator = this.viewMenu.addListItem(this.toggleLoop, Menu.northEast, -130, 20, 40, 20, ["LOOP"], [false], Menu.multi);
		this.loopIndicator.font = ViewConstants.smallMenuFont;
		this.loopIndicator.toolTip = ["toggle loop mode"];

		// help button
		this.helpToggle = this.viewMenu.addListItem(this.toggleHelp, Menu.northEast, -40, 0, 40, 40, [""], [false], Menu.multi);
		this.helpToggle.icon = [ViewConstants.iconManager.icon("help")];
		this.helpToggle.toolTip = ["toggle help display"];

		// help topics button
		this.topicsButton = this.viewMenu.addButtonItem(this.topicsPressed, Menu.northEast, -40, 50, 40, 40, ["<"]);
		this.topicsButton.toolTip = ["show help topics"];

		// help topic list
		this.topicsList = this.viewMenu.addListItem(this.viewTopicsList, Menu.northEast, -120, 50, 120, 240, ["Keys", "Scripts", "Info", "Memory", "Aliases", "Colours"], 0, Menu.single);
		this.topicsList.toolTip = ["", "", "", "", "", ""];
		this.topicsList.orientation = Menu.vertical;
		this.topicsList.textOrientation = Menu.horizontal;

		// autofit button
		this.autoFitToggle = this.viewMenu.addListItem(this.toggleAutoFit, Menu.northWest, 0, 0, 40, 40, [""], [false], Menu.multi);
		this.autoFitToggle.icon = [ViewConstants.iconManager.icon("autofit")];
		this.autoFitToggle.toolTip = ["toggle autofit"];

		// fit button
		this.fitButton = this.viewMenu.addButtonItem(this.fitPressed, Menu.northWest, 45, 0, 40, 40, "");
		this.fitButton.icon = ViewConstants.iconManager.icon("fit");
		this.fitButton.toolTip = "fit pattern to display";

		// grid toggle
		this.gridToggle = this.viewMenu.addListItem(this.toggleGrid, Menu.northEast, -85, 0, 40, 40, [""], [false], Menu.multi);
		this.gridToggle.icon = [ViewConstants.iconManager.icon("grid")];
		this.gridToggle.toolTip = ["toggle grid lines"];

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
		this.xyLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -70, 140, 30, "");
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
		this.zoomItem = this.viewMenu.addRangeItem(this.viewZoomRange, Menu.north, 0, 0, 212, 40, 0, 1, 0.1, true, "Zoom ", "x", 1);
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
		this.shrinkButton.icon = ViewConstants.iconManager.icon("shrink");
		this.shrinkButton.toolTip = "shrink to thumbnail";

		// hex/square toggle button
		this.hexButton = this.viewMenu.addListItem(this.viewHexToggle, Menu.northWest, 80, 100, 80, 40, ["Hex"], [this.engine.isHex], Menu.multi);
		this.hexButton.toolTip = ["toggle hex display"];

		// graph toggle button
		this.graphButton = this.viewMenu.addListItem(this.viewGraphToggle, Menu.northEast, -160, 100, 80, 40, ["Graph"], [this.popGraph], Menu.multi);
		this.graphButton.toolTip = ["toggle graph display"];

		// infobar toggle button
		this.infoBarButton = this.viewMenu.addListItem(this.viewInfoBarToggle, Menu.north, 0, 100, 80, 40, ["Info"], [this.infoBarEnabled], Menu.multi);
		this.infoBarButton.toolTip = ["toggle InfoBar"];

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

		// opacity range
		this.opacityItem = this.viewMenu.addRangeItem(this.viewOpacityRange, Menu.north, 0, 0, 212, 40, 0, 1, this.popGraphOpacity, true, "Opacity ", "%", 0);
		this.opacityItem.toolTip = "graph opacity";

		// points/lines toggle
		this.linesToggle = this.viewMenu.addListItem(this.toggleLines, Menu.northWest, 90, 0, 40, 40, [""], [false], Menu.multi);
		this.linesToggle.icon = [ViewConstants.iconManager.icon("lines")];
		this.linesToggle.toolTip = ["toggle graph lines/points"];

		// graph close button
		this.graphCloseButton = this.viewMenu.addButtonItem(this.graphClosePressed, Menu.northEast, -130, 0, 40, 40, "X");
		this.graphCloseButton.toolTip = "close graph";

		// add menu toggle button
		this.navToggle = this.viewMenu.addListItem(null, Menu.southEast, -40, -40, 40, 40, [""], [false], Menu.multi);
		this.navToggle.icon = [ViewConstants.iconManager.icon("menu")];
		this.navToggle.toolTip = ["toggle navigation menu"];

		// add the colour theme range
		this.themeItem = this.viewMenu.addRangeItem(this.viewThemeRange, Menu.south, 0, -90, 390, 40, 0, this.engine.numThemes - 1, 1, true, "Theme ", "", 0);
		this.themeItem.toolTip = "colour theme";

		// add the generation speed range
		this.generationRange = this.viewMenu.addRangeItem(this.viewGenerationRange, Menu.southEast, -375, -40, 80, 40, 0, 1, 0, true, "", "", -1);
		this.generationRange.toolTip = "steps per second";

		// add the speed step range
		this.stepRange = this.viewMenu.addRangeItem(this.viewStepRange, Menu.southEast, -290, -40, 80, 40, ViewConstants.minStepSpeed, ViewConstants.maxStepSpeed, 1, true, "x", "", 0);
		this.stepRange.toolTip = "generations per step";

		// add play and pause list
		this.playList = this.viewMenu.addListItem(this.viewPlayList, Menu.southEast, -205, -40, 160, 40, ["", "", "", ""], ViewConstants.modePause, Menu.single);
		this.playList.icon = [ViewConstants.iconManager.icon("tostart"), ViewConstants.iconManager.icon("stepback"), ViewConstants.iconManager.icon("pause"), ViewConstants.iconManager.icon("play")];
		this.playList.toolTip = ["reset", "previous generation", "pause", "play"];

		// add items to the main toggle menu
		this.navToggle.addItemsToToggleMenu([this.layersItem, this.depthItem, this.angleItem, this.themeItem, this.shrinkButton, this.closeButton, this.hexButton, this.graphButton, this.fpsButton, this.timingDetailButton, this.infoBarButton, this.starsButton], []);

		// add statistics items to the toggle
		this.genToggle.addItemsToToggleMenu([this.popLabel, this.popValue, this.birthsLabel, this.birthsValue, this.deathsLabel, this.deathsValue, this.timeLabel, this.elapsedTimeLabel, this.ruleLabel], []);

		// add items to the help toggle menu
		this.helpToggle.addItemsToToggleMenu([this.topicsButton, this.topicsList], []);
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

			// create the icons
			ViewConstants.iconManager = this.createIcons(this.offContext);

			// create the menu manager
			this.menuManager = new MenuManager(this.mainContext, this.offContext, "24px Arial", ViewConstants.iconManager, this, this.gotFocus);
			
			// disable fps display
			this.menuManager.showTiming = false;

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

	// check if a string is a script command
	View.prototype.isScriptCommand = function(tokenString) {
		var result = true;

		// check if the token is a script command
		switch (tokenString) {
			case Keywords.textColorWord:
			case Keywords.errorColorWord:
			case Keywords.showGenStatsWord:
			case Keywords.showTimingWord:
			case Keywords.extendedTimingWord:
			case Keywords.showInfoBarWord:
			case Keywords.noSourceWord:
			case Keywords.linearWord:
			case Keywords.bezierWord:
			case Keywords.hexDisplayWord:
			case Keywords.squareDisplayWord:
			case Keywords.randomSeedWord:
			case Keywords.deleteRangeWord:
			case Keywords.poiWord:
			case Keywords.titleWord:
			case Keywords.labelWord:
			case Keywords.labelAlphaWord:
			case Keywords.labelSizeWord:
			case Keywords.labelTWord:
			case Keywords.labelAngleWord:
			case Keywords.labelTargetWord:
			case Keywords.labelTrackWord:
			case Keywords.noHistoryWord:
			case Keywords.noReportWord:
			case Keywords.trackWord:
			case Keywords.hardResetWord:
			case Keywords.poiResetWord:
			case Keywords.poiStopWord:
			case Keywords.poiPlayWord:
			case Keywords.poiTWord:
			case Keywords.poiTransWord:
			case Keywords.initialWord:
			case Keywords.allWord:
			case Keywords.offWord:
			case Keywords.state1FitWord:
			case Keywords.trackBoxWord:
			case Keywords.trackLoopWord:
			case Keywords.graphWord:
			case Keywords.noGraphWord:
			case Keywords.graphOpacityWord:
			case Keywords.graphPointsWord:
			case Keywords.starfieldWord:
			case Keywords.maxGridSizeWord:
			case Keywords.autoFitWord:
			case Keywords.historyFitWord:
			case Keywords.historyStatesWord:
			case Keywords.tWord:
			case Keywords.stepWord:
			case Keywords.pauseWord:
			case Keywords.gridWord:
			case Keywords.gridMajorWord:
			case Keywords.strictWord:
			case Keywords.suppressWord:
			case Keywords.colorWord:
			case Keywords.colourWord:
			case Keywords.xWord:
			case Keywords.yWord:
			case Keywords.xOffsetWord:
			case Keywords.yOffsetWord:
			case Keywords.zoomWord:
			case Keywords.alternateZoomWord:
			case Keywords.integerZoomWord:
			case Keywords.loopWord:
			case Keywords.viewOnlyWord:
			case Keywords.noGUIWord:
			case Keywords.noCopyWord:
			case Keywords.thumbnailWord:
			case Keywords.thumbSizeWord:
			case Keywords.thumbLaunchWord:
			case Keywords.thumbZoomWord:
			case Keywords.autoStartWord:
			case Keywords.scriptStartWord:
			case Keywords.scriptEndWord:
			case Keywords.angleWord:
			case Keywords.themeWord:
			case Keywords.gpsWord:
			case Keywords.stopWord:
			case Keywords.layersWord:
			case Keywords.depthWord:
			case Keywords.widthWord:
			case Keywords.heightWord:
			case Keywords.popupWidthWord:
			case Keywords.popupHeightWord:
				result = true;
				break;
			default:
				result = false;
		}

		return result;
	};

	// check next script token
	View.prototype.nonNumericTokenError = function(scriptReader, scriptErrors, nextToken, itemDescription, itemType) {
		// check next token
		var peekToken = scriptReader.peekAtNextToken();

		// check if it is blank or a valid script command
		if (peekToken === "" || this.isScriptCommand(peekToken)) {
			// argument missing
			scriptErrors[scriptErrors.length] = [nextToken, itemDescription + " missing"];
		} else {
			// argument invalid
			scriptErrors[scriptErrors.length] = [nextToken + " " + peekToken, itemDescription + " must be " + itemType];
			// eat the invalid token
			peekToken = scriptReader.getNextToken();
		}
	};

	// read a custom theme element
	View.prototype.readCustomThemeElement = function(scriptReader, scriptErrors, customThemeElement, whichColour) {
		var badColour = true,
		    redValue = 0,
		    greenValue = 0,
		    blueValue = 0,
		    peekToken = null,
		    colourTriple = null,

		    // get the element name
		    elementName = scriptReader.getNextToken();

		// read the red value
		if (scriptReader.nextTokenIsNumeric()) {
			// get the red
			redValue = scriptReader.getNextTokenAsNumber() | 0;

			// check it is in range
			if (redValue < 0 || redValue > 255) {
				scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue, "RED out of range"];
			}

			// read the green value
			if (scriptReader.nextTokenIsNumeric()) {
				// get the green
				greenValue = scriptReader.getNextTokenAsNumber();

				// check it is in range
				if (greenValue < 0 || greenValue > 255) {
					scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue + " " + greenValue, "GREEN out of range"];
				}

				// read the blue value
				if (scriptReader.nextTokenIsNumeric()) {
					// get the blue
					blueValue = scriptReader.getNextTokenAsNumber();
					// check it is in range
					if (blueValue < 0 || blueValue > 255) {
						scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue + " " + greenValue + " " + blueValue, "BLUE out of range"];
					} else {
						// colour is valid
						badColour = false;
					}
				}
				else{
					// illegal or missing blue component
					this.nonNumericTokenError(scriptReader, scriptErrors, whichColour + " " + elementName + " " + redValue + " " + greenValue, "BLUE", "numeric");
				}
			} else {
				// illegal or missing green component
				this.nonNumericTokenError(scriptReader, scriptErrors, whichColour + " " + elementName + " " + redValue, "GREEN", "numeric");
			}
		} else {
			// check for colour name
			peekToken = scriptReader.peekAtNextToken();

			// check if it is blank or a valid script command
			colourTriple = ColourManager.colourList[peekToken.toLowerCase()];
			if (colourTriple !== undefined) {
				// consume the token
				peekToken = scriptReader.getNextToken();

				// get the rgb value
				redValue = colourTriple[1];
				greenValue = colourTriple[2];
				blueValue = colourTriple[3];

				// mark good colour
				badColour = false;
			} else {
				// illegal colour name
				if (peekToken === "" || this.isScriptCommand(peekToken)) {
					// argument missing
					scriptErrors[scriptErrors.length] = [whichColour + " " + elementName, "name missing"];
				} else {
					// argument invalid
					scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + peekToken, "name not known"];

					// consume the token
					peekToken = scriptReader.getNextToken();
				}
			}
		}

		// save the colour if it is valid
		if (!badColour) {
			// see if the slot is available
			if ((this.customThemeValue[customThemeElement] !== -1) && (customThemeElement !== ViewConstants.customThemeLabel)) {
				scriptErrors[scriptErrors.length] = [whichColour + " " + elementName + " " + redValue + " " + greenValue + " " + blueValue, "overwrites " + (this.customThemeValue[customThemeElement] >> 16) + " " + ((this.customThemeValue[customThemeElement] >> 8) & 255) + " " + (this.customThemeValue[customThemeElement] & 255)];
			}

			// save the custom colour
			this.customThemeValue[customThemeElement] = redValue << 16 | greenValue << 8 | blueValue;

			// process the colour
			switch (customThemeElement) {
			case ViewConstants.customThemeGrid:
				// copy to grid colour
				this.customGridColour = this.customThemeValue[customThemeElement];
				break;

			case ViewConstants.customThemeGridMajor:
				// copy to grid major colour
				this.customGridMajorColour = this.customThemeValue[customThemeElement];
				break;

			case ViewConstants.customThemeStars:
				// copy to stars colour
				this.starField.red = redValue;
				this.starField.green = greenValue;
				this.starField.blue = blueValue;
				break;

			case ViewConstants.customThemeText:
				// save for display in help
				this.customTextColour = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeError:
				// save for error display
				this.customErrorColour = [redValue, greenValue, blueValue];
				this.errorsFontColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemeLabel:
				// save for label
				this.customLabelColour = "rgb(" + redValue + "," + greenValue + "," + blueValue + ")";
				break;

			case ViewConstants.customThemeBoundary:
				// copy to custom boundary colour for help display
				this.customBoundaryColour = [redValue, greenValue, blueValue];

				// copy to boundary colour
				if (this.engine.littleEndian) {
					this.engine.boundaryColour = 255 << 24 | blueValue << 16 | greenValue << 8 | redValue;
				} else {
					this.engine.boundaryColour = redValue << 24 | greenValue << 16 | blueValue << 8 | 255;
				}
				break;

			case ViewConstants.customThemeGraphBg:
				// copy to graph background color
				this.engine.graphBgColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphAxis:
				// copy to graph axis color
				this.engine.graphAxisColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphAlive:
				// copy to graph alive color
				this.engine.graphAliveColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphBirth:
				// copy to graph birth color
				this.engine.graphBirthColor = [redValue, greenValue, blueValue];
				break;

			case ViewConstants.customThemeGraphDeath:
				// copy to graph death color
				this.engine.graphDeathColor = [redValue, greenValue, blueValue];
				break;

			default:
				// mark custom theme set
				this.customTheme = true;
			}
		}
	};

	// validate custom theme
	View.prototype.validateCustomTheme = function(scriptErrors, whichColour) {
		var isValid = true,
		    colourValue = 0,
		    customTheme = this.engine.themes[this.engine.numThemes];

		// check for at least alive and dead or background
		if (this.customThemeValue[ViewConstants.customThemeAlive] === -1) {
			scriptErrors[scriptErrors.length] = [whichColour + " " + Keywords.themeAliveWord, "missing"];
			isValid = false;
		}
		if (this.customThemeValue[ViewConstants.customThemeBackground] === -1 && this.customThemeValue[ViewConstants.customThemeDead] === -1) {
			scriptErrors[scriptErrors.length] = [whichColour + " " + Keywords.themeDeadWord, "missing"];
			isValid = false;
		}

		if (isValid) {
			// check if the background was supplied
			colourValue = this.customThemeValue[ViewConstants.customThemeBackground];
			if (colourValue === -1) {
				// use the dead colour
				colourValue = this.customThemeValue[ViewConstants.customThemeDead];
			}

			// set the background colour
			customTheme.unoccupied.red = colourValue >> 16;
			customTheme.unoccupied.green = (colourValue >> 8) & 255;
			customTheme.unoccupied.blue = colourValue & 255;

			// set the alive colour
			colourValue = this.customThemeValue[ViewConstants.customThemeAlive];
			customTheme.aliveRange.startColour.red = colourValue >> 16;
			customTheme.aliveRange.startColour.green = (colourValue >> 8) & 255;
			customTheme.aliveRange.startColour.blue = colourValue & 255;

			// check if the aliveramp is specified
			colourValue = this.customThemeValue[ViewConstants.customThemeAliveRamp];
			if (colourValue === -1) {
				// use the alive colour
				colourValue = this.customThemeValue[ViewConstants.customThemeAlive];
			}

			// set the aliveramp colour
			customTheme.aliveRange.endColour.red = colourValue >> 16;
			customTheme.aliveRange.endColour.green = (colourValue >> 8) & 255;
			customTheme.aliveRange.endColour.blue = colourValue & 255;

			// check if the dead colour was supplied
			colourValue = this.customThemeValue[ViewConstants.customThemeDead];
			if (colourValue === -1) {
				// use the background colour
				colourValue = this.customThemeValue[ViewConstants.customThemeBackground];
			}

			// set the dead colour
			customTheme.deadRange.startColour.red = colourValue >> 16;
			customTheme.deadRange.startColour.green = (colourValue >> 8) & 255;
			customTheme.deadRange.startColour.blue = colourValue & 255;

			// check if the deadramp is specified
			colourValue = this.customThemeValue[ViewConstants.customThemeDeadRamp];
			if (colourValue === -1) {
				// use the dead colour if specified or the background otherwise
				colourValue = this.customThemeValue[ViewConstants.customThemeDead];
				if (colourValue === -1) {
					colourValue = this.customThemeValue[ViewConstants.customThemeBackground];
				}
			}

			// set the deadramp colour
			customTheme.deadRange.endColour.red = colourValue >> 16;
			customTheme.deadRange.endColour.green = (colourValue >> 8) & 255;
			customTheme.deadRange.endColour.blue = colourValue & 255;

			// set the custom theme
			this.engine.setTheme(this.engine.numThemes, 1);
		}
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

	// shorten message to fit
	View.prototype.shortenMessage = function(message, maxLength) {
		var result = message;

		// check if the message is longer than the maximum allowed
		if (message.length > maxLength) {
			// get the first section of the message
			result = message.substr(0, maxLength - 1) + "...";
		}

		// return the message
		return result;
	};

	// validate waypoint message string
	View.prototype.validateString = function(message, scriptErrors, readingTitle, readingLabel) {
		// check for newline
		var index = message.indexOf("\\n");

		if (index !== -1) {
			// check whether this is the window title
			if (readingTitle) {
				// display error since only one line allowed
				scriptErrors[scriptErrors.length] = [Keywords.titleWord + " " + Keywords.stringDelimiter + this.shortenMessage(message, 23) + Keywords.stringDelimiter, "only one line allowed"];
			} else {
				// check for second newline and reading label
				index = message.substr(index + 2).indexOf("\\n");
				if (index !== -1 && !readingLabel) {
					// display error
					scriptErrors[scriptErrors.length] = [Keywords.stringDelimiter + this.shortenMessage(message, 23), "only two lines allowed"];
				}
			}
		}
	};

	// raise theme overwrite error
	View.prototype.raiseThemeError = function(scriptErrors, newTheme, currentTheme) {
		var errorSource = Keywords.themeWord + " ",
		    errorReason = "overwrites ";

		// create the error source
		if (newTheme >= this.engine.numThemes) {
			errorSource += Keywords.themeCustomWord;
		} else {
			errorSource += newTheme;
		}

		// create the error reason
		if (currentTheme >= this.engine.numThemes) {
			errorReason += Keywords.themeCustomWord;
		} else {
			errorReason += currentTheme;
		}

		// raise the error
		scriptErrors[scriptErrors.length] = [errorSource, errorReason];
	};

	// decode rgb script value
	View.prototype.decodeRGB = function(scriptReader, scriptErrors, colNum, nextToken, badColour, colName) {
		var redValue = 0,
		    greenValue = 0,
		    blueValue = 0,
		    peekToken = null,
		    colourTriple = null;

		// read the red value
		if (scriptReader.nextTokenIsNumeric()) {
			// get the red
			redValue = scriptReader.getNextTokenAsNumber() | 0;

			// check it is in range
			if (redValue < 0 || redValue > 255) {
				scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue, "RED out of range"];
				badColour = true;
			} else {
				// read the green value
				if (scriptReader.nextTokenIsNumeric()) {
					// get the green
					greenValue = scriptReader.getNextTokenAsNumber() | 0;

					// check it is in range
					if (greenValue < 0 || greenValue > 255) {
						scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue + " " + greenValue, "GREEN out of range"];
						badColour = true;
					} else {
						// read the blue value
						if (scriptReader.nextTokenIsNumeric()) {
							// get the blue
							blueValue = scriptReader.getNextTokenAsNumber() | 0;
							// check it is in range
							if (blueValue < 0 || blueValue > 255) {
								scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue + " " + greenValue + " " + blueValue, "BLUE out of range"];
								badColour = true;
							}
						}
						else{
							// illegal or missing blue component
							this.nonNumericTokenError(scriptReader, scriptErrors, nextToken + " " + colName + " " + redValue + " " + greenValue, "BLUE", "numeric");
							badColour = true;
						}
					}
				} else {
					// illegal or missing green component
					this.nonNumericTokenError(scriptReader, scriptErrors, nextToken + " " + colName + " " + redValue, "GREEN", "numeric");
					badColour = true;
				}
			}
		} else {
			// check for colour name
			peekToken = scriptReader.peekAtNextToken();

			// check if it is blank or a valid script command
			colourTriple = ColourManager.colourList[peekToken.toLowerCase()];
			if (colourTriple !== undefined) {
				// consume the token
				peekToken = scriptReader.getNextToken();

				// get the rgb value
				redValue = colourTriple[1];
				greenValue = colourTriple[2];
				blueValue = colourTriple[3];
			} else {
				badColour = true;

				// illegal colour name
				if (peekToken === "" || this.isScriptCommand(peekToken)) {
					// argument missing
					scriptErrors[scriptErrors.length] = [nextToken + " " + colName, "name missing"];
				} else {
					// argument invalid
					scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + peekToken, "name not known"];

					// consume the token
					peekToken = scriptReader.getNextToken();
				}
			}
		}

		// save the colour if it is valid
		if (!badColour) {
			// see if the slot is available
			if (this.customColours[colNum] !== -1) {
				scriptErrors[scriptErrors.length] = [nextToken + " " + colName + " " + redValue + " " + greenValue + " " + blueValue, "overwrites " + (this.customColours[colNum] >> 16) + " " + ((this.customColours[colNum] >> 8) & 255) + " " + (this.customColours[colNum] & 255)];
			}
			// save the custom colour
			this.customColours[colNum] = redValue << 16 | greenValue << 8 | blueValue;
		}
	};

	// substitute variables in string
	View.prototype.substituteVariables = function(string) {
		var result = "",
		    varIndex = string.indexOf(Keywords.variablePrefixSymbol),
		    type = "";

		// check if there are variables in the string
		if (varIndex === -1) {
			// no variables so just return the input
			result = string;
		} else {
			// substitute each variable
			while (varIndex !== -1) {
				// add the portion before the variable to the result
				result += string.substr(0, varIndex);

				// get the variable type
				if (varIndex + 1 < string.length) {
					type = string[varIndex + 1];
				
					// remove the variable definition
					string = string.substr(varIndex + 2);

					// determine the variable type
					switch(type) {
						case "B":
							// add the build number
							result += ViewConstants.versionBuild;
							break;

						case "N":
							// add the name
							result += this.patternName;
							break;

						case "R":
							// add the rule
							result += this.patternRuleName;
							break;

						case "A":
							// add the alias
							if (this.patternAliasName === "") {
								result += this.patternRuleName;
							} else {
								result += this.patternAliasName;
							}
							break;

						case "O":
							// add the originator
							result += this.patternOriginator;
							break;

						case "T":
							// add the program name
							result += ViewConstants.externalViewerTitle;
							break;

						case Keywords.variablePrefixSymbol:
							// add the hash
							result += Keywords.variablePrefixSymbol;
							break;

						default:
							// unknown so add as literal
							result += Keywords.variablePrefixSymbol + type;
							break;
					}

					// find the next variable
					varIndex = string.indexOf(Keywords.variablePrefixSymbol);
				} else {
					varIndex = -1;
				}
			}

			// add remaining string if any
			result += string;
		}

		return result;
	};

	// output error message if camera mode already defined
	View.prototype.modeDefined = function(isLinear, command, argument, scriptErrors) {
		// check if linear
		if (isLinear) {
			// check if linear command
			if (command === Keywords.linearWord) {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "already defined"];
			} else {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "overwrites " + Keywords.linearWord];
			}
		} else {
			// check if linear command
			if (command === Keywords.linearWord) {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "overwrites " + Keywords.bezierWord];
			} else {
				scriptErrors[scriptErrors.length] = [command + " " + argument, "already defined"];
			}
		}
	};

	// display number to maximum of n places
	View.prototype.toPlaces = function(number, places) {
		var result = "";

		if (number === (number | 0)) {
			result = String(number);
		} else {
			result = number.toFixed(places);
		}

		return result;
	};

	// read script
	View.prototype.readScript = function(scriptString, numStates) {
		// create a script from the string
		var scriptReader = new Script(scriptString),

		    // reading title
		    readingTitle = false,

		    // next token
		    nextToken = "",

		    // lookahead token
		    peekToken = "",

		    // whether reading string
		    readingString = false,

		    // string value
		    stringValue = "",
		    
		    // number value
			numberValue = 0,

		    // item valid flag
		    itemValid = false,

		    // argument numeric flag
		    isNumeric = false,

		    // script error list
		    scriptErrors = this.scriptErrors,

		    // error message
		    notPossibleError = null,

		    // number of custom colours provided
		    numCustomColours = 0,

		    // custom colour information
		    colNum = 0,
		    colValue = 0,

		    // which colour keyword used (for error reporting)
		    whichColour = "",

		    // current waypoint
		    currentWaypoint = this.waypointManager.createWaypoint(),
		    tempWaypoint = null,

		    // whether waypoints found
		    waypointsFound = false,

		    // whether points of interest found
		    poiFound = false,

			// current label
			currentLabel = null,

			// current label alpha
			currentLabelAlpha = 1,

			// current label size
			currentLabelSize = ViewConstants.labelFontSize,

			// current label T1 and T2
			currentLabelT1 = -1,
			currentLabelT2 = -1,

			// current label TFade
			currentLabelTFade = 0,

			// current label angle and locked
			currentLabelAngle = 0,
			currentLabelAngleFixed = false,

			// current position locked
			currentLabelPositionFixed = false,

			// current label target and distance
			currentLabelTX = 0,
			currentLabelTY = 0,
			currentLabelTDistance = -1,

			// current label movement vector
			currentLabelDX = 0,
			currentLabelDY = 0,

			// whether reading label
			readingLabel = false,

		    // whether colour valid
		    badColour = false,

		    // type of argument
		    type = "numeric",

		    // track command parameters
		    trackPeriod = -1,
		    trackX = -1,
		    trackY = -1,
		    newPeriod = -1,
		    newX = -1,
		    newY = -1,

		    // track box command parameters
		    trackBoxN = 0,
		    trackBoxS = 0,
		    trackBoxE = 0,
		    trackBoxW = 0,

			// holders
			x = 0, y = 0, z = 0,

		    // loop counter
		    i = 0,

		    // suppress errors flags
		    suppressErrors = {
			x : false,
			y : false,
			zoom : false,
			angle : false,
			layers : false,
			depth : false,
			theme : false,
			gps : false,
			step : false,
			loop : false,
			stop : false,
			width : false,
			height : false,
			popupWidth: false,
			popupHeight : false
		    };

		// reset counts
		this.numScriptCommands = 0;
		this.numScriptErrors = 0;

		// reset custom theme
		this.customTheme = false;
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

		// clear custom colours
		this.customColours = [];

		// look for a start script token
		if (scriptReader.findToken(Keywords.scriptStartWord)) {
			// reset custom colours
			for (i = 0; i < 256; i += 1) {
				this.customColours[i] = -1;
			}

			nextToken = scriptReader.getNextToken();
			while (nextToken !== "") {
				// set the default type
				type = "numeric";

				// check if reading string
				if (readingString) {
					// check if string finished
					if (nextToken[nextToken.length - 1] === Keywords.stringDelimiter) {
						// finalise string
						stringValue = stringValue + " " + nextToken.substr(0, nextToken.length - 1);
						readingString = false;

						// validate string
						this.validateString(stringValue, scriptErrors, readingTitle, readingLabel);

						// check whether it is a waypoint message or window title
						if (readingTitle) {
							// check if the title already set
							if (this.windowTitle !== "") {
								scriptErrors[scriptErrors.length] = [Keywords.titleWord + " " + Keywords.stringDelimiter + this.shortenMessage(stringValue, 20) + Keywords.stringDelimiter, "overwrites " + Keywords.stringDelimiter + this.windowTitle + Keywords.stringDelimiter];
							}

							// set window title
							this.windowTitle = stringValue;

							// flag not reading title
							readingTitle = false;
						} else {
							if (readingLabel) {
								// set label message
								currentLabel.message = this.substituteVariables(stringValue);
								readingLabel = false;
								this.waypointManager.addLabel(currentLabel);
							} else {
								// set text message
								currentWaypoint.textMessage = this.substituteVariables(stringValue);
								currentWaypoint.textDefined = true;
							}
						}
					} else {
						// add to current string
						stringValue = stringValue + " " + nextToken;
					}
				} else {
					// check for new string
					if (nextToken[0] === Keywords.stringDelimiter) {
						// create the new string
						stringValue = nextToken.substr(1);
						readingString = true;
						
						// check if string finished
						if (nextToken[nextToken.length - 1] === Keywords.stringDelimiter) {
							readingString = false;

							// remove the trailing delimiter
							stringValue = stringValue.substr(0, stringValue.length - 1);

							// validate string
							this.validateString(stringValue, scriptErrors, readingTitle, readingLabel);

							// check whether it is a waypoint message or window title
							if (readingTitle) {
								// check if the title is already set
								if (this.windowTitle !== "") {
									scriptErrors[scriptErrors.length] = [Keywords.titleWord + " " + Keywords.stringDelimiter + this.shortenMessage(stringValue, 20) + Keywords.stringDelimiter, "overwrites " + Keywords.stringDelimiter + this.windowTitle + Keywords.stringDelimiter];
								}

								// set window title
								this.windowTitle = stringValue;

								// flag not reading title
								readingTitle = false;
							} else {
								if (readingLabel) {
									// set label message
									currentLabel.message = this.substituteVariables(stringValue);
									readingLabel = false;
									this.waypointManager.addLabel(currentLabel);
								} else {
									// set the text message
									currentWaypoint.textMessage = this.substituteVariables(stringValue);
									currentWaypoint.textDefined = true;
								}
							}
						}
					} else {
						// read command
						// flag the item is invalid
						isNumeric = false;
						itemValid = false;

						// increment number of commands
						this.numScriptCommands += 1;

						// determine the command
						switch (nextToken) {
						// window title
						case Keywords.titleWord:
							// flag reading title
							readingTitle = true;

							itemValid = true;
							break;

						// label size
						case Keywords.labelSizeWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minLabelSize && numberValue <= ViewConstants.maxLabelSize) {
									currentLabelSize = numberValue;
									itemValid = true;
								}
							}
							break;

						// label track
						case Keywords.labelTrackWord:
							// get dx
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									x = numberValue;
									isNumeric = false;

									// get dy
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											currentLabelDX = x;
											currentLabelDY = numberValue;
											itemValid = true;
										}
									}
								}
							} else {
								// check for FIXED keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.fixedWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentLabelDX = 0;
									currentLabelDY = 0;
									itemValid = true;
								}
							}

							break;

						// label target
						case Keywords.labelTargetWord:
							// get the x position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
									isNumeric = false;
									x = numberValue;

									// get the y position
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
											isNumeric = false;
											y = numberValue;

											// get the distance
											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												if (numberValue >= 0 && numberValue <= this.engine.maxGridSize / 2) {
													currentLabelTX = x;
													currentLabelTY = y;
													currentLabelTDistance = numberValue;
													itemValid = true;
												}
											}
										}
									}
								}
							} else {
								// check for OFF keyword
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentLabelTX = 0;
									currentLabelTY = 0;
									currentLabelTDistance = -1;
									itemValid = true;
								}
							}
							break;

						// label angle
						case Keywords.labelAngleWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the angle value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue < 360) {
									currentLabelAngle = numberValue;
									currentLabelAngleFixed = false;
									// check for optional FIXED keyword
									peekToken = scriptReader.peekAtNextToken();
									if (peekToken === Keywords.fixedWord) {
										// consume token
										peekToken = scriptReader.getNextToken();
										currentLabelAngleFixed = true;
									}
									itemValid = true;
								}
							}
							break;

						// label T
						case Keywords.labelTWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the T1 value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									x = numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										// get the T2 value
										numberValue = scriptReader.getNextTokenAsNumber() | 0;
										if (numberValue >= x) {
											y = numberValue;
											if (scriptReader.nextTokenIsNumeric()) {
												// get the Fade value
												numberValue = scriptReader.getNextTokenAsNumber() | 0;
												if (numberValue >= 0 && numberValue <= ((y - x) >> 1)) {
													currentLabelT1 = x;
													currentLabelT2 = y;
													currentLabelTFade = numberValue;
													itemValid = true;
												} else {
													itemValid = true;
													scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + y + " "+ numberValue, "third argument must from 0 to " + ((y - x) >> 1)];
												}
											} else {
												isNumeric = false;
											}
										} else {
											itemValid = true;
											scriptErrors[scriptErrors.length] = [nextToken + " " + x + " " + numberValue, "second argument must be >= first"];
										}
									} else {
										isNumeric = false;
									}
								}
							} else {
								// check for all
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.allWord) {
									// consume token
									peekToken = scriptReader.getNextToken();
									currentLabelT1 = -1;
									currentLabelT2 = -1;
									currentLabelTFade = 0;
									itemValid = true;
								} else {
									// fail needing a number
									isNumeric = false;
								}
							}
							break;

						// label alpha
						case Keywords.labelAlphaWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0 && numberValue <= 1) {
									currentLabelAlpha = numberValue;
									itemValid = true;
								}
							}
							break;

						// label
						case Keywords.labelWord:
							// get the x position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
									isNumeric = false;
									x = numberValue;

									// get the y position
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
											isNumeric = false;
											y = numberValue;

											// get the zoom
											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												z = -1000;
												if (numberValue >= ViewConstants.minZoom && numberValue <= ViewConstants.maxZoom) {
													z = numberValue;
												} else {
													// check for negative zoom format
													if (numberValue >= ViewConstants.minNegZoom && numberValue <= ViewConstants.maxNegZoom) {
														z = -(1 / numberValue);
													}
												}
												if (z !== -1000) {
													// check for optional fixed keyword
													peekToken = scriptReader.peekAtNextToken();
													currentLabelPositionFixed = false;
													if (peekToken === Keywords.fixedWord) {
														// consume the token
														peekToken = scriptReader.getNextToken();
														currentLabelPositionFixed = true;
														peekToken = scriptReader.peekAtNextToken();
													}
													// check there is text
													if (peekToken[0] === Keywords.stringDelimiter) {
														// save the label
														currentLabel = this.waypointManager.createLabel(x, y, z, this.customLabelColour, currentLabelAlpha, currentLabelSize,
															currentLabelT1, currentLabelT2, currentLabelTFade, currentLabelAngle, currentLabelAngleFixed, currentLabelPositionFixed,
															currentLabelTX, currentLabelTY, currentLabelTDistance, currentLabelDX, currentLabelDY);
														readingLabel = true;
														itemValid = true;
													} else {
														isNumeric = false;
													}
												}
											}
										}
									}
								}
							}

							break;

						// no history
						case Keywords.noHistoryWord:
							this.noHistory = true;

							itemValid = true;
							break;

						// no generation notifications
						case Keywords.noReportWord:
							this.genNotifications = false;

							itemValid = true;
							break;

						// maximum grid size
						case Keywords.maxGridSizeWord:
							// get the grid size
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minGridPower && numberValue <= ViewConstants.maxGridPower) {
									this.engine.maxGridSize = 1 << numberValue;
									itemValid = true;
								}
							}
							break;

						// starfield
						case Keywords.starfieldWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch stars off
								currentWaypoint.stars = false;
							} else {
								currentWaypoint.stars = true;
							}
							currentWaypoint.starsDefined = true;

							itemValid = true;
							break;

						// fit zoom
						case Keywords.autoFitWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch fit zoom off
								currentWaypoint.fitZoom = false;
							} else {
								currentWaypoint.fitZoom = true;
							}

							itemValid = true;
							break;

						// number of history states
						case Keywords.historyStatesWord:
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue <= this.maxHistoryStates) {
									this.historyStates = numberValue;

									itemValid = true;
								}
							}
							break;

						// history fit mode
						case Keywords.historyFitWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch fit zoom off
								this.historyFit = false;
							} else {
								this.historyFit = true;
							}

							itemValid = true;
							break;

						// grid
						case Keywords.gridWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch grid off
								currentWaypoint.grid = false;
							} else {
								// switch grid on
								currentWaypoint.grid = true;
							}
							currentWaypoint.gridDefined = true;

							itemValid = true;
							break;

						// grid major
						case Keywords.gridMajorWord:
							// get the interval
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minBoldGridInterval && numberValue <= ViewConstants.maxBoldGridInterval) {
									this.engine.gridLineMajor = numberValue;
									itemValid = true;
								}
							}
							break;

						// color or colour
						case Keywords.colorWord:
						case Keywords.colourWord:
							// save the colour keyword used
							whichColour = nextToken;
							badColour = false;

							// read the colour number
							if (scriptReader.nextTokenIsNumeric()) {
								// get the value
								colNum = scriptReader.getNextTokenAsNumber() | 0;

								// check it is an allowed state colour index
								if (colNum < 0 || colNum >= 255) {
									// invalid state
									scriptErrors[scriptErrors.length] = [nextToken + " " + colNum, "STATE out of range"];
									badColour = true;
								}

								// decode the rgb value
								this.decodeRGB(scriptReader, scriptErrors, colNum, nextToken, badColour, colNum);
							} else {
								// check if it is a custom theme element
								peekToken = scriptReader.peekAtNextToken();
								switch(peekToken) {
								// [R]History color states
								case Keywords.offColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(scriptReader, scriptErrors, ViewConstants.offState, nextToken, false, peekToken);
									break;

								case Keywords.onColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(scriptReader, scriptErrors, ViewConstants.onState, nextToken, false, peekToken);
									break;

								case Keywords.historyColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(scriptReader, scriptErrors, ViewConstants.historyState, nextToken, false, peekToken);
									break;

								case Keywords.mark1ColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(scriptReader, scriptErrors, ViewConstants.mark1State, nextToken, false, peekToken);
									break;

								case Keywords.markOffColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(scriptReader, scriptErrors, ViewConstants.markOffState, nextToken, false, peekToken);
									break;

								case Keywords.mark2ColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(scriptReader, scriptErrors, ViewConstants.mark2State, nextToken, false, peekToken);
									break;

								case Keywords.killColorWord:
									peekToken = scriptReader.getNextToken();
									this.decodeRGB(scriptReader, scriptErrors, ViewConstants.killState, nextToken, false, peekToken);
									break;

								// background
								case Keywords.themeBackgroundWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeBackground, whichColour);
									break;

								// alive
								case Keywords.themeAliveWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeAlive, whichColour);
									break;

								// aliveramp
								case Keywords.themeAliveRampWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeAliveRamp, whichColour);
									break;

								// dead
								case Keywords.themeDeadWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeDead, whichColour);
									break;

								// deadramp
								case Keywords.themeDeadRampWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeDeadRamp, whichColour);
									break;
								
								// grid
								case Keywords.gridWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeGrid, whichColour);
									break;

								// grid major
								case Keywords.gridMajorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeGridMajor, whichColour);
									break;

								// stars
								case Keywords.starfieldWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeStars, whichColour);
									break;

								// text
								case Keywords.textColorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeText, whichColour);
									break;

								// error
								case Keywords.errorColorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeError, whichColour);
									break;

								// label
								case Keywords.labelWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeLabel, whichColour);
									break;

								// boundary
								case Keywords.boundaryWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeBoundary, whichColour);
									break;

								// graph background
								case Keywords.graphBgColorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeGraphBg, whichColour);
									break;

								// graph axis
								case Keywords.graphAxisColorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeGraphAxis, whichColour);
									break;

								// graph alive
								case Keywords.graphAliveColorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeGraphAlive, whichColour);
									break;

								// graph birth
								case Keywords.graphBirthColorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeGraphBirth, whichColour);
									break;

								// graph death
								case Keywords.graphDeathColorWord:
									this.readCustomThemeElement(scriptReader, scriptErrors, ViewConstants.customThemeGraphDeath, whichColour);
									break;

								// others are errors
								default:
									// illegal colour element
									scriptErrors[scriptErrors.length] = [nextToken + " " + peekToken, "illegal element"];

									// eat the invalid token
									peekToken = scriptReader.getNextToken();
									break;
								}
							}

							// error handling done already
							itemValid = true;
							break;

						// end script token
						case Keywords.scriptEndWord:
							// search for next start token
							scriptReader.findToken(Keywords.scriptStartWord);
							itemValid = true;

							// do not count in command count
							this.numScriptCommands -= 1;
							break;

						// view only
						case Keywords.viewOnlyWord:
							this.viewOnly = true;
							itemValid = true;
							break;

						// hide source
						case Keywords.noSourceWord:
							this.noSource = true;
							itemValid = true;
							break;

						// no GUI
						case Keywords.noGUIWord:
							this.noGUI = true;
							this.noGUIDefined = true;
							itemValid = true;
							break;

						// no RLE copy
						case Keywords.noCopyWord:
							this.noCopy = true;
							itemValid = true;
							break;

						// strict validation
						case Keywords.strictWord:
							this.strict = true;
							itemValid = true;
							break;

						// suppress overwrite warning of previous commands one time
						case Keywords.suppressWord:
							suppressErrors.x = true;
							suppressErrors.y = true;
							suppressErrors.zoom = true;
							suppressErrors.angle = true;
							suppressErrors.layers = true;
							suppressErrors.depth = true;
							suppressErrors.theme = true;
							suppressErrors.gps = true;
							suppressErrors.step = true;
							suppressErrors.loop = true;
							suppressErrors.stop = true;
							suppressErrors.width = true;
							suppressErrors.height = true;
							suppressErrors.popupWidth = true;
							suppressErrors.popupHeight = true;
							itemValid = true;
							break;

						// off
						case Keywords.offWord:
							scriptErrors[scriptErrors.length] = [Keywords.offWord, "must follow LOOP or STOP"];
							itemValid = true;
							break;

						// all
						case Keywords.allWord:
							// check for the argument
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.initialWord) {
								// token is valid so eat it
								peekToken = scriptReader.getNextToken();

								// check for POI
								if (currentWaypoint.isPOI) {
									// copy values from initial waypoint
									this.waypointManager.copyInitialAll(currentWaypoint, scriptErrors);
									this.setInitialFlags();
								} else {
									scriptErrors[scriptErrors.length] = [Keywords.allWord + " " + Keywords.initialWord, "only valid at a POI"];
								}
							} else {
								scriptErrors[scriptErrors.length] = [Keywords.allWord, "must be followed by INITIAL"];
							}
							itemValid = true;
							break;

						// initial
						case Keywords.initialWord:
							scriptErrors[scriptErrors.length] = [Keywords.initialWord, "must follow POI, ALL or a POI setting"];
							itemValid = true;
							break;

						// autostart
						case Keywords.autoStartWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								this.autoStart = false;
							} else {
								if (this.executable) {
									this.autoStart = true;
								}
							}
							itemValid = true;
							break;

						// start POI at generation
						case Keywords.poiTWord:
							// get the target generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									// check waypoint is a POI
									if (currentWaypoint.isPOI) {
										// set the target in the current waypoint
										currentWaypoint.targetGen = numberValue;
										currentWaypoint.targetGenDefined = true;
									} else {
										scriptErrors[scriptErrors.length] = [Keywords.poiTWord + " " + numberValue, "only valid at a POI"];
									}
									itemValid = true;
								}
							}
							break;

						// play at POI
						case Keywords.poiPlayWord:
							currentWaypoint.setPlayAction(scriptErrors);
							itemValid = true;
							break;

						// stop at POI
						case Keywords.poiStopWord:
							currentWaypoint.setStopAction(scriptErrors);
							itemValid = true;
							break;

						// reset at POI
						case Keywords.poiResetWord:
							currentWaypoint.setResetAction(scriptErrors);
							itemValid = true;
							break;

						// POI transition speed
						case Keywords.poiTransWord:
							// get the transition speed
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= WaypointConstants.poiMinSpeed && numberValue <= WaypointConstants.poiMaxSpeed) {
									// set speed in waypoint
									currentWaypoint.setTransitionSpeed(numberValue, scriptErrors);
									itemValid = true;
								}
							}
							break;

						// hard reset
						case Keywords.hardResetWord:
							this.hardReset = true;
							itemValid = true;
							break;

						// state 1 fit
						case Keywords.state1FitWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch state 1 fit off
								this.state1Fit = false;
							} else {
								this.state1Fit = true;
							}
							itemValid = true;
							break;

						// track
						case Keywords.trackWord:
							// get the x speed
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									// save x
									newX = numberValue;

									// get the y offset
									isNumeric = false;
									nextToken += " " + numberValue;

									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											// save y
											newY = numberValue;
											itemValid = true;

											// check if overwrote previous definition
											if (this.trackDefined) {
												scriptErrors[scriptErrors.length] = [Keywords.trackWord + " " + newX + " " + newY, "overwrites " + trackX + " " + trackY];
											}

											// save new values
											trackX = newX;
											trackY = newY;
											this.trackDefined = true;
										}
									}
								}
							}
							break;

						// track loop
						case Keywords.trackLoopWord:
							// get the period
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue > 0) {
									// save period
									newPeriod = numberValue;

									// get the x offset
									isNumeric = false;

									nextToken += " " + numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											// save x
											newX = numberValue;

											// get the y offset
											isNumeric = false;
											nextToken += " " + numberValue;

											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
													// save y
													newY = numberValue;
													itemValid = true;

													// check if overwrote previous definition
													if (this.trackLoopDefined) {
														scriptErrors[scriptErrors.length] = [Keywords.trackLoopWord + " " + newPeriod + " " + newX + " " + newY, "overwrites " + trackPeriod + " " + trackX + " " + trackY];
													}

													// save new values
													trackPeriod = newPeriod;
													trackX = newX;
													trackY = newY;
													this.trackLoopDefined = true;
													this.trackDefined = true;
												}
											}
										}
									}
								}
							}
							break;

						// track box
						case Keywords.trackBoxWord:
							// get the E speed
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
									// save E speed
									trackBoxE = numberValue;

									// get the S speed
									isNumeric = false;

									nextToken += " " + numberValue;
									if (scriptReader.nextTokenIsNumeric()) {
										isNumeric = true;

										// get the value
										numberValue = scriptReader.getNextTokenAsNumber();

										// check it is in range
										if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
											// save S speed
											trackBoxS = numberValue;

											// get the W speed
											isNumeric = false;

											nextToken += " " + numberValue;
											if (scriptReader.nextTokenIsNumeric()) {
												isNumeric = true;

												// get the value
												numberValue = scriptReader.getNextTokenAsNumber();

												// check it is in range
												if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
													// save W speed
													trackBoxW = numberValue;

													// get the N speed
													isNumeric = false;

													nextToken += " " + numberValue;
													if (scriptReader.nextTokenIsNumeric()) {
														isNumeric = true;

														// get the value
														numberValue = scriptReader.getNextTokenAsNumber();

														// check it is in range
														if (numberValue >= ViewConstants.minTrackSpeed && numberValue <= ViewConstants.maxTrackSpeed) {
															// save N value
															trackBoxN = numberValue;
															itemValid = true;

															// check that W < E
															if (trackBoxW > trackBoxE) {
																scriptErrors[scriptErrors.length] = [Keywords.trackBoxWord + " W " + this.toPlaces(trackBoxW, 2) + " E " + this.toPlaces(trackBoxE, 2), "W is greater than E"];
															} else {
																// check that N < S
																if (trackBoxN > trackBoxS) {
																	scriptErrors[scriptErrors.length] = [Keywords.trackBoxWord + " N " + this.toPlaces(trackBoxN, 2) + " S " + this.toPlaces(trackBoxS, 2), "N is greater than S"];
																} else {
																	if (this.trackBoxDefined) {
																		scriptErrors[scriptErrors.length] = [Keywords.trackBoxWord + " " + this.toPlaces(trackBoxE, 2) + " " + this.toPlaces(trackBoxS, 2) + " " + this.toPlaces(trackBoxW, 2) + " " + this.toPlaces(trackBoxN, 2), "overwrites " + this.toPlaces(this.trackBoxE, 2) + " " + this.toPlaces(this.trackBoxS, 2) + " " + this.toPlaces(this.trackBoxW, 2) + " " + this.toPlaces(this.trackBoxN, 2)];
																	}

																	// save new values
																	this.trackBoxDefined = true;
																	this.trackDefined = true;
																	this.trackBoxN = trackBoxN;
																	this.trackBoxE = trackBoxE;
																	this.trackBoxS = trackBoxS;
																	this.trackBoxW = trackBoxW;
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
							break;

						// stop
						case Keywords.stopWord:
							// remember the current waypoint
							tempWaypoint = currentWaypoint;

							// STOP goes to initial setting if not defined at a POI
							if (!currentWaypoint.isPOI && this.waypointManager.numWaypoints > 0) {
								currentWaypoint = this.waypointManager.firstWaypoint();
							}

							// get the stop generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue > 0) {
									// check if already defined
									if (currentWaypoint.stopGenDefined && !this.initialStop && !suppressErrors.stop) {
										if (currentWaypoint.stopGeneration === -1) {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + numberValue, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + numberValue, "overwrites " + currentWaypoint.stopGeneration];
										}
									}

									// save value
									currentWaypoint.stopGeneration = numberValue;
									currentWaypoint.stopGenDefined = true;
									this.initialStop = false;
									suppressErrors.stop = false;
									itemValid = true;
								}
							} else {
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();
									if (currentWaypoint.stopGenDefined && !this.initialStop && !suppressErrors.stop) {
										if (currentWaypoint.stopGeneration === -1 && !this.initialStop) {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + Keywords.offWord, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + Keywords.offWord, "overwrites " + currentWaypoint.stopGeneration];
										}
									}

									// save value
									currentWaypoint.stopGeneration = -1;
									currentWaypoint.stopGenDefined = true;
									this.initialStop = false;
									suppressErrors.stop = false;
									itemValid = true;
								} else {
									if (peekToken === Keywords.initialWord) {
										// token valid so eat it
										peekToken = scriptReader.getNextToken();

										// copy from initial waypoint
										this.waypointManager.copyInitial(Keywords.stopWord, currentWaypoint, scriptErrors, this.initialStop);
										this.initialStop = true;
										itemValid = true;
									}
								}
							}

							// restore current Waypoint
							currentWaypoint = tempWaypoint;

							break;

						// loop
						case Keywords.loopWord:
							// remember the current waypoint
							tempWaypoint = currentWaypoint;

							// STOP goes to initial setting if not defined at a POI
							if (!currentWaypoint.isPOI && this.waypointManager.numWaypoints() > 0) {
								currentWaypoint = this.waypointManager.firstWaypoint();
							}

							// get the loop generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue > 0) {
									// check if already defined
									if (currentWaypoint.loopGenDefined && !this.initialLoop && !suppressErrors.loop) {
										if (currentWaypoint.loopGeneration === -1) {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + numberValue, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + numberValue, "overwrites " + currentWaypoint.loopGeneration];
										}
									}

									// save value
									currentWaypoint.loopGeneration = numberValue;
									currentWaypoint.loopGenDefined = true;
									this.initialLoop = false;
									suppressErrors.loop = false;
									itemValid = true;
								}
							} else {
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.offWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();
									if (currentWaypoint.loopGenDefined && !this.initialLoop && !suppressErrors.loop) {
										if (currentWaypoint.loopGeneration === -1) {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + Keywords.offWord, "overwrites " + Keywords.offWord];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + Keywords.offWord, "overwrites " + currentWaypoint.loopGeneration];
										}
									}

									// save value
									currentWaypoint.loopGeneration = -1;
									currentWaypoint.loopGenDefined = true;
									this.initialLoop = false;
									suppressErrors.loop = false;
									itemValid = true;
								} else {
									if (peekToken === Keywords.initialWord) {
										// token valid so eat it
										peekToken = scriptReader.getNextToken();

										// copy from initial waypoint
										this.waypointManager.copyInitial(Keywords.loopWord, currentWaypoint, scriptErrors, this.initialLoop);
										this.initialLoop = true;
										itemValid = true;
									}
								}
							}

							// restore current Waypoint
							currentWaypoint = tempWaypoint;

							break;

						// angle
						case Keywords.angleWord:
							// get the angle
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue <= 359) { 
									// check if angle already defined
									if (currentWaypoint.angleDefined && !this.initialAngle && !suppressErrors.angle) {
										scriptErrors[scriptErrors.length] = [Keywords.angleWord + " " + numberValue, "overwrites " + currentWaypoint.angle];
									}

									// set angle in waypoint
									currentWaypoint.angle = numberValue;
									currentWaypoint.angleDefined = true;
									this.initialAngle = false;
									suppressErrors.angle = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.angleWord, currentWaypoint, scriptErrors, this.initialAngle);
									this.initialAngle = true;
									itemValid = true;
								}
							}
							break;

						// layers
						case Keywords.layersWord:
							// get the number of layers
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minLayers && numberValue <= ViewConstants.maxLayers) {
									// check if layers already defined
									if (currentWaypoint.layersDefined && !this.initialLayers && !suppressErrors.layers) {
										scriptErrors[scriptErrors.length] = [Keywords.layersWord + " " + numberValue, "overwrites " + currentWaypoint.layers];
									}

									// set layers in waypoint
									currentWaypoint.layers = numberValue;
									currentWaypoint.layersDefined = true;
									this.initialLayers = false;
									suppressErrors.layers = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.layersWord, currentWaypoint, scriptErrors, this.initialLayers);
									this.initialLayers = true;
									itemValid = true;
								}
							}
							break;

						// depth
						case Keywords.depthWord:
							// get the layer depth
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minDepth && numberValue <= ViewConstants.maxDepth) {
									// check if depth already defined
									if (currentWaypoint.depthDefined && !this.initialDepth && !suppressErrors.depth) {
										scriptErrors[scriptErrors.length] = [Keywords.depthWord + " " + numberValue, "overwrites " + currentWaypoint.depth];
									}

									// set depth in the waypoint
									currentWaypoint.depth = numberValue;
									currentWaypoint.depthDefined = true;
									this.initialDepth = false;
									suppressErrors.depth = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.depthWord, currentWaypoint, scriptErrors, this.initialDepth);
									this.initialDepth = true;
									itemValid = true;
								}
							}
							break;

						// x offset
						case Keywords.xOffsetWord:
							// get the x offset
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
									// set x offset
									this.xOffset = numberValue;
									itemValid = true;
								}
							}
							break;

						// y offset
						case Keywords.yOffsetWord:
							// get the y offset
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
									// set y offset
									this.yOffset = numberValue;
									itemValid = true;
								}
							}
							break;

						// x
						case Keywords.xWord:
							// get the x position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
									// check if x already defined
									if (currentWaypoint.xDefined && !this.initialX && !suppressErrors.x) {
										scriptErrors[scriptErrors.length] = [Keywords.xWord + " " + numberValue, "overwrites " + -currentWaypoint.x];
									}

									// set x in waypoint
									currentWaypoint.x = -numberValue;
									currentWaypoint.xDefined = true;
									this.initialX = false;
									suppressErrors.x = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.xWord, currentWaypoint, scriptErrors, this.initialX);
									this.initialX = true;
									itemValid = true;
								}
							}
							break;

						// y
						case Keywords.yWord:
							// get the y position
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= -this.engine.maxGridSize / 2 && numberValue <= this.engine.maxGridSize / 2) {
									// check if y already defined
									if (currentWaypoint.yDefined && !this.initialY && !suppressErrors.y) {
										scriptErrors[scriptErrors.length] = [Keywords.yWord + " " + numberValue, "overwrites " + -currentWaypoint.y];
									}

									// set y in waypoint
									currentWaypoint.y = -numberValue;
									currentWaypoint.yDefined = true;
									this.initialY = false;
									suppressErrors.y = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.yWord, currentWaypoint, scriptErrors, this.initialY);
									this.initialY = true;
									itemValid = true;
								}
							}
							break;

						// integer zoom
						case Keywords.integerZoomWord:
							this.integerZoom = true;
							itemValid = true;
							break;

						// thumbnail zoom
						case Keywords.thumbZoomWord:
							// get the thumbnail zoom
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minZoom && numberValue <= ViewConstants.maxZoom) {
									// set thumbnail zoom
									this.thumbZoomDefined = true;
									this.thumbZoomValue = numberValue;
									itemValid = true;
								} else {
									// check for negative zoom format
									if (numberValue >= ViewConstants.minNegZoom && numberValue <= ViewConstants.maxNegZoom) {
										// set thumbnail zoom
										this.thumbZoomDefined = true;
										this.thumbZoomValue = -(1 / numberValue);
										itemValid = true;
									}
								}
							}
							break;

						// zoom and alternate zoom
						case Keywords.alternateZoomWord:
						case Keywords.zoomWord:
							// get the zoom
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= ViewConstants.minZoom && numberValue <= ViewConstants.maxZoom) {
									// check if zoom already defined
									if (currentWaypoint.zoomDefined && !this.initialZ && !suppressErrors.zoom) {
										if (currentWaypoint.zoom < 1) {
											scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + (-(1 / currentWaypoint.zoom))];
										} else {
											scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + currentWaypoint.zoom];
										}
									}

									// set zoom in waypoint
									currentWaypoint.zoom = numberValue;
									currentWaypoint.zoomDefined = true;
									this.initialZ = false;
									suppressErrors.zoom = false;
									itemValid = true;
								} else {
									// check for negative zoom format
									if (numberValue >= ViewConstants.minNegZoom && numberValue <= ViewConstants.maxNegZoom) {
										// check if zoom already defined
										if (currentWaypoint.zoomDefined && !this.initialZ) {
											if (currentWaypoint.zoom < 1) {
												scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + (-(1 / currentWaypoint.zoom))];
											} else {
												scriptErrors[scriptErrors.length] = [Keywords.zoomWord + " " + numberValue, "overwrites " + currentWaypoint.zoom];
											}
										}

										// set zoom in waypoint
										currentWaypoint.zoom = -(1 / numberValue);
										currentWaypoint.zoomDefined = true;
										this.initialZ = false;
										itemValid = true;
									}
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.zoomWord, currentWaypoint, scriptErrors, this.initialZ);
									this.initialZ = true;
									itemValid = true;
								}
							}
							break;

						// gps
						case Keywords.gpsWord:
							// get the stop generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minGenSpeed && numberValue <= ViewConstants.maxGenSpeed) {
									// check if gps already defined
									if (currentWaypoint.gpsDefined && !this.initialGps && !suppressErrors.gps) {
										scriptErrors[scriptErrors.length] = [Keywords.gpsWord + " " + numberValue, "overwrites " + currentWaypoint.gps];
									}

									// set gps in waypoint
									currentWaypoint.gps = numberValue;
									currentWaypoint.gpsDefined = true;
									this.initialGps = false;
									suppressErrors.gps = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.gpsWord, currentWaypoint, scriptErrors, this.initialGps);
									this.initialGps = true;
									itemValid = true;
								}
							}
							break;

						// thumbnail
						case Keywords.thumbnailWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch thumbnail off if not in a popup window
								if (!this.isInPopup) {
									this.thumbnail = false;
									this.thumbnailEverOn = false;
								}
							} else {
								// set the thumbnail flag if not in a popup window
								if (!this.isInPopup) {
									this.thumbnail = true;
									this.thumbnailEverOn = true;
								}
							}
							itemValid = true;
							break;

						// thumbnail launch
						case Keywords.thumbLaunchWord:
							// check for OFF
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.offWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();
								// switch thumblaunch off if not in a popup window
								if (!this.isInPopup) {
									this.thumbnail = false;
									this.thumbnailEverOn = false;
									this.thumbLaunch = false;
									this.menuManager.thumbLaunch = false;
								}
							} else {
								// clicking on thumbnail launches popup viewer if not in a popup window
								if (!this.isInPopup) {
									this.thumbnail = true;
									this.thumbnailEverOn = true;
									this.thumbLaunch = true;
									this.menuManager.thumbLaunch = true;
								}
							}
							itemValid = true;
							break;

						// thumbnail size
						case Keywords.thumbSizeWord:
							// get the thumbnail size
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minThumbSize && numberValue <= ViewConstants.maxThumbSize) {
									// save the size
									this.thumbnailDivisor = numberValue;
									itemValid = true;
								}
							}
							break;

						// theme
						case Keywords.themeWord:
							// get the theme number
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0 && numberValue < this.engine.numThemes) {
									// check if theme already defined at this waypoint
									if (currentWaypoint.themeDefined && !this.initialTheme && !suppressErrors.theme) {
										// raise script error
										this.raiseThemeError(scriptErrors, numberValue, currentWaypoint.theme);
									}

									// set theme in waypoint
									currentWaypoint.theme = numberValue;
									currentWaypoint.themeDefined = true;
									this.initialTheme = false;
									suppressErrors.theme = false;
									itemValid = true;
								}
							} else {
								// check for custom theme
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.themeCustomWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// check if custom theme is defined
									if (this.customTheme) {
										// check if theme already defined at this waypoint
										if (currentWaypoint.themeDefined && !this.initialTheme) {
											// raise script error
											this.raiseThemeError(scriptErrors, this.engine.numThemes, currentWaypoint.theme);
										}

										// set theme in waypoint
										currentWaypoint.theme = this.engine.numThemes;
										currentWaypoint.themeDefined = true;
										this.initialTheme = false;
										itemValid = true;
									} else {
										// raise error
										scriptErrors[scriptErrors.length] = [Keywords.themeWord + " " + Keywords.themeCustomWord, "no custom THEME defined"];
										itemValid = true;
									}
								} else {
									// check for initial
									if (peekToken === Keywords.initialWord) {
										// token valid so eat it
										peekToken = scriptReader.getNextToken();

										// copy from initial waypoint
										this.waypointManager.copyInitial(Keywords.themeWord, currentWaypoint, scriptErrors, this.initialTheme);
										this.initialTheme = true;
										itemValid = true;
									}
								}
							}
							break;

						// start script
						case Keywords.scriptStartWord:
							// already in a script block so raise error
							scriptErrors[scriptErrors.length] = [nextToken, "already in a script block"];
							itemValid = true;
							break;

						// show information bar
						case Keywords.showInfoBarWord:
							// show information bar
							this.infoBarEnabled = !this.infoBarEnabled;

							itemValid = true;
							break;

						// show timing
						case Keywords.showTimingWord:
							// show timing
							this.fpsButton.current = this.viewFpsToggle([true], true, this);
							itemValid = true;
							break;

						// extended timing
						case Keywords.extendedTimingWord:
							// show timing
							this.timingDetailButton.current = this.viewTimingDetailToggle([true], true, this);
							itemValid = true;
							break;

						// show generation statistics
						case Keywords.showGenStatsWord:
							// show generation statistics
							this.viewStats([true], true, this);
							if (this.genToggle) {
								this.genToggle.current = [this.statsOn];
								this.menuManager.toggleRequired = true;
							}

							itemValid = true;
							break;

						// boundary delete radius
						case Keywords.deleteRangeWord:
							// get the radius size
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check if is in range
								if (numberValue >= ViewConstants.minDeleteRadius && numberValue <= ViewConstants.maxDeleteRadius) {
									itemValid = true;

									// save the value
									this.engine.removePatternRadius = numberValue;
								}
							}
							break;

						// disable population graph
						case Keywords.noGraphWord:
							// disable graph
							this.graphDisabled = true;
							itemValid = true;
							break;

						// population graph
						case Keywords.graphWord:
							// enable graph display
							this.popGraph = true;
							itemValid = true;
							break;

						// population graph opacity
						case Keywords.graphOpacityWord:
							// read opacity
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();
								if (numberValue >= 0 && numberValue <= 1) {
									itemValid = true;

									// save the value
									this.popGraphOpacity = numberValue;
								}
							}
							break;

						// population graph use points
						case Keywords.graphPointsWord:
							// set points mode
							this.popGraphLines = false;
							itemValid = true;
							break;

						// square display
						case Keywords.squareDisplayWord:
							// set square display mode
							this.engine.isHex = false;

							// update angle control
							this.angleItem.deleted = this.engine.isHex;
							
							itemValid = true;
							break;

						// hex display
						case Keywords.hexDisplayWord:
							// set hex display mode
							this.engine.isHex = true;

							// update angle control
							this.angleItem.deleted = this.engine.isHex;

							itemValid = true;
							break;

						// random seed
						case Keywords.randomSeedWord:
							// read the seed
							this.randomSeed = scriptReader.getNextToken();
							this.randomSeedCustom = true;

							itemValid = true;
							break;

						// linear motion
						case Keywords.linearWord:
							// check for the argument
							peekToken = scriptReader.peekAtNextToken();
							switch(peekToken) {
							// x
							case Keywords.xWord:
								// check if x mode already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.linearWord, Keywords.xWord, scriptErrors);
								}

								// set x mode in waypoint
								currentWaypoint.xLinear = true;
								currentWaypoint.xModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// y
							case Keywords.yWord:
								// check if y mode already defined
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.linearWord, Keywords.yWord, scriptErrors);
								}

								// set y mode in waypoint
								currentWaypoint.yLinear = true;
								currentWaypoint.yModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// zoom
							case Keywords.zoomWord:
								// check if zoom mode already defined
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.linearWord, Keywords.zoomWord, scriptErrors);
								}

								// set zoom mode in waypoint
								currentWaypoint.zLinear = true;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// all
							case Keywords.allWord:
								// check if modes already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.linearWord, Keywords.xWord, scriptErrors);
								}
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.linearWord, Keywords.yWord, scriptErrors);
								}
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.linearWord, Keywords.zoomWord, scriptErrors);
								}

								// set in current waypoint
								currentWaypoint.xLinear = true;
								currentWaypoint.xModeDefined = true;
								currentWaypoint.yLinear = true;
								currentWaypoint.yModeDefined = true;
								currentWaypoint.zLinear = true;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// others are errors
							default:
								this.nonNumericTokenError(scriptReader, scriptErrors, Keywords.linearWord, "argument", Keywords.allWord + ", " + Keywords.xWord + ", " + Keywords.yWord + " or " + Keywords.zoomWord);
								break;
							}

							// item always valid since error handling is included
							itemValid = true;
							break;

						// bezier motion
						case Keywords.bezierWord:
							// check for the argument
							peekToken = scriptReader.peekAtNextToken();
							switch(peekToken) {
							// x
							case Keywords.xWord:
								// check if x mode already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.bezierWord, Keywords.xWord, scriptErrors);
								}

								// set x mode in waypoint
								currentWaypoint.xLinear = false;
								currentWaypoint.xModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// y
							case Keywords.yWord:
								// check if y mode already defined
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.bezierWord, Keywords.yWord, scriptErrors);
								}

								// set y mode in waypoint
								currentWaypoint.yLinear = false;
								currentWaypoint.yModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// zoom
							case Keywords.zoomWord:
								// check if zoom mode already defined
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.bezierWord, Keywords.zoomWord, scriptErrors);
								}

								// set zoom mode in waypoint
								currentWaypoint.zLinear = false;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// all
							case Keywords.allWord:
								// check if modes already defined
								if (currentWaypoint.xModeDefined) {
									this.modeDefined(currentWaypoint.xLinear, Keywords.bezierWord, Keywords.xWord, scriptErrors);
								}
								if (currentWaypoint.yModeDefined) {
									this.modeDefined(currentWaypoint.yLinear, Keywords.bezierWord, Keywords.yWord, scriptErrors);
								}
								if (currentWaypoint.zoomModeDefined) {
									this.modeDefined(currentWaypoint.zLinear, Keywords.bezierWord, Keywords.zoomWord, scriptErrors);
								}

								// set in current waypoint
								currentWaypoint.xLinear = false;
								currentWaypoint.xModeDefined = true;
								currentWaypoint.yLinear = false;
								currentWaypoint.yModeDefined = true;
								currentWaypoint.zLinear = false;
								currentWaypoint.zModeDefined = true;

								// eat the valid token
								peekToken = scriptReader.getNextToken();
								break;

							// others are errors
							default:
								this.nonNumericTokenError(scriptReader, scriptErrors, Keywords.bezierWord, "argument", Keywords.allWord + ", " + Keywords.xWord + ", " + Keywords.yWord + " or " + Keywords.zoomWord);
								break;
							}

							// item always valid since error handling is included
							itemValid = true;
							break;

						// point of interest
						case Keywords.poiWord:
							// mark points of interest found
							poiFound = true;

							// add the current waypoint to the list
							this.waypointManager.add(currentWaypoint);

							// create a new waypoint as a point of interest
							currentWaypoint = this.waypointManager.createWaypoint();
							currentWaypoint.isPOI = true;

							// check for initial
							peekToken = scriptReader.peekAtNextToken();
							if (peekToken === Keywords.initialWord) {
								// token valid so eat it
								peekToken = scriptReader.getNextToken();

								// check if there is already a default POI
								if (this.defaultPOI !== -1) {
									scriptErrors[scriptErrors.length] = [Keywords.poiWord + " " + Keywords.initialWord, "overrides previous initial POI"];
								}

								// set as the default POI
								this.defaultPOI = this.waypointManager.numPOIs();
							}

							// clear "initial" flags
							this.clearInitialFlags();

							itemValid = true;
							break;

						// t
						case Keywords.tWord:
							// get the target generation
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= 0) {
									// check whether already processing waypoints
									if (!waypointsFound) {
										// mark that waypoints have been found
										waypointsFound = true;
									}

									// add a new waypoint if not at generation 0
									if (numberValue > 0) {
										// add the current waypoint to the list
										this.waypointManager.add(currentWaypoint);

										// create a new waypoint
										currentWaypoint = this.waypointManager.createWaypoint();
									}

									// set the target in the current waypoint
									currentWaypoint.targetGen = numberValue;
									currentWaypoint.targetGenDefined = true;

									itemValid = true;
								}
							}
							break;

						// step
						case Keywords.stepWord:
							// get the number of steps
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// check it is in range
								if (numberValue >= ViewConstants.minStepSpeed && numberValue <= ViewConstants.maxStepSpeed) {
									// check if step already defined
									if (currentWaypoint.stepDefined && !this.initialStep && !suppressErrors.step) {
										scriptErrors[scriptErrors.length] = [Keywords.stepWord + " " + numberValue, "overwrites " + currentWaypoint.step];
									}

									// set step in waypoint
									currentWaypoint.step = numberValue;
									currentWaypoint.stepDefined = true;
									this.initialStep = false;
									suppressErrors.step = false;
									itemValid = true;
								}
							} else {
								// check for initial
								peekToken = scriptReader.peekAtNextToken();
								if (peekToken === Keywords.initialWord) {
									// token valid so eat it
									peekToken = scriptReader.getNextToken();

									// copy from initial waypoint
									this.waypointManager.copyInitial(Keywords.stepWord, currentWaypoint, scriptErrors, this.initialStep);
									this.initialStep = true;
									itemValid = true;
								}
							}
							break;

						// pause
						case Keywords.pauseWord:
							// get the target time
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber();

								// check it is in range
								if (numberValue >= 0) {
									// check whether already processing waypoints
									if (!waypointsFound) {
										// mark that waypoints have been found
										waypointsFound = true;
									}

									// add the current waypoint to the list
									this.waypointManager.add(currentWaypoint);
									
									// create a new waypoint
									currentWaypoint = this.waypointManager.createWaypoint();

									// ensure the time is no less than one frame
									if (numberValue < ViewConstants.singleFrameSeconds) {
										numberValue = ViewConstants.singleFrameSeconds;
									}

									// set the target time in the current waypoint
									currentWaypoint.targetTime = numberValue;
									currentWaypoint.targetTimeDefined = true;

									itemValid = true;
								}
							}
							break;

						// viewer width
						case Keywords.widthWord:
							// get the width
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested height if not in popup
								if (!this.isInPopup) {
									if (this.requestedWidth !== -1 && !suppressErrors.width) {
										scriptErrors[scriptErrors.length] = [Keywords.widthWord + " " + numberValue, "overwrites " + this.requestedWidth];
									}
									this.requestedWidth = numberValue;
								}

								// validation will happen at the end of script processing
								suppressErrors.width = false;
								itemValid = true;
							}
							break;

						// viewer height
						case Keywords.heightWord:
							// get the height
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested height if not in popup
								if (!this.isInPopup) {
									if (this.requestedHeight !== -1 && !suppressErrors.height) {
										scriptErrors[scriptErrors.length] = [Keywords.heightWord + " " + numberValue, "overwrites " + this.requestedHeight];
									}
									this.requestedHeight = numberValue;
								}

								// validation will happen at the end of script processing
								suppressErrors.height = false;
								itemValid = true;
							}
							break;

						// popup viewer width
						case Keywords.popupWidthWord:
							// get the width
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested popup height
								if (this.requestedPopupWidth !== -1 && !suppressErrors.popupWidth) {
									scriptErrors[scriptErrors.length] = [Keywords.popupWidthWord + " " + numberValue, "overwrites " + this.requestedPopupWidth];
								}
								this.requestedPopupWidth = numberValue;

								// validation will happen at the end of script processing
								suppressErrors.popupWidth = false;
								itemValid = true;
							}
							break;

						// popup viewer height
						case Keywords.popupHeightWord:
							// get the height
							if (scriptReader.nextTokenIsNumeric()) {
								isNumeric = true;

								// get the value
								numberValue = scriptReader.getNextTokenAsNumber() | 0;

								// save the requested popup height if not in popup
								if (this.requestedPopupHeight !== -1 && !suppressErrors.popupHeight) {
									scriptErrors[scriptErrors.length] = [Keywords.popupHeightWord + " " + numberValue, "overwrites " + this.requestedPopupHeight];
								}
								this.requestedPopupHeight = numberValue;

								// validation will happen at the end of script processing
								suppressErrors.popupHeight = false;
								itemValid = true;
							}
							break;

						// others are errors
						default:
							scriptErrors[scriptErrors.length] = [nextToken, "unknown or misspelt command"];
							itemValid = true;
							break;
						}

						// check if the item was valid
						if (!itemValid) {
							// check if the argument was numeric
							if (isNumeric) {
								// argument was not in range
								scriptErrors[scriptErrors.length] = [nextToken + " " + numberValue, "argument out of range"];
							} else {
								// raise a non-numeric token error
								this.nonNumericTokenError(scriptReader, scriptErrors, nextToken, "argument", type);
							}
						}
					}
				}

				// get next token
				if (nextToken !== "") {
					nextToken = scriptReader.getNextToken();
				}
			}

			// check for unterminated message
			if (readingString) {
				scriptErrors[scriptErrors.length] = [Keywords.stringDelimiter + stringValue, "unterminated string"];
			}

			// check if waypoints and one of track, track box or track loop defined
			if (waypointsFound && this.trackDefined) {
				// check which track mode was defined
				if (this.trackBoxDefined) {
					notPossibleError = Keywords.trackBoxWord;
				} else {
					if (this.trackLoopDefined) {
						notPossibleError = Keywords.trackLoopWord;
					} else {
						notPossibleError = Keywords.trackWord;
					}
				}

				// raise error
				scriptErrors[scriptErrors.length] = [notPossibleError, "can not be used with Waypoints"];

				// disable track mode
				this.trackDefined = false;
				this.trackBoxDefined = false;
				this.trackLoopDefined = false;
			}

			// check for track or track loop command
			if (!this.trackBoxDefined && (this.trackDefined || this.trackLoopDefined)) {
				// check for track loop
				if (this.trackLoopDefined) {
					// check for major gridlines
					if (this.engine.gridLineMajor > 0) {
						// multiply track parameters by grid line major interval
						trackPeriod *= this.engine.gridLineMajor;
					}

					// set LOOP
					currentWaypoint.loopGeneration = trackPeriod;
				}

				// set the track paramters
				this.trackBoxN = trackY;
				this.trackBoxE = trackX;
				this.trackBoxS = trackY;
				this.trackBoxW = trackX;
			}

			// check if waypoints or POI were found
			if (waypointsFound || poiFound) {
				// add the waypoint/POI to the list
				this.waypointManager.add(currentWaypoint);

				// set the current waypoint to be the first one
				if (waypointsFound) {
					currentWaypoint = this.waypointManager.firstWaypoint();
					this.waypointsDefined = true;
				} else {
					// check for initial POI defined
					if (this.defaultPOI !== -1) {
						currentWaypoint = this.waypointManager.poiList[this.defaultPOI];
						this.currentPOI = this.defaultPOI;
					}
				}

				// validate AUTOFIT
				if (waypointsFound) {
					for (i = 0; i < this.waypointManager.numWaypoints(); i += 1) {
						currentWaypoint = this.waypointManager.waypointList[i];
						
						// check if AUTOFIT used
						if (currentWaypoint.fitZoom) {
							// check if X, Y or ZOOM are defined
							if (currentWaypoint.xDefined || currentWaypoint.yDefined || currentWaypoint.zoomDefined) {
								stringValue = "";

								// check if X defined
								if (currentWaypoint.xDefined) {
									stringValue = "X " + currentWaypoint.x;
									if (currentWaypoint.yDefined) {
										if (currentWaypoint.zoomDefined) {
											stringValue += ", Y " + currentWaypoint.y + " and ZOOM " + currentWaypoint.zoom;
										} else {
											stringValue += " and Y " + currentWaypoint.y;
										}
									} else {
										if (currentWaypoint.zoomDefined) {
											stringValue += " and ZOOM " + currentWaypoint.zoom;
										}
									}
								} else {
									if (currentWaypoint.yDefined) {
										stringValue = "Y " + currentWaypoint.y;
										if (currentWaypoint.zoomDefined) {
											stringValue += " and ZOOM " + currentWaypoint.zoom;
										}
									} else {
										if (currentWaypoint.zoomDefined) {
											stringValue = "ZOOM " + currentWaypoint.zoom;
										}
									}
								}

								// output the error
								scriptErrors[scriptErrors.length] = [Keywords.autoFitWord, "overwrites " + stringValue];
							}
						}
					}
					// reset current to waypoint zero
					currentWaypoint = this.waypointManager.firstWaypoint();
				}

				if (poiFound) {
					// check for autostart
					if (currentWaypoint.modeAtPOI === WaypointConstants.play) {
						if (this.executable) {
							this.autoStart = true;
						}
					}
				}
			}

			// check if autofit defined
			if (currentWaypoint.fitZoom) {
				// set autofit
				this.autoFit = true;
			}

			// set position from current
			if (currentWaypoint.xDefined) {
				this.engine.xOff = this.engine.width / 2 - currentWaypoint.x;
			}
			if (currentWaypoint.yDefined) {
				this.engine.yOff = this.engine.height / 2 - currentWaypoint.y;
			}

			// set zoom
			if (currentWaypoint.zoomDefined) {
				this.engine.zoom = currentWaypoint.zoom;
			}

			// set angle
			if (currentWaypoint.angleDefined) {
				this.engine.angle = currentWaypoint.angle;
			}

			// set theme
			if (currentWaypoint.themeDefined) {
				this.engine.setTheme(currentWaypoint.theme, 1);
			}

			// set depth
			if (currentWaypoint.depthDefined) {
				this.engine.layerDepth = (currentWaypoint.depth / ViewConstants.depthScale) + ViewConstants.minDepth;
			}

			// set layers
			if (currentWaypoint.layersDefined) {
				this.engine.layers = currentWaypoint.layers;
			}

			// set gps
			if (currentWaypoint.gpsDefined) {
				this.genSpeed = currentWaypoint.gps;
			}

			// set step
			if (currentWaypoint.stepDefined) {
				this.gensPerStep = currentWaypoint.step;
			}

			// set message
			if (currentWaypoint.textDefined) {
				this.menuManager.notification.notify(currentWaypoint.textMessage, 15, 1000, 15, false);
			}

			// copy stop and loop from the first waypoint
			this.stopGeneration = currentWaypoint.stopGeneration;
			this.loopGeneration = currentWaypoint.loopGeneration;

			// check if default x, y and zoom used
			if (currentWaypoint.zoomDefined) {
				this.defaultZoomUsed = true;
			}
			if (currentWaypoint.xDefined) {
				this.defaultXUsed = true;
			}
			if (currentWaypoint.yDefined) {
				this.defaultYUsed = true;
			}

			// set grid
			if (currentWaypoint.gridDefined) {
				this.engine.displayGrid = currentWaypoint.grid;
			}

			// set stars
			if (currentWaypoint.starsDefined) {
				this.starsOn = currentWaypoint.stars;
			}

			// count how many custom colours provided
			for (i = 0; i < numStates; i += 1) {
				if (this.customColours[i] !== -1) {
					numCustomColours += 1;
				}
			}

			// check if there were custom colours
			if (numCustomColours > 0) {
				// work out if all custom colours used
				this.allCustom = true;

				// if custom colours were provided then check they exist for all states
				for (i = 0; i < numStates; i += 1) {
					if (PatternManager.stateCount[i]) {
						if (this.customColours[i] === -1) {
							// get the default colour
							colValue = this.colourList[i];

							// raise an error if in strict validation mode
							if (this.strict) {
								if (this.engine.isLifeHistory) {
									scriptErrors[scriptErrors.length] = [whichColour + " " + ViewConstants.stateDisplayNames[i], "definition missing (used " + (colValue >> 16) + " " + ((colValue >> 8) & 255) + " " + (colValue & 255) + ")"];
								} else {
									scriptErrors[scriptErrors.length] = [whichColour + " " + i, "definition missing (used " + (colValue >> 16) + " " + ((colValue >> 8) & 255) + " " + (colValue & 255) +  ")"];
								}
							}

							// set to default colour
							this.customColours[i] = colValue;

							// mark not all custom colours used
							this.allCustom = false;

							// mark state used default colour
							this.customColourUsed[i] = ViewConstants.stateUsedDefault;
						} else {
							// mark state used custom colour
							this.customColourUsed[i] = ViewConstants.stateUsedCustom;
						}
					} else {
						// mark state was not used
						this.customColourUsed[i] = ViewConstants.stateNotUsed;
					}
				}

				// change the colour set name
				if (this.allCustom) {
					this.colourSetName = "(custom)";
				} else {
					this.colourSetName += " (custom*)";
				}
			} else {
				// clear custom colours
				this.customColours  = [];
			}
			
			// check if custom theme provided
			if (this.customTheme) {
				// validate custom theme
				this.validateCustomTheme(scriptErrors, whichColour);
			}

			// check if custom grid line colour provided
			if (this.customGridColour !== -1) {
				this.engine.gridLineRaw = this.customGridColour;
			}

			// check if custom grid major line colour provided
			if (this.customGridMajorColour !== -1) {
				this.engine.gridLineBoldRaw = this.customGridMajorColour;
			}

			// enforce view only for multi-state patterns that aren't LifeHistory
			if (numStates > 2 && !(this.engine.isLifeHistory || this.engine.mulitNumStates !== -1)) {
				this.viewOnly = true;
			}

			// check if playback disabled
			if (this.viewOnly) {
				// create the error message
				notPossibleError = "not possible due to " + Keywords.viewOnlyWord;

				// autostart not possible if playback disabled
				if (this.autoStart) {
					scriptErrors[scriptErrors.length] = [Keywords.autoStartWord, notPossibleError];

					// disable autostart
					this.autoStart = false;
				}

				// stop not possible if playback disabled
				if (this.stopGeneration !== -1) {
					scriptErrors[scriptErrors.length] = [Keywords.stopWord + " " + this.stopGeneration, notPossibleError];
				}


				// loop not possible if playback disabled
				if (this.loopGeneration !== -1) {
					scriptErrors[scriptErrors.length] = [Keywords.loopWord + " " + this.loopGeneration, notPossibleError];
				}
			}

			// check if x or y offset make the pattern not fit on the maximum grid
			if (this.xOffset !== 0 && (this.patternWidth + ViewConstants.maxStepSpeed + Math.abs(this.xOffset) * 2 >= this.engine.maxGridSize)) {
				scriptErrors[scriptErrors.length] = [Keywords.xOffsetWord + " " + this.xOffset, "pattern does not fit on grid at this offset"];
				this.xOffset = 0;
			}

			if (this.yOffset !== 0 && (this.patternHeight + ViewConstants.maxStepSpeed + Math.abs(this.yOffset) * 2 >= this.engine.maxGridSize)) {
				scriptErrors[scriptErrors.length] = [Keywords.yOffsetWord + " " + this.yOffset, "pattern does not fit on grid at this offset"];
				this.yOffset = 0;
			}

			// save number of script errors
			this.numScriptErrors = scriptErrors.length;
		}

		// check if custom theme defined
		if (this.customTheme) {
			// extend range of the Theme UI slider
			if (this.themeItem) {
				this.themeItem.upper = this.engine.numThemes;
			}
		}

		// check if window title set
		if (this.windowTitle !== "") {
			// perform any variable substitutions
			this.windowTitle = this.substituteVariables(this.windowTitle);
		}

		// check if autofit was enabled
		if (this.autoFit) {
			this.autoFitDefined = true;
		}

		// check if graph and graph disabled were defined
		if (this.popGraph && this.graphDisabled) {
			scriptErrors[scriptErrors.length] = [Keywords.graphWord, "not valid with " + Keywords.noGraphWord];
			this.popGraph = false;
		}

		// check if width was specified
		var lower = 0;
		var sizeError = false;
		if (this.requestedWidth !== -1) {
			lower = ViewConstants.minViewerWidth;
			if (this.noGUI) {
				lower = ViewConstants.minNoGUIWidth;
			}
			if (this.requestedWidth < lower || this.requestedWidth > this.maxCodeWidth) {
				scriptErrors[scriptErrors.length] = [Keywords.widthWord + " " + this.requestedWidth, "argument out of range"];
				sizeError = true;
			}
		}

		// check if height was specified
		if (this.requestedHeight !== -1) {
			lower = ViewConstants.minViewerHeight;
			if (this.noGUI) {
				lower = ViewConstants.minNoGUIHeight;
			}
			if (this.requestedHeight < lower || this.requestedHeight > ViewConstants.maxViewerHeight) {
				scriptErrors[scriptErrors.length] = [Keywords.heightWord + " " + this.requestedHeight, "argument out of range"];
				sizeError = true;
			}
		}

		// check if popup width and/or height were specified
		if (this.isInPopup) {
			if (this.requestedPopupWidth !== -1) {
				if (this.requestedPopupWidth < ViewConstants.minViewerWidth || this.requestedPopupWidth > this.maxCodeWidth) {
					scriptErrors[scriptErrors.length] = [Keywords.popupWidthWord + " " + this.requestedPopupWidth, "argument out of range"];
					this.requestedPopupWidth = -1;
					sizeError = true;
				}
			}

			if (this.requestedPopupHeight !== -1) {
				if (this.requestedPopupHeight < ViewConstants.minViewerHeight || this.requestedPopupHeight > ViewConstants.maxViewerHeight) {
					scriptErrors[scriptErrors.length] = [Keywords.popupHeightWord + " " + this.requestedPopupHeight, "argument out of range"];
					this.requestedPopupHeight = -1;
					sizeError = true;
				}
			}
		}

		// check if there was a size error
		if (sizeError || scriptErrors.length) {
			// enable GUI and reset window size so errors can be seen
			if (this.requestedWidth !== -1 && (this.requestedWidth < ViewConstants.minViewerWidth)) {
				this.requestedWidth = ViewConstants.minViewerWidth;
			}
			if (this.requestedHeight !== -1 && (this.requestedHeight < ViewConstants.minMenuHeight)) {
				this.requestedHeight = ViewConstants.minMenuHeight;
			}
			this.noGUI = false;
		}

		// enable or disable menu based on NOGUI
		this.viewMenu.deleted = this.noGUI;
		this.menuManager.noGUI = this.noGUI;
		this.menuManager.noCopy = this.noCopy;

		// silently disable AUTOSTART, GRAPH, THUMB, THUMBLAUNCH, SHOWTIMING, SHOWGENSTATS and SHOWINFOBAR if NOGUI specified
		if (this.noGUI) {
			this.autoStart = false;
			this.thumbnail = false;
			this.thumbLaunch = false;
			this.popGraph = false;
			this.viewFpsToggle([false], true, this);
			this.viewTimingDetailToggle([false], true, this);
			this.viewStats([false], true, this);
			this.infoBarEnabled = false;
		}

		// hide source if requested
		if (this.noSource) {
			// hide the text box
			this.element.style = "display:none";

			// hide the select all box if on the wiki
			if (this.element.parentNode) {
				if (this.element.parentNode.parentNode) {
					if (this.element.parentNode.parentNode.className === DocConfig.divCodeClassName) {
						this.element.parentNode.parentNode.style = "display:none;";
					}
				}
			}
		}

		// sort labels into zoom order
		this.waypointManager.sortLabels();
	};

	// reset any view controls that scripts can overwrite
	View.prototype.resetScriptControls = function() {
		// reset maximum grid size
		this.engine.maxGridSize = 1 << ViewConstants.defaultGridPower;

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
		this.panNotified = false;

		// reset help topics visibility
		this.showTopics = false;
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
				me.copyRLE(me);
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
		this.patternName = "";
		this.patternOriginator = "";
		this.patternWidth = 0;
		this.patternHeight = 0;
		this.patternStates = 0;
		this.patternUsedStates = 0;
		this.patternFormat = "(none)";
		this.engine.isLifeHistory = false;
		this.engine.isHex = false;
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
		    i = 0;

		// clear script error list
		this.scriptErrors = [];

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

			// read if the pattern is executable
			this.executable = PatternManager.executable;

			// check if the rule is a History rule
			this.engine.isLifeHistory = pattern.isHistory;

			// read the number of states (Generations or HROT)
			this.engine.multiNumStates = pattern.multiNumStates;

			// check if the rule is HROT
			this.engine.isHROT = pattern.isHROT;
			if (pattern.isHROT) {
				this.engine.HROT.births = pattern.birthHROT;
				this.engine.HROT.survivals = pattern.survivalHROT;
				this.engine.HROT.scount = pattern.multiNumStates;
				this.engine.HROT.setTypeAndRange(pattern.neighborhoodHROT, pattern.rangeHROT);
			}

			// check if the neighbourhood is hex
			this.engine.isHex = pattern.isHex;
			this.engine.patternDisplayMode = pattern.isHex;

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
			// check if there are states other than 0 or 1 actually used
			if (PatternManager.stateCount[2] || PatternManager.stateCount[3] || PatternManager.stateCount[4] || PatternManager.stateCount[5] || PatternManager.stateCount[6]) {
				// create the overlay to render additional states
				this.engine.createOverlay();
			}

			// check if state 6 is used
			if (PatternManager.stateCount[6]) {
				this.engine.createState6Mask();
			}
		}

		// clear any window title
		this.windowTitle = "";

		// disable stars
		this.starsOn = false;

		// initalised ColourManager
		ColourManager.init();

		// create the colour themes
		this.engine.createColourThemes();

		// create the colour index
		this.engine.createColourIndex();

		// clear the grid
		this.engine.clearGrids();

		// check for LifeHistory
		if (this.engine.isLifeHistory) {
			// default to theme 10
			this.engine.setTheme(10, 1);
		} else {
			// check for Generations or HROT
			if (this.engine.multiNumStates > 2) {
				// multi state uses theme 11
				this.engine.setTheme(11, 1);
			} else {
				// default to theme 1
				this.engine.setTheme(1, 1);
			}
		}

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

		// set the default position
		this.engine.xOff = this.engine.width / 2;
		this.engine.yOff = this.engine.height / 2;

		// set the default zoom and position are not used
		this.defaultZoomUsed = false;
		this.defaultXUsed = false;
		this.defaultYUsed = false;

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
		this.customLabelColour = ViewConstants.labelFontColour;

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

		// reset menu visibility to defaults
		this.playList.deleted = false;
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

		// update help UI
		this.helpToggle.current = this.toggleHelp([this.displayHelp], true, this);

		// reset grid lines
		this.engine.gridLineRaw = this.engine.gridLineRawDefault;
		this.engine.gridLineBoldRaw = this.engine.gridLineBoldRawDefault;
		this.engine.gridLineMajor = 10;
		this.engine.gridLineMajorEnabled = true;
		this.customGridMajorColour = -1;
		this.customGridColour = -1;

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

		// reset labels
		this.waypointManager.clearLabels();

		// enable history
		this.noHistory = false;

		// copy pattern to center
		if (pattern) {
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

			// reset controls a script can overwrite
			this.resetScriptControls();

			// read any script in the title
			if (pattern.title) {
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
			if (pattern.width > this.engine.maxGridSize || pattern.height >= this.engine.maxGridSize) {
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
			}

			// add CXRLE Pos if defined
			if (this.posDefined) {
				this.xOffset += this.posXOffset;
				this.yOffset += this.posYOffset;
			}

			// reset the grid size
			this.engine.resetGridSize(this.defaultGridWidth, this.defaultGridHeight);

			// check if the grid is smaller than the pattern and/or bounded grid plus the maximum step speed
			borderSize = ViewConstants.maxStepSpeed;
			if (this.engine.isHROT && ((this.engine.HROT.range * 4 + 1) > ViewConstants.maxStepSpeed)) {
				borderSize = this.engine.HROT.range * 4 + 1;
				if (this.engine.boundedGridType !== -1) {
					borderSize += this.engine.HROT.range * 2;
				}
			}
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
					//this.engine.populateState6Mask(pattern, this.xOffset, this.yOffset, this.specifiedWidth, this.specifiedHeight);
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

			// update the life rule
			this.engine.updateLifeRule();

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

		// copy custom colours to engine
		this.engine.customColours = this.customColours;

		// create the colour palette
		this.engine.createColours();

		// create the pixel colours from the palette at full brightness
		this.engine.createPixelColours(1);	

		// set the graph controls
		this.opacityItem.current = this.viewOpacityRange([this.popGraphOpacity, this.popGraphOpacity], false, this);
		this.linesToggle.current = [this.popGraphLines];

		// update autofit UI
		this.autoFitToggle.current = [this.autoFit];

		// update grid UI
		this.gridToggle.current = [this.engine.displayGrid];

		// compute bounding box
		this.engine.resetBoxes(this.state1Fit);

		// reset history box
		this.engine.resetHistoryBox();

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
			this.engine.createMultiStateColours(this.colourList);

			// reset snapshot manager
			this.engine.snapshotManager.reset();

			// disable graph
			this.graphDisabled = true;
			this.popGraph = false;
		} else {
			// create the colour grid if not multi-state Generations or HROT rule
			if (this.engine.multiNumStates <= 2) {
				this.engine.resetColourGridBox(this.engine.grid16);
			}

			// check if this is a LifeHistory pattern
			if (this.engine.isLifeHistory) {
				// check if there are state 2 cells
				if (PatternManager.stateCount[2]) {
					// copy state 2 to the colour grid
					//this.engine.copyState2(pattern, this.xOffset, this.yOffset, this.specifiedWidth, this.specifiedHeight);
					this.engine.copyState2(pattern, this.panX, this.panY);
				}
			}

			// reset population
			this.engine.resetPopulationBox(this.engine.grid16, this.engine.colourGrid);

			// set the bounded grid tiles if specified
			if (this.engine.boundedGridType !== -1) {
				this.engine.setBoundedTiles();
			}

			// save state for reset
			this.engine.saveGrid(this.noHistory);
			this.engine.restoreSavedGrid(this.noHistory);
		}

		// set the graph UI control
		this.graphButton.locked = this.graphDisabled;
		this.graphButton.current = [this.popGraph];

		// set the hex UI control
		this.hexButton.current = [this.engine.isHex];

		// set the InfoBar UI control
		this.infoBarButton.current = [this.infoBarEnabled];

		// set the Stars UI control
		this.starsButton.current = [this.starsOn];

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
		if (this.zoomItem) {
			this.zoomItem.current = this.viewZoomRange([this.engine.zoom, this.engine.zoom], false, this);
		}
		this.defaultX = this.engine.xOff;
		this.defaultY = this.engine.yOff;

		// set the default angle
		this.defaultAngle = this.engine.angle;
		if (this.angleItem) {
			this.angleItem.current = [this.defaultAngle, this.defaultAngle];
		}

		// set the default theme
		this.defaultTheme = this.engine.colourTheme;
		if (this.themeItem) {
			this.themeItem.current = [this.defaultTheme, this.defaultTheme];
		}

		// set the generation speed
		this.defaultGPS = this.genSpeed;
		numberValue = Math.sqrt((this.defaultGPS - ViewConstants.minGenSpeed) / (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed));
		if (this.generationRange) {
			this.generationRange.current = this.viewGenerationRange([numberValue, numberValue], true, this);
		}

		// set the step
		this.defaultStep = this.gensPerStep;
		if (this.stepRange) {
			this.stepRange.current = this.viewStepRange([this.defaultStep, this.defaultStep], true, this);
		}

		// set the layers
		this.defaultLayers = this.engine.layers;
		if (this.layersItem) {
			this.layersItem.current = [this.defaultLayers, this.defaultLayers];
		}

		// set the layer depth
		this.defaultDepth = this.engine.layerDepth;
		numberValue = Math.sqrt(this.defaultDepth);
		if (this.depthItem) {
			this.depthItem.current = this.viewDepthRange([numberValue, numberValue], true, this);
		}

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

		// render the help text to set help line positions
		Help.renderHelpText(this, null, 6, 14, 19, 0);

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

						// otherwise check if it is numeric
						default:
							value = tokens[i];
							if (!Number.isNaN(parseFloat(value)) && Number.isFinite(Number(value))) {
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

	// launch the pattern in Molly
	function launchInMolly(element) {
		// get the parent node
		var parentItem = findDiv(element),

		    // the the element containing the pattern
		    textItem = parentItem.getElementsByTagName(DocConfig.patternSourceName)[0],

		    // get the pattern contents
		    cleanItem = cleanPattern(textItem),

		    // get the form
		    formItem = parentItem.getElementsByTagName("form")[0],

		    // get the input item in the form
		    inputItem = formItem.getElementsByTagName("input")[0];

		// copy the pattern into the input item in the form
		inputItem.value = cleanItem;

		// submit the form
		formItem.submit();
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

	// callback for show in molly anchor
	function mollyAnchorCallback(event) {
		launchInMolly(this);

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();

		return false;
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
		    formItem = null,
		    inputItem = null,
		    childItem = null,

		    // whether the pattern is valid
		    isValid = false,

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
				if (typedArrays && canvasItem && canvasItem.getContext) {
					// check if the text item exists
					if (textItem) {
						// remove any html tags from the text item and trim
						cleanItem = cleanPattern(textItem);

						// check whether to limit the height of the text item
						if (DocConfig.patternSourceMaxHeight > -1) {
							if (textItem.clientHeight > DocConfig.patternSourceMaxHeight) {
								textItem.style.height = DocConfig.patternSourceMaxHeight + "px";
							}
						}
						
						// initalise viewer not in popup
						startView(cleanItem, canvasItem, textItem.offsetWidth, false, textItem);
					}
				} else {
					// hide the canvas item
					if (DocConfig.hide && canvasItem) { 
						canvasItem.style.display = "none";
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
							
								// check if the contents is a valid pattern
								isValid = isPattern(cleanItem, allocator);
								if (isValid) {
									// add the anchor tag
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

								// check whether the pattern was valid but too big
								if (PatternManager.tooBig) {
									isValid = true;
								}

								// disable Molly for now... TBD
								isValid = false;

								// check if the pattern is valid but not executable
								if (isValid && !PatternManager.executable) {
									// check if the anchor exists
									if (!anchorItem) {
										// find the anchor
										anchorItem = rleItem.getElementsByTagName('a')[0];
									}

									// add the new anchor
									newAnchor = document.createElement('a');
									newAnchor.setAttribute('href', '#');
									newAnchor.innerHTML = "Show in Molly";

									// set the onclick
									registerEvent(newAnchor, "click", mollyAnchorCallback, false);

									// create a new divider
									nodeItem = document.createTextNode(" / ");

									// add to the parent
									anchorItem.parentNode.appendChild(nodeItem);
									anchorItem.parentNode.appendChild(newAnchor);

									// create the form
									formItem = document.createElement('form');
									formItem.setAttribute('action', 'molly.php');
									formItem.setAttribute('method', 'post');
									formItem.setAttribute('target', 'molly');
									
									// create the input item
									inputItem = document.createElement('input');
									inputItem.setAttribute('type', 'hidden');
									inputItem.setAttribute('name', 'pattern');
									
									// add the input item to the form
									formItem.appendChild(inputItem);

									// add the form to the parent
									anchorItem.parentNode.appendChild(formItem);
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
	window['launchInMolly'] = launchInMolly;
}
());
