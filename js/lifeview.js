// LifeViewer Plugin
// Main LifeViewer application.

/*
This file is part of LifeViewer
 Copyright (C) 2015-2024 Chris Rowett

 LifeViewer is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
		// settings prefix
		/** @const {string} */ settingsPrefix : "LV",

		// y coordinate direction setting name
		/** @const {string} */ ySettingName : "yDirection",

		// Wolfram RuleTable emulation colours
		/** @const {string} */ wolframEmulationColours : "0 0 0 0\n1 0 255 192\n2 0 192 255\n",

		// control or command key text
		/** @const {string} */ ctrlText : "Ctrl",
		/** @const {string} */ cmdText : "Cmd",

		// alt or option key text
		/** @const {string} */ altText : "Alt",
		/** @const {string} */ optionText : "Option",

		// alt keys that LifeViewer uses (any accesskey attributes that match these will be disabled)
		/** @const {string} */ altKeys : "0123456789rtyopasghjklxcbn",

		// label justification mode
		/** @const {number} */ labelMiddle : 0,
		/** @const {number} */ labelLeft : 1,
		/** @const {number} */ labelRight : 2,

		// number of user-selectable paste buffers
		/** @const {number} */ numPasteBuffers : 10,

		// key for localstorage setting of done flag (for chrome bug)
		/** @const {string} */ doneKey : "workaround",

		// maximum start from generation
		/** @const {number} */ maxStartFromGeneration : 4194304,

		// fit zoom types
		/** @const {number} */ fitZoomPattern : 0,
		/** @const {number} */ fitZoomSelection : 1,
		/** @const {number} */ fitZoomMiddle : 2,

		// default random pattern dimension
		/** @const {number} */ randomDimension : 64,

		// min and max random width, height and fill percentage
		/** @const {number} */ minRandomWidth : 1,
		/** @const {number} */ maxRandomWidth : 4096,
		/** @const {number} */ minRandomHeight : 1,
		/** @const {number} */ maxRandomHeight : 4096,
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
		/** @const {Array<number>} */ superToHistoryStates : [0, 1, 2, 3, 4, 5, 6, 3, 4, 1, 2, 1, 2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],

		// square root of 3 used for triangular grid
		/** @const {number} */ sqrt3 : Math.sqrt(3),

		// triangular y zoom factor
		/** @const {number} */ triangularYFactor : Math.sqrt(3),

		// hexagonal y zoom factor
		/** @const {number} */ hexagonalYFactor : 3 / 2 * (1 / Math.sqrt(3)),

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
		/** @const {number} */ numStars : 16384,

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
		/** @type {CanvasRenderingContext2D} */ icons : null,

		// delete radius range
		/** @const {number} */ minDeleteRadius : 1,
		/** @const {number} */ maxDeleteRadius : 16,

		// default is also minimum radius for HROT and Extended algos
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
		/** @const {number} */ customThemeSelectedCells : 30,
		/** @const {number} */ customThemeHelp : 31,

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
		/** @const {Array<string>} */ stateNames : ["dead", "alive", "history", "mark1", "markoff", "mark2", "kill"],

		// display names for [R]History states
		/** @const {Array<string>} */ stateDisplayNames : ["OFF", "ON", "HISTORY", "MARK1", "MARKOFF", "MARK2", "KILL"],

		// min and max red shading for performance display
		/** @const {number} */ perfMin : 0,
		/** @const {number} */ perfMax : 16,

		// whether colour theme has colour history
		/** @const {boolean} */ colourHistory : false,

		// error notification duration in ms
		/** @const {number} */ errorDuration : 1800,

		// external viewer window
		/** @const {string} */ externalViewerTitle : "LifeViewer",

		// build version
		/** @const {number} */ versionBuild : 1206,

		// standard edition name
		/** @const {string} */ standardEdition : "Standard",

		// pro edition name
		/** @const {string} */ proEdition : "Pro",

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
		/** @const {number} */ minZoom : 1 / 32,
		/** @const {number} */ maxZoom : 64,

		// minimum and maximum tilt
		/** @const {number} */ minTilt : -5,
		/** @const {number} */ maxTilt : 5,

		// minimum and maximum negative zoom
		/** @const {number} */ minNegZoom : -32,
		/** @const {number} */ maxNegZoom : -1,

		// minimum and maximum zoom for annotations (so they won't fade at min or max camera zoom)
		/** @const {number} */ minAnnotationNegZoom : -2048,
		/** @const {number} */ maxAnnotationNegZoom : -1,
		/** @const {number} */ minAnnotationZoom : 1 / 2048,
		/** @const {number} */ maxAnnotationZoom : 2048,

		// default refresh rate
		/** @const {number} */ defaultRefreshRate : 60,

		// minimum and maximum generation speed
		/** @const {number} */ minGenSpeed : 1,
		/** @const {number} */ maxGenSpeed : 60,  // default refresh rate

		// minimum and maximum steps
		/** @const {number} */ minStepSpeed : 1,
		/** @const {number} */ maxStepSpeed : 64,

		// dead zone factor in speed control
		/** @const {number} */ deadZoneSpeed : 0.1,

		// dead zone factor in tilt control
		/** @const {number} */ deadZoneTilt : 0.05,

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

		// error list font colour
		/** @const {string} */ errorsFontColour : "rgb(255,48,48)",

		// minimum and maximum width of the Viewer
		/** @const {number} */ minNoGUIWidth: 64,
		/** @const {number} */ minNoGUIHeight: 64,
		/** @const {number} */ minLegacyWidth : 480,
		/** @const {number} */ minViewerWidth : 600,
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
		/** @const {number} */ zoomSliderDefaultWidth : 172,

		// maximum width for the zoom slider (gets wider if the window is wider than the default)
		/** @const {number} */ zoomSliderMaxWidth : 292,

		// custom colour usage states
		/** @const {number} */ stateNotUsed : 0,
		/** @const {number} */ stateUsedCustom : 1,
		/** @const {number} */ stateUsedDefault : 2,

		// minimum and maximum bold grid line interval (0 means no bold grid lines)
		/** @const {number} */ minBoldGridInterval : 0,
		/** @const {number} */ maxBoldGridInterval : 32,

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
		/** @type {Allocator} */ allocator : new Allocator(),

		// list of Canvas items and View pairs
		/** @type {Array} */ viewers : [],

		// standalone viewer
		/** @type {number} */ standaloneIndex : -1,

		// popup window
		/** @type {PopupWindow} */ popupWindow : null,

		// list of patterns in multiverse mode
		/** @type {Array} */ patterns : [],

		// whether in multiverse mode
		/** @type {boolean} */ overview : false,

		// last copied text
		/** @type {string} */ clipText : "",

		// frame rate measurement
		/** @type {number} */ firstFrame : 0,
		/** @type {number} */ frameTime : 0,
		/** @const {number} */ frameCount : 12,
		/** @type {number} */ currentFrame : 0,
		/** @type {number} */ refreshRate : 60
	};

	// frame rate calculation function
	Controller.frameRateMeasure = function() {
		var	/** @type {number} */ i = 0;

		if (Controller.currentFrame === 0) {
			Controller.firstFrame = performance.now();
		}

		if (Controller.currentFrame === Controller.frameCount) {
			// measure the time taken over the frame count
			Controller.lastFrame = performance.now();

			// save the frame time (ms)
			Controller.frameTime = (performance.now() - Controller.firstFrame) / Controller.frameCount;

			// compute the monitor refresh rate from the frame time
			i = (1000 / Controller.frameTime) | 0;

			// snap to known monitor refresh rates with a tolerance
			if (i <= 40) {
				i = 30;
			} else if (i <= 70) {
				i = 60;
			} else if (i <= 100) {
				i = 75;
			} else if (i <= 130) {
				i = 120;
			} else if (i <= 155) {
				i = 144;
			} else if (i <= 175) {
				i = 165;
			} else if (i <= 260) {
				i = 240;
			}
			Controller.refreshRate = i;
			console.log("LifeViewer refresh rate", i + "Hz");

			// start main application
			setTimeout(startAllViewers, 0);
		} else {
			requestAnimationFrame(Controller.frameRateMeasure);
		}

		Controller.currentFrame += 1;
	};

	// return standalone viewer
	/** @returns {Array} */
	Controller.standaloneViewer = function() {
		var	/** @type {Array} */ result = null;

		// check if there is a standalone viewer
		if (this.standaloneIndex !== -1) {
			result = this.viewers[this.standaloneIndex];
		}

		// return the viewer
		return result;
	};

	// return the View for the given canvas
	/** @returns {View} */
	Controller.findViewerByCanvas = function(/** @type {number} */ tab) {
		var	/** @type {View} */ result = null,
			/** @type {number} */ i = 0;

		while (i < Controller.viewers.length) {
			if (Controller.viewers[i][0].tabIndex === tab) {
				result = Controller.viewers[i][1];
				break;
			}
			i += 1;
		}

		return result;
	};

	// return the View for the requested viewer
	/** @returns {View} */
	Controller.getView = function(/** @type {number} */ which) {
		var	/** @type {View} */ result = null;

		if (which >=0 && which < this.viewers.length) {
			result = this.viewers[which][1];
		}

		return result;
	};

	// return the Canvas for the requested viewer
	/** @returns {HTMLCanvasElement} */
	Controller.getCanvas = function(/** @type {number} */ which) {
		var	/** @type {HTMLCanvasElement} */ result = null;

		if (which >=0 && which < this.viewers.length) {
			result = this.viewers[which][0];
		}

		return result;
	};

	// return the number of viewers
	/** @returns {number} */
	Controller.numViewers = function() {
		return this.viewers.length;
	};

	// return number of viewers playing
	/** @returns {number} */
	Controller.viewersPlaying = function() {
		var	/** @type {View} */ currentViewer = null,
			/** @type {number} */ count = 0,
			/** @type {number} */ i = 0;

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
		var	currentViewer = null,
			/** @type {number} */ i = 0,
			/** @type {number} */ result = 0;

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
	/** @returns {number} */
	Controller.stopAllViewers = function() {
		var	currentViewer = null,
			/** @type {number} */ i = 0,
			/** @type {number} */ result = 0;

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
	/** @returns {number} */
	Controller.stopOtherViewers = function(/** @type {View} */ thisOne) {
		var	currentViewer = null,
			/** @type {number} */ i = 0,
			/** @type {number} */ result = 0;

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

	// BitVector
	/**
	 * @constructor
	 */
	function BitVector(/** @type {Uint8Array} */ data) {
		/** @type {Uint8Array} */ this.buffer = data;
		/** @type {number} */ this.bit = 0;
		/** @type {number} */ this.maxBit = this.buffer.length * 8;
	};

	// get the next bit from the BitVector
	/** @returns {number} */
	BitVector.prototype.getNextBit = function() {
		var	/** @type {number} */ result = 0;

		// get the next bit from the buffer
		result = (this.buffer[this.bit >> 3] >> (7 - (this.bit & 7))) & 1;
		this.bit += 1;

		// prevent end of buffer overrun
		if (this.bit === this.maxBit) {
			console.log("end of buffer");
			this.bit -= 1;
		}

		return result;
	};

	// get a value from the BitVector
	/** @returns {number} */
	BitVector.prototype.getValue = function(/** @type {number} */ bits) {
		var	/** @type {number} */ result = 0;

		while (bits > 0) {
			bits -= 1;
			result |= this.getNextBit() << bits;
		}

		return result;
	};

	// PatternInfo object
	/**
	 * @constructor
	 */
	function PatternInfo(/** @type {string} */ name, /** @type {string} */ pattern, /** @type {string} */ rule, /** @type {number} */ width, /** @type {number} */ height, /** @type {string} */ originator, /** @type {Array<Uint8Array>} */ map) {
		/** @type {string} */ this.name = name;
		/** @type {string} */ this.pattern = pattern;
		/** @type {string} */ this.rule = rule;
		/** @type {number} */ this.width = width;
		/** @type {number} */ this.height = height;
		/** @type {string} */ this.originator = originator;
		/** @type {Array<Uint8Array>} */ this.map = map;
	}

	// View object
	/**
	 * @constructor
	 */
	function View(element) {
		var	/** @type {number} */ i = 0;

		// whether overview initialized
		/** @type {boolean} */ this.overviewInitialized = false;

		// overview image
		/** @type {HTMLCanvasElement} */ this.overviewCanvas = null;
		/** @type {CanvasRenderingContext2D} */ this.overviewContext = null;

		// overview menu
		/** @type {MenuList} */ this.overviewMenu = null;

		// last rule name in change rule dialog
		/** @type {string} */ this.lastRuleName = "";

		// y coordinate direction
		/** @type {boolean} */ this.yUp = false;

		// pinch touch start locations
		/** @type {number} */ this.pinchStartX1 = 0;
		/** @type {number} */ this.pinchStartY1 = 0;
		/** @type {number} */ this.pinchStartX2 = 0;
		/** @type {number} */ this.pinchStartY2 = 0;

		// pinch touch current locations
		/** @type {number} */ this.pinchCurrentX1 = 0;
		/** @type {number} */ this.pinchCurrentY1 = 0;
		/** @type {number} */ this.pinchCurrentX2 = 0;
		/** @type {number} */ this.pinchCurrentY2 = 0;

		// control/command key text
		/** @const {string} */ this.controlKeyText = Supports.cmdKey ? ViewConstants.cmdText : ViewConstants.ctrlText;

		// alt/option key text
		/** @const {string} */ this.altKeyText = Supports.cmdKey ? ViewConstants.optionText : ViewConstants.altText;

		// whether state number is displayed in cell info
		/** @type {boolean} */ this.stateNumberDisplayed = false;

		// whether LifeViewer is standard or pro edition
		/** @type {boolean} */ this.proEdition = false;

		// whether Chrome bug is in effect
		/** @type {boolean} */ this.chromeBug = false;

		// whether Life just died
		/** @type {boolean} */ this.justDied = false;

		// whether secret snow is disabled
		/** @type {boolean} */ this.snowDisabled = false;

		// whether playback duration displayed
		/** @type {boolean} */ this.showPlayDuration = false;

		// whether stats are waiting to switch on (during pattern load after frame time measurement)
		/** @type {boolean} */ this.pendingStatsOn = false;

		// population graph elements to plot
		/** @type {boolean} */ this.graphShowPopulation = true;
		/** @type {boolean} */ this.graphShowBirths = true;
		/** @type {boolean} */ this.graphShowDeaths = true;

		// amount of ms of last playback
		/** @type {number} */ this.lastPlaybackMS = 0;

		// whether standard gps used
		/** @type {boolean} */ this.standardGPS = true;

		// whether standard gens per step used
		/** @type {boolean} */ this.standardStep = true;

		// refresh rate
		/** @type {number} */ this.refreshRate = Controller.refreshRate;

		// identify cell period map displayed
		/** @type {number} */ this.periodMapDisplayed = 0;

		// last failure reason from PatternManager
		/** @type {string} */ this.lastFailReason = "";

		// target generation for go to
		/** @type {number} */ this.startFrom = -1;

		// whether to time going to generation
		/** @type {number} */ this.startFromTiming = -1;

		// last benchmark time
		/** @type {number} */ this.lastBenchmarkTime = -1;

		// last benchmark generations
		/** @type {number} */ this.lastBenchmarkGens = -1;

		// how many generations to move
		/** @type {number} */ this.startFromGens = -1;

		// pattern state names
		/** @type {Array<string>} */ this.stateNames = [];

		// whether starting playback pauses others
		/** @type {boolean} */ this.exclusivePlayback = false;

		// whether to ignore pause requests from others
		/** @type {boolean} */ this.ignorePauseRequests = false;

		// whether to start playback when thumbnail expands
		/** @type {boolean} */ this.thumbStart = false;

		// whether to start playback in reverse for reversible rules
		/** @type {boolean} */ this.reverseStart = false;

		// whether drawing snow
		/** @type {boolean} */ this.drawingSnow = false;

		// whether update function needs to call post function to complete after async load
		/** @type {boolean} */ this.needsComplete = false;

		// pattern manager
		/** @type {PatternManager} */ this.manager = new PatternManager();

		// whether identify results displayed
		/** @type {boolean} */ this.resultsDisplayed = false;

		// last oscillator message
		/** @type {string} */ this.lastOscillator = "";

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

		// last oscillator strict volatility
		/** @type {string} */ this.lastIdentifyStrict = "";

		// last oscillator mod
		/** @type {string} */ this.lastIdentifyMod = "";

		// last oscillator active cells
		/** @type {string} */ this.lastIdentifyActive = "";

		// last oscillator temperature
		/** @type {string} */ this.lastIdentifyTemperature = "";

		// last still life density
		/** @type {string} */ this.lastIdentifyDensity = "";

		// whether computing oscillators
		/** @type {boolean} */ this.identify = false;

		// labels for identify results
		/** @type {MenuItem} */ this.identifyBannerLabel = null;
		/** @type {MenuItem} */ this.identifyCellsLabel = null;
		/** @type {MenuItem} */ this.identifyBoxLabel = null;
		/** @type {MenuItem} */ this.identifyDirectionLabel = null;
		/** @type {MenuItem} */ this.identifyPeriodLabel = null;
		/** @type {MenuItem} */ this.identifySlopeLabel = null;
		/** @type {MenuItem} */ this.identifySpeedLabel = null;
		/** @type {MenuItem} */ this.identifyHeatLabel = null;
		/** @type {MenuItem} */ this.identifyVolatilityLabel = null;
		/** @type {MenuItem} */ this.identifyModLabel = null;
		/** @type {MenuItem} */ this.identifyActiveLabel = null;
		/** @type {MenuItem} */ this.identifyTemperatureLabel = null;

		// labels for identify result values
		/** @type {MenuItem} */ this.identifyCellsValueLabel = null;
		/** @type {MenuItem} */ this.identifyBoxValueLabel = null;
		/** @type {MenuItem} */ this.identifyDirectionValueLabel = null;
		/** @type {MenuItem} */ this.identifyPeriodValueLabel = null;
		/** @type {MenuItem} */ this.identifySlopeValueLabel = null;
		/** @type {MenuItem} */ this.identifySpeedValueLabel = null;
		/** @type {MenuItem} */ this.identifyHeatValueLabel = null;
		/** @type {MenuItem} */ this.identifyModValueLabel = null;
		/** @type {MenuItem} */ this.identifyActiveValueLabel = null;
		/** @type {MenuItem} */ this.identifyTemperatureValueLabel = null;

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

		// whether displaying action settings
		/** @type {boolean} */ this.showActionsSettings = false;

		// whether displaying pattern settings
		/** @type {boolean} */ this.showPatternSettings = false;

		// whether displaying clipboard settings
		/** @type {boolean} */ this.showClipboardSettings = false;

		// whether to display icons
		/** @type {boolean} */ this.useIcons = false;

		// whether to sync copy with external clipboard
		/** @type {boolean} */ this.copySyncExternal = false;

		// whether notified about sync
		/** @type {boolean} */ this.syncNotified = false;

		// paste buffers
		/** @type {Array} */ this.pasteBuffers = [];

		// the final paste buffer is used for Advance Outside
		for (i = 0; i <= ViewConstants.numPasteBuffers; i += 1) {
			this.pasteBuffers[i] = null;
		}

		// current paste buffer
		/** @type {number} */ this.currentPasteBuffer = 0;

		// current paste width and height
		/** @type {number} */ this.pasteWidth = 0;
		/** @type {number} */ this.pasteHeight = 0;

		// paste position
		/** @type {number} */ this.pastePosition = ViewConstants.pastePositionNW;

		// whether there is something in the buffer to paste
		/** @type {boolean} */ this.canPaste = false;

		// whether there has been an action since selection made
		/** @type {boolean} */ this.afterSelectAction = false;

		// current paste buffer cells
		/** @type {Uint8Array} */ this.pasteBuffer = null;

		// whether paste is happening
		/** @type {boolean} */ this.isPasting = false;

		// selection box
		/** @type {BoundingBox} */ this.selectionBox = new BoundingBox(0, 0, 0, 0);

		// middle coordinate selection box
		/** @type {BoundingBox} */ this.middleBox = new BoundingBox(0, 0, 0, 0);

		// random number generator
		/** @type {Random} */ this.randGen = new Random();

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
		/** @type {Array} */ this.editList = [];

		// edit number for undo/redo
		/** @type {number} */ this.editNum = 0;

		// number of edits for undo/redo
		/** @type {number} */ this.numEdits = 0;

		// current edit
		/** @type {Array} */ this.currentEdit = [];

		// current edit index
		/** @type {number} */ this.currentEditIndex = 0;

		// step samples
		/** @type {Array<number>} */ this.stepSamples = [];
		/** @type {number} */ this.stepIndex = 0;

		// list of transformations
		/** @type {Array} */ this.transforms = [];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transIdentity] = [1, 0, 0, 1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transFlip] = [-1, 0, 0, -1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transFlipX] = [-1, 0, 0, 1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transFlipY] = [1, 0, 0, -1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transSwapXY] = [0, 1, 1, 0];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transSwapXYFlip] = [0, -1, -1, 0];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transRotateCW] = [0, -1, 1, 0];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transRotateCCW] = [0, 1, -1, 0];

		// list of named recipes
		/** @type {Array} */ this.recipeList = [];

		// recipe delta list
		/** @type {Array<number>} */ this.recipeDelta = [];

		// list of named rle snippets
		/** @type {Array} */ this.rleList = [];

		// list of pastes to perform
		/** @type {Array} */ this.pasteList = [];

		// rle paste mode
		/** @type {number} */ this.pasteMode = ViewConstants.pasteModeOr;

		// rle paste generation
		/** @type {number} */ this.pasteGen = 0;

		// rle paste end generation for every mode
		/** @type {number} */ this.pasteEnd = -1;

		// rle delta list
		/** @type {Array<number>} */ this.pasteDelta = [];

		// rle paste modulus
		/** @type {number} */ this.pasteEvery = 0;

		// rle PASTET EVERY position delta
		/** @type {number} */ this.pasteDeltaX = 0;
		/** @type {number} */ this.pasteDeltaY = 0;

		// whether there is a paste every snippet
		/** @type {boolean} */ this.isPasteEvery = false;

		// maximum paste generation (exlcuding paste every snippets)
		/** @type {number} */ this.maxPasteGen = -1;

		// whether there is evolution to do
		/** @type {boolean} */ this.isEvolution = false;

		// paste snippets bounding box
		/** @type {number} */ this.pasteLeftX = 0;
		/** @type {number} */ this.pasteRightX = 0;
		/** @type {number} */ this.pasteBottomY = 0;
		/** @type {number} */ this.pasteTopY = 0;

		// universe number
		/** @type {number} */ this.universe = 0;

		// icon manager
		/** @type {IconManager} */ this.iconManager = null;

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
		/** @type {boolean} */ this.initialTilt = false;
		/** @type {boolean} */ this.initialDepth = false;
		/** @type {boolean} */ this.initialLayers = false;
		/** @type {boolean} */ this.initialTheme = false;
		/** @type {boolean} */ this.initialStep = false;
		/** @type {boolean} */ this.initialGps = false;
		/** @type {boolean} */ this.initialStop = false;
		/** @type {boolean} */ this.initialLoop = false;

		// fixed point counter for generation
		/** @type {number} */ this.fixedPointCounter = 0;

		// elapsed time at each generation
		/** @type {Float32Array} */ this.elapsedTimes = null;

		// x and y offset of pattern
		/** @type {number} */ this.panX = 0;
		/** @type {number} */ this.panY = 0;

		// whether pattern was clipped to bounded grid
		/** @type {boolean} */ this.wasClipped = false;

		// specified pattern width and height from RLE header
		/** @type {number} */ this.specifiedWidth = -999999;
		/** @type {number} */ this.specifiedHeight = -999999;

		// default POI
		/** @type {number} */ this.defaultPOI = -1;

		// random seed
		/** @type {string} */ this.randomSeed = Date.now().toString();
		/** @type {boolean} */ this.randomSeedCustom = false;

		// whether to randomize pattern
		/** @type {boolean} */ this.randomizePattern = false;

		// whether to randomize with 2 states or all states
		/** @type {boolean} */ this.randomize2Only = false;

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
		/** @type {number} */ this.startTiltPOI = -1;
		/** @type {number} */ this.startDepthPOI = -1;
		/** @type {number} */ this.startLayersPOI = -1;

		// destination point for POI
		/** @type {number} */ this.endXPOI = -1;
		/** @type {number} */ this.endYPOI = -1;
		/** @type {number} */ this.endZoomPOI = -1;
		/** @type {number} */ this.endAnglePOI = -1;
		/** @type {number} */ this.endTiltPOI = -1;
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

		// window scroll position
		/** @type {number} */ this.scrollPosition = 0;

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
		/** @type {number} */ this.autoFitThreshold = 0.001;

		// weight for auto fit average (target is one part in n)
		/** @type {number} */ this.autoFitWeight = 6;

		// whether autofit is in history fit mode
		/** @type {boolean} */ this.historyFit = false;

		// whether autofit only uses state 1
		/** @type {boolean} */ this.state1Fit = false;

		// custom text message colour
		/** @type {Array<number>} */ this.customTextColour = null;

		// custom error message colour
		/** @type {Array<number>} */ this.customErrorColour = null;

		// error font colour
		/** @type {string} */ this.errorsFontColour = ViewConstants.errorsFontColour;

		// custom help message colour
		/** @type {Array<number>} */ this.customHelpColour = null;

		// help font colour
		/** @type {string} */ this.helpFontColour = ViewConstants.helpFontColour;

		// boundary colour (for help display)
		/** @type {Array<number>} */ this.customBoundaryColour = [96, 96, 96];

		// bounded colour
		/** @type {Array<number>} */ this.customBoundedColour = [128, 128, 128];

		// select colour
		/** @type {Array<number>} */ this.customSelectColour = [0, 255, 0];

		// paste colour
		/** @type {Array<number>} */ this.customPasteColour = [255, 0, 0];

		// selected cells colour
		/** @type {Array<number>} */ this.customSelectedCellsColour = [255, 128, 0];

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
		/** @type {Stars} */ this.starField = null;

		// whether viewer is in popup window
		/** @type {boolean} */ this.isInPopup = false;

		// line number for error and script drawing
		/** @type {number} */ this.lineNo = 1;

		// performance colour step
		/** @type {number} */ this.perfStep = 0;

		// whether just started
		/** @type {boolean} */ this.justStarted = false;

		// whether controls are locked (during waypoint playback)
		/** @type {boolean} */ this.controlsLocked = false;

		// waypoint manager
		/** @type {WaypointManager} */ this.waypointManager = new WaypointManager();

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
		/** @type {Uint32Array} */ this.patternStateCount = null;

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
		/** @type {Array<number>} */ this.customThemeValue = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

		// custom grid colour
		/** @type {number} */ this.customGridColour = -1;

		// custom grid major colour
		/** @type {number} */ this.customGridMajorColour = -1;

		// custom label colour
		/** @type {string} */ this.customLabelColour = ViewConstants.labelFontColour;

		// custom arrow colour
		/** @type {string} */ this.customArrowColour = ViewConstants.arrowColour;

		// custom polygon colour
		/** @type {string} */ this.customPolygonColour = ViewConstants.polyColour;

		// colour set used
		/** @type {string} */ this.colourSetName = "";
		/** @type {number} */ this.colourSetSize = 0;
		/** @type {Array<number>} */ this.colourList = [];

		// whether all colours are custom
		/** @type {boolean} */ this.allCustom = false;

		// custom colour set
		/** @type {Int32Array} */ this.customColours = null;

		// whether custom colour used
		/** @type {Array<number>} */ this.customColourUsed = [];

		// script error list
		/** @type {Array} */ this.scriptErrors = [];

		// error display line
		/** @type {number} */ this.displayErrors = 0;

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
		/** @type {Array} */ this.helpSections = [];

		// help text width cache
		/** @type {Array<number>} */ this.helpFixedCache = [];
		/** @type {Array<number>} */ this.helpVariableCache = [];

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

		// whether to autoidentify
		/** @type {boolean} */ this.autoIdentify = false;

		// whether reset is always hard
		/** @type {boolean} */ this.hardReset = false;

		// life engine
		/** @type {Life} */ this.engine = null;

		// elapsed time
		/** @type {number} */ this.elapsedTime = 0;

		// default grid width
		/** @type {number} */ this.defaultGridWidth = 512;

		// default grid height
		/** @type {number} */ this.defaultGridHeight = 256;

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

		// actual step
		/** @type {MenuItem} */ this.stepLabel = null;

		// undo button
		/** @type {MenuItem} */ this.undoButton = null;

		// redo button
		/** @type {MenuItem} */ this.redoButton = null;

		// copy sync toggle
		/** @type {MenuItem} */ this.copySyncToggle = null;

		// icon toggle
		/** @type {MenuItem} */ this.iconToggle = null;

		// navigation menu toggle
		/** @type {MenuItem} */ this.navToggle = null;

		// theme button
		/** @type {MenuItem} */ this.themeButton = null;

		// throttle toggle
		/** @type {MenuItem} */ this.throttleToggle = null;

		// show lag toggle
		/** @type {MenuItem} */ this.showLagToggle = null;

		// theme selections
		/** @type {Array} */ this.themeSelections = [];

		// first control ID for theme selection buttons used as an offset to get the actual theme number
		/** @type {number} */ this.themeSelectionFirstID = 0;

		// theme labels
		/** @type {MenuItem} */ this.themeDefaultLabel = null;
		/** @type {MenuItem} */ this.themeClassicLabel = null;
		/** @type {MenuItem} */ this.themeProgramLabel = null;
		/** @type {MenuItem} */ this.themeDebugLabel = null;

		// theme section label
		/** @type {MenuItem} */ this.themeSectionLabel = null;

		// angle item
		/** @type {MenuItem} */ this.angleItem = null;

		// tilt item
		/** @type {MenuItem} */ this.tiltItem = null;

		// zoom item
		/** @type {MenuItem} */ this.zoomItem = null;

		// depth item
		/** @type {MenuItem} */ this.depthItem = null;

		// layers item
		/** @type {MenuItem} */ this.layersItem = null;

		// generation button
		/** @type {MenuItem} */ this.genToggle = null;

		// relative generation toggle
		/** @type {MenuItem} */ this.relativeToggle = null;

		// quality rendering toggle
		/** @type {MenuItem} */ this.qualityToggle = null;

		// reason label
		/** @type {MenuItem} */ this.reasonLabel = null;

		// opacity item
		/** @type {MenuItem} */ this.opacityItem = null;

		// lines toggle
		/** @type {MenuItem} */ this.linesToggle = null;

		// infobar label
		/** @type {MenuItem} */ this.infoBarLabelXLeft = null;
		/** @type {MenuItem} */ this.infoBarLabelXValue = null;
		/** @type {MenuItem} */ this.infoBarLabelYLeft = null;
		/** @type {MenuItem} */ this.infoBarLabelYValue = null;
		/** @type {MenuItem} */ this.infoBarLabelAngleLeft = null;
		/** @type {MenuItem} */ this.infoBarLabelAngleValue = null;
		/** @type {MenuItem} */ this.infoBarLabelCenter = null;
		/** @type {MenuItem} */ this.infoBarLabelERight = null;
		/** @type {MenuItem} */ this.infoBarLabelSRight = null;
		/** @type {MenuItem} */ this.infoBarLabelWRight = null;
		/** @type {MenuItem} */ this.infoBarLabelNRight = null;
		/** @type {MenuItem} */ this.infoBarLabelEValueRight = null;
		/** @type {MenuItem} */ this.infoBarLabelSValueRight = null;
		/** @type {MenuItem} */ this.infoBarLabelWValueRight = null;
		/** @type {MenuItem} */ this.infoBarLabelNValueRight = null;

		// autostart indicator
		/** @type {MenuItem} */ this.autostartIndicator = null;

		// waypoints indicator
		/** @type {MenuItem} */ this.waypointsIndicator = null;

		// loop indicator
		/** @type {MenuItem} */ this.loopIndicator = null;

		// stop indicator
		/** @type {MenuItem} */ this.stopIndicator = null;

		// done button for bug confirmation
		/** @type {MenuItem} */ this.doneButton = null;

		// help button
		/** @type {MenuItem} */ this.helpToggle = null;

		// topics button
		/** @type {MenuItem} */ this.topicsButton = null;

		// spacer to left of states slider
		/** @type {MenuItem} */ this.statesSpacer = null;

		// states slider
		/** @type {MenuItem} */ this.statesSlider = null;

		// sections button
		/** @type {MenuItem} */ this.sectionsButton = null;

		// help topic buttons
		/** @type {MenuItem} */ this.helpKeysButton = null;
		/** @type {MenuItem} */ this.helpScriptsButton = null;
		/** @type {MenuItem} */ this.helpInfoButton = null;
		/** @type {MenuItem} */ this.helpThemesButton = null;
		/** @type {MenuItem} */ this.helpColoursButton = null;
		/** @type {MenuItem} */ this.helpAliasesButton = null;
		/** @type {MenuItem} */ this.helpMemoryButton = null;
		/** @type {MenuItem} */ this.helpAnnotationsButton = null;

		// help section list
		/** @type {MenuItem} */ this.helpSectionList = null;

		// autofit button
		/** @type {MenuItem} */ this.autoFitToggle = null;

		// grid toggle
		/** @type {MenuItem} */ this.gridToggle = null;

		// library toggle
		/** @type {MenuItem} */ this.libraryToggle = null;

		// clipboard list
		/** @type {MenuItem} */ this.clipboardList = null;

		// select all button
		/** @type {MenuItem} */ this.selectAllButton = null;

		// clear selection button
		/** @type {MenuItem} */ this.clearSelectionButton = null;

		// clear outside button
		/** @type {MenuItem} */ this.clearOutsideButton = null;

		// clear [R]History or [R]Super button
		/** @type {MenuItem} */ this.clearRHistoryButton = null;

		// change cell state button
		/** @type {MenuItem} */ this.changeCellStateButton = null;

		// auto-shrink toggle
		/** @type {MenuItem} */ this.autoShrinkToggle = null;

		// auto-shrink button
		/** @type {MenuItem} */ this.autoShrinkButton = null;

		// reverse direction button
		/** @type {MenuItem} */ this.directionButton = null;

		// speed 1x button
		/** @type {MenuItem} */ this.speed1Button = null;

		// fit button
		/** @type {MenuItem} */ this.fitButton = null;

		// shrink button
		/** @type {MenuItem} */ this.shrinkButton = null;

		// esc button
		/** @type {MenuItem} */ this.escButton = null;

		// close errors button
		/** @type {MenuItem} */ this.closeErrorsButton = null;

		// label toggle button
		/** @type {MenuItem} */ this.labelButton = null;

		// kill gliders toggle button
		/** @type {MenuItem} */ this.killButton = null;

		// previous POI button
		/** @type {MenuItem} */ this.prevPOIButton = null;

		// next POI button
		/** @type {MenuItem} */ this.nextPOIButton = null;

		// autohide toggle button
		/** @type {MenuItem} */ this.autoHideButton = null;

		// autogrid toggle button
		/** @type {MenuItem} */ this.autoGridButton = null;

		// alternating gridlines toggle button
		/** @type {MenuItem} */ this.altGridButton = null;

		// rainbow mode toggle button
		/** @type {MenuItem} */ this.rainbowButton = null;

		// hex cell toggle button
		/** @type {MenuItem} */ this.hexCellButton = null;

		// integer zoom button
		/** @type {MenuItem} */ this.integerZoomButton = null;

		// center pattern button
		/** @type {MenuItem} */ this.centerPatternButton = null;

		// cell borders toggle button
		/** @type {MenuItem} */ this.bordersButton = null;

		// graph toggle button
		/** @type {MenuItem} */ this.graphButton = null;

		// close button for graph
		/** @type {MenuItem} */ this.graphCloseButton = null;

		/** data selection graph */
		/** @type {MenuItem} */ this.graphDataToggle = null;

		// close button for identify
		/** @type {MenuItem} */ this.identifyCloseButton = null;

		// strict volatility toggle
		/** @type {MenuItem} */ this.identifyStrictToggle = null;

		// save button for identify cell map
		/** @type {MenuItem} */ this.identifySaveCellMapButton = null;

		// page up button for identify
		/** @type {MenuItem} */ this.identifyPageUpButton = null;

		// page down button for identify
		/** @type {MenuItem} */ this.identifyPageDownButton = null;

		// infobar button
		/** @type {MenuItem} */ this.infoBarButton = null;

		// fast lookup button
		/** @type {MenuItem} */ this.fastLookupButton = null;

		// state number button
		/** @type {MenuItem} */ this.stateNumberButton = null;

		// y coordinate direction button
		/** @type {MenuItem} */ this.yDirectionButton = null;

		// info button
		/** @type {MenuItem} */ this.infoButton = null;

		// rule button
		/** @type {MenuItem} */ this.ruleButton = null;

		// new button
		/** @type {MenuItem} */ this.newButton = null;

		// save button
		/** @type {MenuItem} */ this.saveButton = null;

		// load button
		/** @type {MenuItem} */ this.loadButton = null;

		// randomize pattern and rule button
		/** @type {MenuItem} */ this.randomizeButton = null;

		// ranomize pattern and keep rule button
		/** @type {MenuItem} */ this.randomizePatternButton = null;

		// identify button
		/** @type {MenuItem} */ this.identifyButton = null;

		// save image button
		/** @type {MenuItem} */ this.saveImageButton = null;

		// save graph image button
		/** @type {MenuItem} */ this.saveGraphButton = null;

		// go to generation button
		/** @type {MenuItem} */ this.goToGenButton = null;

		// open clipboard button
		/** @type {MenuItem} */ this.openClipboardButton = null;

		// copy with comments button
		/** @type {MenuItem} */ this.copyWithCommentsButton = null;

		// paste to selection button
		/** @type {MenuItem} */ this.pasteToSelectionButton = null;

		// copy position button
		/** @type {MenuItem} */ this.copyPositionButton = null;

		// copy view button
		/** @type {MenuItem} */ this.copyViewButton = null;

		// copy original pattern button
		/** @type {MenuItem} */ this.copyOriginalButton = null;

		// copy rule button
		/** @type {MenuItem} */ this.copyRuleButton = null;

		// copy as MAP button
		/** @type {MenuItem} */ this.copyAsMAPButton = null;

		// copy neighbourhood button
		/** @type {MenuItem} */ this.copyNeighbourhoodButton = null;

		// back button
		/** @type {MenuItem} */ this.backButton = null;

		// cancel button
		/** @type {MenuItem} */ this.cancelButton = null;

		// pattern button
		/** @type {MenuItem} */ this.patternButton = null;

		// clipboard button
		/** @type {MenuItem} */ this.clipboardButton = null;

		// display button
		/** @type {MenuItem} */ this.displayButton = null;

		// playback button
		/** @type {MenuItem} */ this.playBackButton = null;

		// major button
		/** @type {MenuItem} */ this.majorButton = null;

		// history fit button
		/** @type {MenuItem} */ this.historyFitButton = null;

		// stars button
		/** @type {MenuItem} */ this.starsButton = null;

		// previous universe button
		/** @type {MenuItem} */ this.prevUniverseButton = null;

		// next universe button
		/** @type {MenuItem} */ this.nextUniverseButton = null;

		// stop all viewers button
		/** @type {MenuItem} */ this.stopAllButton = null;

		// stop other viewers button
		/** @type {MenuItem} */ this.stopOthersButton = null;

		// reset all viewers button
		/** @type {MenuItem} */ this.resetAllButton = null;

		// fit to selection button
		/** @type {MenuItem} */ this.fitSelectionButton = null;

		// snap to nearest 45 angle button
		/** @type {MenuItem} */ this.snapToNearest45Button = null;

		// timing button
		/** @type {MenuItem} */ this.fpsButton = null;

		// timing details button
		/** @type {MenuItem} */ this.timingDetailButton = null;

		// save view button
		/** @type {MenuItem} */ this.saveViewButton = null;

		// restore view button
		/** @type {MenuItem} */ this.restoreViewButton = null;

		// show last identify results button
		/** @type {MenuItem} */ this.lastIdentifyResultsButton = null;

		// clear drawing state button
		/** @type {MenuItem} */ this.clearDrawingStateButton = null;

		// generation label
		/** @type {MenuItem} */ this.genLabel = null;

		// generation value label
		/** @type {MenuItem} */ this.genValueLabel = null;

		// time label
		/** @type {MenuItem} */ this.timeLabel = null;

		// elapsed time label
		/** @type {MenuItem} */ this.elapsedTimeLabel = null;

		// xy label
		/** @type {MenuItem} */ this.xyLabel = null;

		// selection size label
		/** @type {MenuItem} */ this.selSizeLabel = null;

		// population label and value
		/** @type {MenuItem} */ this.popLabel = null;
		/** @type {MenuItem} */ this.popValue = null;

		// births label and value
		/** @type {MenuItem} */ this.birthsLabel = null;
		/** @type {MenuItem} */ this.birthsValue = null;

		// deaths label and value
		/** @type {MenuItem} */ this.deathsLabel = null;
		/** @type {MenuItem} */ this.deathsValue = null;

		// progress bar
		/** @type {MenuItem} */ this.progressBar = null;

		// play list (play/pause/reset/step back buttons)
		/** @type {MenuItem} */ this.playList = null;

		// mode list (draw/select/pan buttons)
		/** @type {MenuItem} */ this.modeList = null;

		// paste mode list (or/copy/xor/and)
		/** @type {MenuItem} */ this.pasteModeList = null;

		// random button
		/** @type {MenuItem} */ this.randomButton = null;

		// random 2-state button
		/** @type {MenuItem} */ this.random2Button = null;

		// random density slider
		/** @type {MenuItem} */ this.randomItem = null;

		// paste position slider
		/** @type {MenuItem} */ this.pastePositionItem = null;

		// cut button
		/** @type {MenuItem} */ this.cutButton = null;

		// copy button
		/** @type {MenuItem} */ this.copyButton = null;

		// paste button
		/** @type {MenuItem} */ this.pasteButton = null;

		// flip X button
		/** @type {MenuItem} */ this.flipXButton = null;

		// flip Y button
		/** @type {MenuItem} */ this.flipYButton = null;

		// rotate CW button
		/** @type {MenuItem} */ this.rotateCWButton = null;

		// rotate CCW button
		/** @type {MenuItem} */ this.rotateCCWButton = null;

		// advance outside button
		/** @type {MenuItem} */ this.advanceOutsideButton = null;

		// advance selection button
		/** @type {MenuItem} */ this.advanceSelectionButton = null;

		// nudge left button
		/** @type {MenuItem} */ this.nudgeLeftButton = null;

		// nudge right button
		/** @type {MenuItem} */ this.nudgeRightButton = null;

		// nudge up button
		/** @type {MenuItem} */ this.nudgeUpButton = null;

		// nudge down button
		/** @type {MenuItem} */ this.nudgeDownButton = null;

		// cancel selection button
		/** @type {MenuItem} */ this.cancelSelectionButton = null;

		// invert selection button
		/** @type {MenuItem} */ this.invertSelectionButton = null;

		// pick button
		/** @type {MenuItem} */ this.pickToggle = null;

		// pause while drawing button
		/** @type {MenuItem} */ this.pausePlaybackToggle = null;

		// smart drawing button
		/** @type {MenuItem} */ this.smartToggle = null;

		// states button
		/** @type {MenuItem} */ this.statesToggle = null;

		// states list for drawing
		/** @type {MenuItem} */ this.stateList = null;

		// states colours list for drawing
		/** @type {MenuItem} */ this.stateColsList = null;

		// current steps before next view theme change
		/** @type {number} */ this.viewSteps = 30;

		// last drag position
		/** @type {number} */ this.lastDragX = -1;
		/** @type {number} */ this.lastDragY = -1;

		// mouse wheel delta
		/** @type {number} */ this.wheelDelta = 0;

		// rule label
		/** @type {MenuItem} */ this.ruleLabel = null;

		// main canvas
		/** @type {HTMLCanvasElement} */ this.mainCanvas = null;

		// main context
		/** @type {CanvasRenderingContext2D} */ this.mainContext = null;

		// generation speed
		/** @type {number} */ this.genSpeed = 60;

		// menu manager
		/** @type {MenuManager} */ this.menuManager = null;

		// view menu
		/** @type {MenuList} */ this.viewMenu = null;

		// target position
		/** @type {number} */ this.targetX = 0;
		/** @type {number} */ this.targetY = 0;

		// target zoom
		/** @type {number} */ this.targetZoom = 0;

		// default camera
		/** @type {number} */ this.defaultAngle = 0;
		/** @type {number} */ this.defaultTilt = 0;
		/** @type {number} */ this.defaultX = 0;
		/** @type {number} */ this.defaultY = 0;
		/** @type {number} */ this.defaultZoom = 1;
		/** @type {number} */ this.defaultTheme = 1;
		/** @type {number} */ this.defaultGPS = 60;
		/** @type {number} */ this.defaultStep = 1;
		/** @type {number} */ this.defaultLayers = 1;
		/** @type {number} */ this.defaultDepth = 0.1;
		/** @type {boolean} */ this.defaultRainbow = false;

		// whether a theme was requested
		/** @type {number} */ this.themeRequested = -1;

		// saved camera
		/** @type {number} */ this.savedAngle = 0;
		/** @type {number} */ this.savedTilt = 0;
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

	// save boolean setting
	View.prototype.saveBooleanSetting = function(/** @type {string} */ name, /** @type {boolean} */ value) {
		var	/** @type {string} */ strValue = value ? "1" : "0";

		localStorage.setItem(ViewConstants.settingsPrefix + name, strValue);
	};

	// load boolean setting
	/** @returns {boolean} */
	View.prototype.loadBooleanSetting = function(/** @type {string} */ name) {
		var	/** @type {boolean} */ result = false,
			/** @type {string} */ setting = localStorage.getItem(ViewConstants.settingsPrefix + name);

		if (setting !== null) {
			if (setting === "1") {
				result = true;
			}
		}

		return result;
	}

	// check if a string is a Theme state name
	/** @returns {boolean} */
	View.prototype.isThemeStateName = function(/** @type {string} */ name) {
		var	/** @type {boolean} */ result = false;

		switch(name) {
			case Keywords.themeDeadWord:
			case Keywords.themeDeadRampWord:
			case Keywords.themeAliveWord:
			case Keywords.themeAliveRampWord:
			case Keywords.themeDyingWord:
			case Keywords.themeDyingRampWord:
			case Keywords.themeBackgroundWord:
				result = true;
				break;
		}

		return result;
	};

	// check if a string is an [R]History state name
	/** @returns {boolean} */
	View.prototype.isLifeHistoryStateName = function(/** @type {string} */ name) {
		var	/** @type {boolean} */ result = false,
			/** @type {number} */ i = 0;

		while (i < ViewConstants.stateNames.length && !result) {
			if (name === ViewConstants.stateNames[i]) {
				result = true;
			} else {
				i += 1;
			}
		}

		return result;
	};

	// check if a string is an [R]Super state name
	/** @returns {boolean} */
	View.prototype.isSuperStateName = function(/** @type {string} */ name) {
		var	/** @type {boolean} */ result = false,
			/** @type {number} */ i = 0;

		while (i < LifeConstants.namesSuper.length && !result) {
			if (name === LifeConstants.namesSuper[i]) {
				result = true;
			} else {
				i += 1;
			}
		}

		return result;
	};

	// check if a string is an [R]Extended state name
	/** @returns {boolean} */
	View.prototype.isExtendedStateName = function(/** @type {string} */ name) {
		var	/** @type {boolean} */ result = false,
			/** @type {number} */ i = 0;

		while (i < LifeConstants.namesExtended.length && !result) {
			if (name === LifeConstants.namesExtended[i]) {
				result = true;
			} else {
				i += 1;
			}
		}

		return result;
	};

	// create clipboard tooltips
	View.prototype.createClipboardTooltips = function() {
		var	/** @type {number} */ i = 0,
			/** @type {Array} */ buffer = this.pasteBuffers,
			/** @type {number} */ current = this.currentPasteBuffer,
			/** @type {string} */ tip = "",
			/** @type {Array<string>} */ tips = [];

		for (i = 0; i < ViewConstants.numPasteBuffers; i += 1) {
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
			tips[i] = tip + " [" + this.altKeyText + " " + i + "]";
		}
		this.clipboardList.toolTip = tips;
	};

	// open last saved or original pattern
	View.prototype.loadPattern = function(/** @type {View} */ me) {
		var	/** @type {boolean} */ result = window.confirm("Open last saved pattern?");

		if (result) {
			if (me.isInPopup) {
				updateViewer(me.element);
			} else {
				updateMe(me.element);
			}
		}
	};

	// allocate new chunk for undo/redo buffer
	/** @returns {Int32Array} */
	View.prototype.allocateChunk = function() {
		var	/** @type {number} */ chunkSize = 1 << ViewConstants.editChunkPower,
			/** @type {number} */ chunk = this.currentEditIndex >> ViewConstants.editChunkPower;

		// check if a new buffer is needed
		if (chunk === this.currentEdit.length) {
			this.currentEdit[chunk] = /** @type {!Int32Array} */ (this.engine.allocator.allocate(Type.Int32, chunkSize, "View.currentEdit" + chunk));
		}

		// return the chunk
		return this.currentEdit[chunk];
	};

	// check if a cell is on the grid (and grow grid if needed)
	/** @returns {Array} */
	View.prototype.cellOnGrid = function(/** @type {number} */x, /** @type {number} */ y) {
		var	/** @type {Array} */ result = [true, x, y],
			/** @type {number} */ wm = this.engine.widthMask,
			/** @type {number} */ hm = this.engine.heightMask,
			/** @type {number} */ maxGridSize = this.engine.maxGridSize,
			/** @type {boolean} */ growX = false,
			/** @type {boolean} */ growY = false,
			/** @type {number} */ borderSize = 0;

		// check if the cell is on the grid
		if (!((x === (x & wm)) && (y === (y & hm)))) {
			result[0] = false;

			// check if grid can grow in the required direction
			growX = (this.engine.width < this.engine.maxGridSize) && (x !== (x & wm));
			growY = (this.engine.height < this.engine.maxGridSize) && (y !== (y & hm));

			// attempt to grow the grid
			while (growX || growY) {
				if (growX || growY) {
					this.engine.growGrid(growX, growY, true);
				}
				if (growX) {
					x += this.engine.width >> 2;
				}
				if (growY) {
					y += this.engine.height >> 2;
				}

				growX = (this.engine.width < maxGridSize) && (x !== (x & wm));
				growY = (this.engine.height < maxGridSize) && (y !== (y & hm));
			}

			// check if the cell is on the expanded grid
			if ((x === (x & wm)) && (y === (y & hm))) {
				// cell on expanded grid
				result[0] = true;
				result[1] = x;
				result[2] = y;
			}
		}

		// check for HROT border width needed
		if (this.engine.isHROT) {
			borderSize = this.getSafeBorderSize();

			// divide by two since it contains needed space both sides of the pattern
			borderSize = (borderSize + 1) >> 1;

			if (x - borderSize < 0 || x + borderSize >= this.engine.width || y - borderSize < 0 || y + borderSize >= this.engine.height) {
				result[0] = false;

				// check if grid can grow in the required direction
				growX = (this.engine.width < maxGridSize) && ((x - borderSize < 0 || x + borderSize >= this.engine.width));
				growY = (this.engine.height < maxGridSize) && ((y - borderSize < 0 || y + borderSize >= this.engine.height));

				// attempt to grow the grid
				while (growX || growY) {
					if (growX || growY) {
						this.engine.growGrid(growX, growY, true);
					}
					if (growX) {
						x += this.engine.width >> 2;
					}
					if (growY) {
						y += this.engine.height >> 2;
					}

					growX = (this.engine.width < maxGridSize) && ((x - borderSize < 0 || x + borderSize >= this.engine.width));
					growY = (this.engine.height < maxGridSize) && ((y - borderSize < 0 || y + borderSize >= this.engine.height));
				}

				// check if the cell is on the expanded grid
				if (!(x - borderSize < 0 || x + borderSize >= this.engine.width || y - borderSize < 0 || y + borderSize >= this.engine.height)) {
					// cell on expanded grid
					result[0] = true;
					result[1] = x;
					result[2] = y;
				}
			}
		}

		return result;
	};

	// draw cell and create undo/redo
	/** @returns {number} */
	View.prototype.setStateWithUndo = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ colour, /** @type {boolean} */ deadZero, /** @type {boolean} */ clipToBounded) {
		// get current state
		var	/** @type {number} */ state = 0,
			/** @type {number} */ rawState = 0,
			/** @type {number} */ i = this.currentEditIndex,
			/** @type {number} */ j = 0,
			/** @type {number} */ chunkPower = ViewConstants.editChunkPower,
			/** @type {number} */ chunk = i >> chunkPower,
			/** @type {number} */ chunkSize = 1 << chunkPower,
			/** @type {number} */ chunkMask = chunkSize - 1,
			/** @type {Array} */ currentEdit = this.currentEdit,
			/** @type {Int32Array} */ currentChunk = null,
			/** @type {number} */ xOff = (this.engine.width >> 1) - (this.patternWidth >> 1),
			/** @type {number} */ yOff = (this.engine.height >> 1) - (this.patternHeight >> 1),
			/** @type {number} */ states = this.engine.multiNumStates,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ newRecord = 0,
			/** @type {boolean} */ addedToRun = false,
			/** @type {number} */ runCount = 0,
			/** @type {number} */ runIndicator = 1 << 22,
			/** @type {number} */ result = 0,
			/** @type {Array} */ checkGridResult = [],
			/** @type {number} */ boxOffset = (this.engine.isMargolus ? -1 : 0),
			/** @type {number} */ leftX = Math.round((this.engine.width - this.engine.boundedGridWidth) / 2) + boxOffset,
			/** @type {number} */ bottomY = Math.round((this.engine.height - this.engine.boundedGridHeight) / 2) + boxOffset,
			/** @type {number} */ rightX = leftX + this.engine.boundedGridWidth - 1,
			/** @type {number} */ topY = bottomY + this.engine.boundedGridHeight - 1,
			/** @type {number} */ pop = this.engine.population,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// check if the cell is on the grid
		checkGridResult = this.cellOnGrid(x, y);
		if (checkGridResult[0]) {
			// cell is on grid so update x and y in case grid grew
			x = checkGridResult[1];
			y = checkGridResult[2];
			xOff = (this.engine.width >> 1) - (this.patternWidth >> 1);
			yOff = (this.engine.height >> 1) - (this.patternHeight >> 1);
			leftX = Math.round((this.engine.width - this.engine.boundedGridWidth) / 2) + boxOffset;
			bottomY = Math.round((this.engine.height - this.engine.boundedGridHeight) / 2) + boxOffset;
			rightX = leftX + this.engine.boundedGridWidth - 1;
			topY = bottomY + this.engine.boundedGridHeight - 1;
		} else {
			// cell is not on grid so exit
			return 0;
		}

		// check for bounded grid cylinders
		if (this.engine.boundedGridType !== -1) {
			if (this.engine.boundedGridWidth === 0) {
				leftX = 0;
				rightX = this.engine.width - 1;
			}
			if (this.engine.boundedGridHeight === 0) {
				bottomY = 0;
				topY = this.engine.height - 1;
			}

			// check the coordinates are within the bounded grid
			if (!(x >= leftX && x <= rightX && y >= bottomY && y <= topY)) {
				// check if clip to bounded grid enabled
				if (clipToBounded) {
					// if so the clip
					if (x < leftX) {
						x = leftX;
					}
					if (x > rightX) {
						x = rightX;
					}
					if (y < bottomY) {
						y = bottomY;
					}
					if (y > topY) {
						y = topY;
					}
				} else {
					// otherwise don't draw the cell
					return 0;
				}
			}
		}

		// check for PCA, RuleTree or Super rules
		if (this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper|| this.engine.isExtended) {
			// swap grids every generation
			if ((this.engine.counter & 1) !== 0) {
				colourGrid = this.engine.nextColourGrid;
			}
		}

		// get the raw state
		rawState = colourGrid[y][x];

		// get the state
		state = this.engine.getState(x, y, false);

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

				// write both the new state, original state and raw original state into one integer
				newRecord = (colour << 16) | (state << 8) | rawState;

				// check if the new cell is adjacent to the previous one and the same states
				if (i > 0) {
					// check if previous record is part of a run
					if (i >= 4) {
						runCount = currentChunk[i - 1];
						if (runCount >= runIndicator) {
							runCount -= runIndicator;
							// check if this is just to the right of previous
							if ((currentChunk[i - 3] === newRecord) && (currentChunk[i - 2] === y - yOff) && (currentChunk[i - 4] === (x - xOff) - runCount - 2)) {
								// increment run count
								currentChunk[i - 1] += 1;
								addedToRun = true;
							}
						} else {
							if ((currentChunk[i - 2] === newRecord) && (currentChunk[i - 1] === y - yOff) && (currentChunk[i - 3] === (x - xOff) - 1)) {
								// start a new run
								currentChunk[i] = runIndicator;
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
						if (runCount >= runIndicator) {
							runCount -= runIndicator;
							// check if this is just to the right of previous
							if ((currentChunk[(j - 3) >> chunkPower][(j - 3) & chunkMask] === newRecord) && (currentChunk[(j - 2) >> chunkPower][(j - 2) & chunkMask] === y - yOff) && (currentChunk[(j - 4) >> chunkPower][(j - 4) & chunkMask] === (x - xOff) - runCount - 2)) {
								// increment run count
								currentChunk[(j - 1) >> chunkPower][(j - 1) & chunkMask] += 1;
								addedToRun = true;
							}
						} else {
							if ((currentEdit[(j - 2) >> chunkPower][(j - 2) & chunkMask] === newRecord) && (currentEdit[(j - 1) >> chunkPower][(j - 1) & chunkMask] === y - yOff) && (currentEdit[(j - 3) >> chunkPower][(j - 3) & chunkMask] === (x - xOff) - 1)) {
								// start a new run
								currentChunk[i] = runIndicator;
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
					currentChunk[i] = (colour << 16) | (state << 8) | rawState;
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
			result = this.engine.setState(x, y, colour, deadZero);
			if (this.engine.population !== pop) {
				this.diedGeneration = -1;
			}

			// update graph data if at T=0
			if (!this.graphDisabled && this.engine.counter === 0) {
				this.engine.resetPopulationData();
			}
		}

		// nothing changed
		return result;
	};

	// paste raw cells for undo/redo
	View.prototype.pasteRaw = function(/** @type {Uint8Array} */ cells, /** @type {boolean} */ reverse) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ xOff = (this.engine.width >> 1) - (this.patternWidth >> 1),
			/** @type {number} */ yOff = (this.engine.height >> 1) - (this.patternHeight >> 1),
			/** @type {number} */ runCount = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ rawState = 0,
			/** @type {number} */ wasState6 = 0,
			/** @type {number} */ runIndicator = 1 << 22,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// check for PCA, RuleTree or Super rules
		if (this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper|| this.engine.isExtended) {
			// swap grids every generation
			if ((this.engine.counter & 1) !== 0) {
				colourGrid = this.engine.nextColourGrid;
			}
		}

		// check for cells
		if (cells) {
			// determine whether undo or redo
			if (reverse) {
				i = cells.length;
				while (i > 0) {
					// check for run
					runCount = cells[i - 1];
					if (runCount >= runIndicator) {
						i -= 1;
					}
					i -= 3;
					x = cells[i] + xOff;
					state = (cells[i + 1] >> 8) & 255;
					rawState = cells[i + 1] & 255;
					y = cells[i + 2] + yOff;

					// draw the first cell
					wasState6 |= this.engine.setState(x, y, state, true);
					colourGrid[y][x] = rawState;

					if (runCount >= runIndicator) {
						runCount -= runIndicator;

						// draw the run
						while (runCount >= 0) {
							x += 1;
							wasState6 |= this.engine.setState(x, y, state, true);
							colourGrid[y][x] = rawState;
							runCount -= 1;
						}
					}
				}
			} else {
				while (i < cells.length) {
					// draw first cell
					x = cells[i] + xOff;

					// get the top byte as unsigned
					state = (cells[i + 1]  & 0xff0000) >> 16;

					y = cells[i + 2] + yOff;
					wasState6 |= this.engine.setState(x, y, state, true);
					i += 3;

					// check for run
					runCount = cells[i];
					if (runCount >= runIndicator) {
						i += 1;
						runCount -= runIndicator;

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
		if ((this.engine.isLifeHistory || this.engine.isSuper) && wasState6) {
			this.engine.populateState6MaskFromColGrid();
		}

		// update period graph population if at T=0
		if (!this.graphDisabled && this.engine.counter === 0) {
			this.engine.resetPopulationData();
		}
	};

	// set undo stack pointer to given generation (used with step back)
	View.prototype.setUndoGen = function(/** @type {number} */ gen) {
		var	/** @type {number} */ i = this.editNum - 1,
			record = null,
			/** @type {BoundingBox} */ selBox = this.selectionBox,
			/** @type {boolean} */ found = false;

		// search for undo records at or before specified generation
		while (i >= 0 && !found) {
			if (this.editList[i].gen <= gen) {
				// check for multi-step
				if (this.editList[i].action === "advance outside" || this.editList[i].action === "advance selection") {
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
		var	/** @type {number} */ edit = this.editNum,
			/** @type {number} */ num = this.numEdits,
			/** @type {Array} */ list = this.editList,
			/** @type {number} */ gen = 0,
			record = null,
			/** @type {string} */ tooltip = "";

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
			this.undoButton.toolTip = tooltip + " [" + this.controlKeyText + " Z]";
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
			this.redoButton.toolTip = tooltip + " [" + this.controlKeyText + " Y]";
		}
	};

	// compare two selections and return true if they are the same
	/** @returns {boolean} */
	View.prototype.compareSelections = function(/** @type {BoundingBox} */ first) {
		var	/** @type {boolean} */ result = false,
			/** @type {BoundingBox} */ second = this.isSelection ? this.selectionBox : null;

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
	View.prototype.addEdit = function(/** @type {number} */ counter, /** @type {Int32Array} */ editCells, /** @type {string} */ comment, /** @type {BoundingBox} */ box) {
		var	/** @type {boolean} */ isDuplicate = false,
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
	View.prototype.afterEdit = function(/** @type {string} */ comment) {
		var	/** @type {number} */ counter = this.engine.counter,
			/** @type {Int32Array} */ editCells = null,
			/** @type {BoundingBox} */ box = null,
			/** @type {BoundingBox} */ selBox = this.selectionBox,
			record = null,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ chunkPower = ViewConstants.editChunkPower,
			/** @type {number} */ chunkSize = 1 << chunkPower,
			/** @type {number} */ chunkMask = chunkSize - 1,
			/** @type {number} */ finalChunk = this.currentEditIndex >> chunkPower;

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
				editCells = /** @type {!Int32Array} */ (this.engine.allocator.allocate(Type.Int32, this.currentEditIndex, "View.editCells" + this.editNum));
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

			// cells changed so AutoFit if enabled
			if (this.autoFit && this.engine.population > 0) {
				this.engine.shrinkNeeded = true;
				this.engine.doShrink();
				this.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);
			}
		}
	};

	// undo edit
	View.prototype.undo = function(/** @type {View} */ me) {
		var	/** @type {number} */ gen = 0,
			/** @type {number} */ counter = me.engine.counter,
			/** @type {number} */ current = me.editNum,
			record = null,
			/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {BoundingBox} */ selection = null,
			/** @type {number} */ steps = 1,
			/** @type {boolean} */ multiStep = false,
			/** @type {boolean} */ savedReverse = me.engine.reverseMargolus;

		// do nothing if step back disabled
		if (!me.noHistory) {
			// clear died generation
			me.diedGeneration = -1;

			// stop playback
			if (me.generationOn) {
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
					if (!multiStep && (record.action === "advance outside" || record.action === "advance selection")) {
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
						// save reverse playback mode so it can be restored
						savedReverse = me.engine.reverseMargolus;

						// go to the earlier generation
						if (gen === 0) {
							me.reset(me);
						} else {
							me.runTo(gen);
						}
						counter = me.engine.counter;

						// restore the reverse playback mode
						me.engine.reverseMargolus = savedReverse;
						me.setPauseIcon(me.generationOn);
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
						me.engine.reverseMargolus = !me.engine.reverseMargolus;
						me.engine.reversePending = false;
						me.setPauseIcon(me.generationOn);
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
			me.updateUndoToolTips();

			// check if shrink needed
			me.engine.doShrink();

			// auto fit if enabled
			if (this.autoFit) {
				this.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);
			}
		}
	};

	// redo edit
	View.prototype.redo = function(/** @type {View} */ me) {
		var	/** @type {number} */ counter = me.engine.counter,
			record = null,
			/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {number} */ steps = 1,
			/** @type {boolean} */ multiStep = false;

		// do nothing if step back disabled
		if (!me.noHistory) {
			// check for redo records
			while (steps > 0 && me.editNum < me.numEdits) {
				record = me.editList[me.editNum];

				// check for multi-step
				if (!multiStep && (record.action === "advance outside" || record.action === "advance selection")) {
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
					me.engine.reverseMargolus = !me.engine.reverseMargolus;
					me.setPauseIcon(me.generationOn);
				}

				// next record
				me.editNum += 1;
				steps -= 1;
			}

			// update tooltips
			me.updateUndoToolTips();

			// check if shrink needed
			me.engine.doShrink();

			// update state 6 grid
			if (me.engine.isLifeHistory || me.engine.isSuper) {
				me.engine.populateState6MaskFromColGrid();
			}

			// auto fit if enabled
			if (this.autoFit) {
				this.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);
			}
		}
	};

	// get neighbourhood name
	/** @returns {string} */
	View.prototype.getNeighbourhoodName = function() {
		var	/** @type {string} */ itemName = "";

		if (this.engine.isMargolus) {
			itemName = "Margolus";
		} else {
			if (this.engine.wolframRule !== -1) {
				itemName = "1D";
			} else {
				if (this.engine.patternDisplayMode) {
					itemName = "Hexagonal";
					if (this.engine.hexNeighbourhood === this.manager.hexTripod || this.engine.isHROT && this.engine.HROT.type === this.manager.tripodHROT) {
						itemName = "Tripod";
					}
					if (this.engine.isHROT && this.engine.HROT.type === this.manager.asteriskHROT) {
						itemName = "Asterisk";
					}
					if (this.engine.HROT.yrange > 1) {
						itemName += " range " + this.engine.HROT.yrange;
					}
				} else {
					if (this.engine.isHROT) {
						switch(this.engine.HROT.type) {
						case this.manager.cornerEdgeHROT:
							itemName = "Corner/Edge";
							break;

						case this.manager.mooreHROT:
							itemName = "Moore";
							break;

						case this.manager.vonNeumannHROT:
							itemName = "von Neumann";
							break;

						case this.manager.circularHROT:
							itemName = "Circular";
							break;

						case this.manager.crossHROT:
							itemName = "Cross";
							break;

						case this.manager.saltireHROT:
							itemName = "Saltire";
							break;

						case this.manager.starHROT:
							itemName = "Star";
							break;

						case this.manager.l2HROT:
							itemName = "L2";
							break;

						case this.manager.hexHROT:
							itemName = "Hexagonal";
							break;

						case this.manager.checkerHROT:
							itemName = "Checkerboard";
							break;

						case this.manager.alignedCheckerHROT:
							itemName = "Aligned Checkerboard";
							break;

						case this.manager.hashHROT:
							itemName = "Hash";
							break;

						case this.manager.customHROT:
							itemName = "Custom";
							break;

						case this.manager.tripodHROT:
							itemName = "Tripod";
							break;

						case this.manager.asteriskHROT:
							itemName = "Asterisk";
							break;

						case this.manager.triangularHROT:
							itemName = "Triangular";
							break;

						case this.manager.gaussianHROT:
							itemName = "Gaussian";
							break;

						case this.manager.weightedHROT:
							itemName = "Weighted";
							break;
						}

						if (this.engine.HROT.type === this.manager.cornerEdgeHROT) {
							itemName += " range " + this.engine.HROT.cornerRange + "/" + this.engine.HROT.edgeRange;
						} else {
							if (this.engine.HROT.yrange > 1) {
								itemName += " range " + this.engine.HROT.yrange;
							}
						}

						if (this.engine.HROT.useRandom) {
							itemName += " (non-deterministic)";
						}
					} else {
						if (this.engine.isTriangular) {
							itemName = "Triangular";
							switch (this.engine.triangularNeighbourhood) {
								case this.manager.triangularEdges:
									itemName += " Edges";
									break;
								case this.manager.triangularVertices:
									itemName += " Vertices";
									break;
								case this.manager.triangularInner:
									itemName += " Inner";
									break;
								case this.manager.triangularOuter:
									itemName += " Outer";
									break;
								case this.manager.triangularBiohazard:
									itemName += " Biohazard";
									break;
								case this.manager.triangularRadiation:
									itemName += " Radiation";
									break;
							}
						} else {
							if (this.engine.isRuleTree) {
								if (this.engine.ruleTableOutput === null) {
									if (this.engine.ruleTreeNeighbours === 4) {
										itemName = "von Neumann";
									} else {
										itemName = "Moore";
									}
								} else {
									switch (this.engine.ruleTableNeighbourhood) {
									case PatternConstants.ruleTableVN:
										itemName = "von Neumann";
										break;
									case PatternConstants.ruleTableMoore:
										itemName = "Moore";
										break;
									case PatternConstants.ruleTableHex:
										itemName = "Hexagonal";
										break;
									case PatternConstants.ruleTableOneD:
										itemName = "1D";
										break;
									default:
										itemName = "unknown";
									}
								}
							} else {
								if (this.engine.isVonNeumann || this.engine.isPCA) {
									itemName = "von Neumann";
								} else {
									itemName = "Moore";
								}
							}
						}
					}
				}
			}
		}

		if (this.engine.isNone) {
			itemName = "none";
		}

		return itemName;
	};

	// convert rle to cell list
	/** @returns {Array} */
	View.prototype.rleToCellList = function(/** @type {string} */ rle, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ transform) {
		var	/** @type {Array} */ cells = [],
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {Array<number>} */ trans = this.transforms[transform],
			/** @type {number} */ axx = trans[0],
			/** @type {number} */ axy = trans[1],
			/** @type {number} */ ayx = trans[2],
			/** @type {number} */ ayy = trans[3],
			/** @type {Pattern} */ pattern = new Pattern("rleToCellList", this.manager),
			/** @type {Uint8Array} */ patternRow = null,
			/** @type {number} */ boxWidth = 0,
			/** @type {number} */ boxHeight = 0,
			/** @type {number} */ len = Keywords.randomCellsWord.length,
			/** @type {number} */ ix = 0,
			/** @type {number} */ iy = 0,
			/** @type {number} */ states = this.engine.multiNumStates <= 2 ? 2 : this.engine.multiNumStates,
			/** @type {number} */ state = 0,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ fill = this.randomFillPercentage / 100,
			/** @type {boolean} */ valid = false;

		// check if random cells are requested
		if (rle.substring(0, len) === Keywords.randomCellsWord) {
			// get the box size
			rle = rle.substring(len);
			boxWidth = parseInt(rle.substring(0, rle.indexOf(",")), 10);
			boxHeight = parseInt(rle.substring(rle.indexOf(",") + 1), 10);

			// create random box
			i = 0;
			for (iy = 0; iy < boxHeight; iy += 1) {
				for (ix = 0; ix < boxWidth; ix += 1) {
					if (this.engine.isPCA) {
						state = 0;

						// N
						if (this.randGen.random() <= fill) {
							state |= 1;
						}

						// E
						if (this.randGen.random() <= fill) {
							state |= 2;
						}

						// S
						if (this.randGen.random() <= fill) {
							state |= 4;
						}

						// W
						if (this.randGen.random() <= fill) {
							state |= 8;
						}

						cells[i] = ix;
						cells[i + 1] = iy;
						cells[i + 2] = state;
						i += 3;
					} else {
						if (states === 2) {
							if (this.randGen.random() <= fill) {
								cells[i] = ix;
								cells[i + 1] = iy;
								cells[i + 2] = 1;
								i += 3;
							}
						} else {
							if (this.randGen.random() <= fill) {
								cells[i] = ix;
								cells[i + 1] = iy;
								state = ((this.randGen.random() * (states - 1)) | 0) + 1;
								if (invertForGenerations) {
									state = states - state;
								}
								cells[i + 2] = state;
								i += 3;
							}
						}
					}
				}
			}

			// mark valid
			valid = true;
		} else {
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
					valid = true;
				}
			}
		}

		// return error if invalid
		if (!valid) {
			cells[0] = "error";
		}

		// return the cell list
		return cells;
	};

	// get evolution count from name
	/** @returns {number} */
	View.prototype.getEvolution = function(/** @type {string} */ name) {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ i = name.indexOf("["),
			/** @type {number} */ j = name.indexOf("]"),
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),
			/** @type {number} */ next = 0;

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
	/** @returns {number} */
	View.prototype.computeNeededWidth = function(/** @type {number} */ neededWidth) {
		var	/** @type {number} */ pasteLeft = (this.pasteLeftX < 0 ? -this.pasteLeftX : this.pasteLeftX),
			/** @type {number} */ pasteRight = (this.pasteRightX < 0 ? -this.pasteRightX : this.pasteRightX),
			/** @type {number} */ pasteMax = (pasteLeft < pasteRight ? pasteRight : pasteLeft) * 2;

		if (neededWidth < pasteMax) {
			neededWidth = pasteMax;
		}

		return neededWidth;
	};

	// compute needed height to include paste snippets for grid sizing
	/** @returns {number} */
	View.prototype.computeNeededHeight = function(/** @type {number} */ neededHeight) {
		var	/** @type {number} */ pasteBottom = (this.pasteBottomY < 0 ? -this.pasteBottomY : this.pasteBottomY),
			/** @type {number} */ pasteTop = (this.pasteTopY < 0 ? -this.pasteTopY : this.pasteTopY),
			/** @type {number} */ pasteMax = (pasteBottom < pasteTop ? pasteTop : pasteBottom) * 2;

		if (neededHeight < pasteMax) {
			neededHeight = pasteMax;
		}

		return neededHeight;
	};

	// add existing recipe to delta array
	/** @returns {boolean} */
	View.prototype.addRecipe = function(/** @type {string} */ name, /** @type {Array<number>} */ deltaList) {
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false,
			/** @type {Array} */ deltas = null;

		// lookup the recipe
		i = 0;
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
	View.prototype.addNamedRecipe = function(/** @type {Array} */ scriptErrors, /** @type {string} */ name, /** @type {Array<number>} */ deltaList) {
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false,
			/** @type {Array} */ deltas = [];

		// check the name is not a reserved word
		if (ScriptParser.isScriptCommand(name)) {
			scriptErrors[scriptErrors.length] = [Keywords.recipeWord + " " + name, "name is reserved word"];
		} else {
			// check the name does not already exist
			i = 0;
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
	View.prototype.addNamedRLE = function(/** @type {Array} */ scriptErrors, /** @type {string} */ name, /** @type {string} */ rle, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ transform) {
		// attempt to decode the rle
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false,
			/** @type {Array} */ cells = [];

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
						this.rleList[this.rleList.length] = {name: name, cells: cells};
					} else {
						scriptErrors[scriptErrors.length] = [Keywords.rleWord + " " + name, "invalid RLE"];
					}
				}
			}
		}
	};

	// add rle to paste list
	/** @returns {boolean} */
	View.prototype.addRLE = function(/** @type {number} */ gen, /** @type {number} */ end, /** @type {Array<number>} */ deltaList, /** @type {number} */ every, /** @type {number} */ mode, /** @type {number} */ deltaX, /** @type {number} */ deltaY, /** @type {string} */ rle, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ transform) {
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false,
			/** @type {Array} */ cells = [],
			/** @type {number} */ cellx = 0,
			/** @type {number} */ celly = 0,
			/** @type {Array<number>} */ trans = this.transforms[transform],
			/** @type {number} */ axx = trans[0],
			/** @type {number} */ axy = trans[1],
			/** @type {number} */ ayx = trans[2],
			/** @type {number} */ ayy = trans[3],
			/** @type {number} */ leftX = ViewConstants.bigInteger,
			/** @type {number} */ rightX = -ViewConstants.bigInteger,
			/** @type {number} */ bottomY = ViewConstants.bigInteger,
			/** @type {number} */ topY = -ViewConstants.bigInteger,
			/** @type {number} */ evolveIndex = rle.indexOf("["),
			/** @type {string} */ namePrefix = rle,
			/** @type {number} */ evolution = 0,
			/** @type {Array<number>} */ genList = [],
			/** @type {number} */ boxWidth = 0,
			/** @type {number} */ boxHeight = 0,
			/** @type {number} */ len = Keywords.randomCellsWord.length,
			/** @type {number} */ ix = 0,
			/** @type {number} */ iy = 0,
			/** @type {number} */ states = this.engine.multiNumStates <= 2 ? 2 : this.engine.multiNumStates,
			/** @type {number} */ state = 0,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ fill = this.randomFillPercentage / 100,
			/** @type {Array<Uint8Array>} */ stateMap = null;

		// check for evolution
		if (evolveIndex !== -1) {
			// remove the evolution postfix
			namePrefix = rle.substring(0, evolveIndex);

			// get the number of evolution generations
			evolution = this.getEvolution(rle);
		}

		// check if random cells are requested
		if (namePrefix.substring(0, len) === Keywords.randomCellsWord) {
			// get the box size
			namePrefix = namePrefix.substring(len);
			boxWidth = parseInt(namePrefix.substring(0, namePrefix.indexOf(",")), 10);
			boxHeight = parseInt(namePrefix.substring(namePrefix.indexOf(",") + 1), 10);

			// create random box
			i = 0;
			for (iy = 0; iy < boxHeight; iy += 1) {
				for (ix = 0; ix < boxWidth; ix += 1) {
					if (states === 2) {
						if (this.randGen.random() <= fill) {
							cells[i] = ix;
							cells[i + 1] = iy;
							cells[i + 2] = 1;
							i += 3;
						}
					} else {
						if (this.randGen.random() <= fill) {
							cells[i] = ix;
							cells[i + 1] = iy;
							state = ((this.randGen.random() * (states - 1)) | 0) + 1;
							if (invertForGenerations) {
								state = states - state;
							}
							cells[i + 2] = state;
							i += 3;
						}
					}
				}
			}

			// mark rle as found
			found = true;
		} else {
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
			stateMap = Array.matrix(Type.Uint8, topY - bottomY + 1, rightX - leftX + 1, 0, this.engine.allocator, "View.rle" + this.pasteList.length);

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
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			item = null,
			/** @type {number} */ state = 0,
			/** @type {number} */ gens = 0,
			/** @type {number} */ gridWidth = this.engine.width,
			/** @type {number} */ xOff = 0,
			/** @type {number} */ yOff = 0,
			/** @type {number} */ minX = 0,
			/** @type {number} */ minY = 0,
			/** @type {BoundingBox} */ zoomBox = this.engine.zoomBox,
			/** @type {Array<number>} */ cells = [];

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
					// compute next generation with no history
					this.engine.nextGeneration(true);
					this.engine.convertToPensTile();
					this.engine.saveSnapshotIfNeeded(this);
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
				item.map = Array.matrix(Type.Uint8, item.height, item.width, 0, this.engine.allocator, "View.rle" + j);

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
	/** @returns {boolean} */
	View.prototype.pasteThisGen = function(paste) {
		var	/** @type {boolean} */ needsPaste = false,
			/** @type {number} */ i = 0,
			/** @type {number} */ counter = this.engine.counter,
			/** @type {boolean} */ finished = false;

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
	/** @returns {boolean} */
	View.prototype.anyPasteThisGen = function() {
		var	/** @type {boolean} */ needsPaste = false,
			/** @type {number} */ i = 0,
			/** @type {number} */ length = this.pasteList.length;

		while (i < length && !needsPaste) {
			needsPaste = this.pasteThisGen(this.pasteList[i]);
			i += 1;
		}

		return needsPaste;
	};

	// set state and check if it is on the grid
	/** @returns {number} */
	View.prototype.setStateWithCheck = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ state, /** @type {boolean} */ deadZero) {
		var	/** @type {number} */ result = 0,
			/** @type {Array} */ checkGridResult = [];

		// check if the cell is on the grid
		checkGridResult = this.cellOnGrid(x, y);
		if (checkGridResult[0]) {
			// cell is on grid so update x and y in case grid grew
			x = checkGridResult[1];
			y = checkGridResult[2];

			// draw the cell
			result = this.engine.setState(x, y, state, deadZero);
		}

		return result;
	};

	// get state and check if it is on the grid
	/** @returns {number} */
	View.prototype.getStateWithCheck = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ rawRequested) {
		var	/** @type {number} */ result = 0,
			/** @type {Array} */ checkGridResult = [];

		// check if the cell is on the grid
		checkGridResult = this.cellOnGrid(x, y);
		if (checkGridResult[0]) {
			// cell is on grid so update x and y in case grid grew
			x = checkGridResult[1];
			y = checkGridResult[2];

			// get the cell state
			result = this.engine.getState(x, y, rawRequested);
		}

		return result;
	};

	// paste rle list to grid
	View.prototype.pasteRLEList = function() {
		var	/** @type {number} */ j = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ xOff = 0,
			/** @type {number} */ yOff = 0,
			paste = null,
			/** @type {number} */ counter = this.engine.counter,
			/** @type {number} */ mode = ViewConstants.pasteModeOr,
			/** @type {number} */ width = this.engine.width,
			/** @type {number} */ height = this.engine.height,
			/** @type {number} */ source = 0,
			/** @type {number} */ dest = 0,
			/** @type {number} */ sourceFlag = 0,
			/** @type {number} */ destFlag = 0,
			/** @type {number} */ result = 0,
			/** @type {number} */ mult = 0,
			/** @type {number} */ gridWidth = this.engine.width,
			/** @type {number} */ gridHeight = this.engine.height,
			/** @type {Array<Uint8Array>} */ stateMap = null,
			/** @type {Uint8Array} */ stateRow = null,
			/** @type {number} */ numStates = this.engine.multiNumStates - 1,
			/** @type {number} */ wasState6 = 0;

		// ignore PASTE for none rule
		if (this.engine.isNone) {
			return;
		}

		// get number of states
		if (numStates === -2) {
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
				yOff = (gridHeight >> 1) - (this.patternHeight >> 1);
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
					if (numStates >= 2 && !(this.engine.isLifeHistory || this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)) {
						for (x = 0; x < stateRow.length; x += 1) {
							// get the next cell to paste
							source = stateRow[x];

							// get the current cell from the grid
							dest = this.getStateWithCheck(xOff + x, yOff + y, false);

							// check for grid growth
							while (width !== this.engine.width || height !== this.engine.height) {
								if (width !== this.engine.width) {
									// double width
									width <<= 1;

									// adjust drawing cell position
									xOff += width >> 2;

									this.defaultX += width >> 2;
									this.savedX += width >> 2;
									this.panX += width >> 2;
								}

								if (height !== this.engine.height) {
									// same for height
									height <<= 1;
									yOff += height >> 2;

									this.defaultY += height >> 2;
									this.savedY += height >> 2;
									this.panY += height >> 2;
								}
							}

							// determine paste mode
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

							// ensure result is in range
							if (result < 0) {
								result = 0;
							} else {
								if (result > numStates) {
									result = numStates;
								}
							}

							// draw the cell if it changed or in COPY mode
							if ((source !== dest) || mode === ViewConstants.pasteModeCopy) {
								this.setStateWithCheck(xOff + x, yOff + y, result, true);
							}
						}
					} else {
						if (this.engine.isPCA || this.engine.isRuleTree || this.engine.isExtended) {
							for (x = 0; x < stateRow.length; x += 1) {
								// get the next cell to paste
								source = stateRow[x];

								// get the current cell from the grid
								dest = this.getStateWithCheck(xOff + x, yOff + y, false);

								// check for grid growth
								while (width !== this.engine.width || height !== this.engine.height) {
									if (width !== this.engine.width) {
										// double width
										width <<= 1;

										// adjust drawing cell position
										xOff += width >> 2;

										this.defaultX += width >> 2;
										this.savedX += width >> 2;
										this.panX += width >> 2;
									}

									if (height !== this.engine.height) {
										// same for height
										height <<= 1;
										yOff += height >> 2;

										this.defaultY += height >> 2;
										this.savedY += height >> 2;
										this.panY += height >> 2;
									}
								}

								// determine paste mode
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
										if (this.engine.isExtended) {
											result = dest;
											if (source != 0) {
												result = source;
											}
										} else {
											result = source | dest;
										}
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

								// ensure result is in range
								if (result < 0) {
									result = 0;
								} else {
									if (result > numStates) {
										result = numStates;
									}
								}
								this.setStateWithCheck(xOff + x, yOff + y, result, true);
							}
						} else {
							if (this.engine.isLifeHistory || this.engine.isSuper) {
								for (x = 0; x < stateRow.length; x += 1) {
									// get the next cell to paste
									source = stateRow[x];

									// get the current cell from the grid
									dest = this.getStateWithCheck(xOff + x, yOff + y, false);

									// check for grid growth
									while (width !== this.engine.width || height !== this.engine.height) {
										if (width !== this.engine.width) {
											// double width
											width <<= 1;

											// adjust drawing cell position
											xOff += width >> 2;

											this.defaultX += width >> 2;
											this.savedX += width >> 2;
											this.panX += width >> 2;
										}

										if (height !== this.engine.height) {
											// same for height
											height <<= 1;
											yOff += height >> 2;

											this.defaultY += height >> 2;
											this.savedY += height >> 2;
											this.panY += height >> 2;
										}
									}

									if (mode === ViewConstants.pasteModeCopy) {
										result = source;
										sourceFlag = 1;
										destFlag = 0;

										// ignore if cell hasn't changed
										if (source === dest) {
											destFlag = 1;
										}
									} else {
										sourceFlag = source & 1;
										destFlag = dest & 1;
										result = ((mode & (8 >> ((sourceFlag + sourceFlag) | destFlag))) === 0 ? 0 : 1);
									}

									// if the cell changed then update the grid
									if (sourceFlag !== destFlag) {
										wasState6 |= this.setStateWithCheck(xOff + x, yOff + y, result, false);
									}
								}
							} else {
								for (x = 0; x < stateRow.length; x += 1) {
									// get the next cell to paste
									source = stateRow[x];
									sourceFlag = (source === 0 ? 0 : 1);

									// get the current cell from the grid
									dest = this.getStateWithCheck(xOff + x, yOff + y, false);
									destFlag = (dest === 0 ? 0 : 1);

									// check for grid growth
									while (width !== this.engine.width || height !== this.engine.height) {
										if (width !== this.engine.width) {
											// double width
											width <<= 1;

											// adjust drawing cell position
											xOff += width >> 2;

											this.defaultX += width >> 2;
											this.savedX += width >> 2;
											this.panX += width >> 2;
										}

										if (height !== this.engine.height) {
											// same for height
											height <<= 1;
											yOff += height >> 2;

											this.defaultY += height >> 2;
											this.savedY += height >> 2;
											this.panY += height >> 2;
										}
									}

									result = ((mode & (8 >> ((sourceFlag + sourceFlag) | destFlag))) === 0 ? 0 : 1);
									if ((result !== dest) || mode === ViewConstants.pasteModeCopy) {
										if (!((source === 0) && (dest === 0))) {
											this.setStateWithCheck(xOff + x, yOff + y, result, false);
										}
									}
								}
							}
						}
					}
				}
			}
		}

		// check if [R]History state6 changed
		if ((this.engine.isLifeHistory || this.engine.isSuper) && wasState6) {
			// update state 6 grid
			this.engine.populateState6MaskFromColGrid();
		}

		// paste any edits
		this.pasteEdits();
	};

	// paste edits
	View.prototype.pasteEdits = function() {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ counter = this.engine.counter;

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
	View.prototype.setInitialFlagsTo = function(/** @type {boolean} */ value) {
		// initial value flags
		this.initialX = value;
		this.initialY = value;
		this.initialZ = value;
		this.initialAngle = value;
		this.initialTilt = value;
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

	// download screenshot
	View.prototype.captureScreenShot = function(/** @type {View} */ me) {
		// create a link
		var	link = document.createElement("a");

		// hide the element
		me.hideElement(link);

		// make the link point to the image
		link.href = me.mainCanvas.toDataURL("image/png");
		link.download = "screenshot.png";
		link.click();

		// remove the new link
		link.remove();

		// notify that image captured
		me.menuManager.notification.notify("Image saved", 15, 300, 15, true);
	};

	// download cell period map
	View.prototype.downloadCellPeriodMap = function(/** @type {View} */ me) {
		// create a link
		if (me.lastIdentifyType !== "Oscillator") {
			me.menuManager.notification.notify("No Cell Map", 15, 300, 15, true);
		} else {
			var	link = document.createElement("a");

			me.hideElement(link);

			// make the link point to the image
			link.href = me.engine.cellPeriodCanvas.toDataURL("image/png");
			link.download = "cellmap.png";
			link.click();

			// remove the new link
			link.remove();

			// notify that image captured
			me.menuManager.notification.notify("Cell Map saved", 15, 300, 15, true);
		}
	};

	// copy pattern to grid position
	View.prototype.copyPatternTo = function(/** @type {Pattern} */ pattern) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,

			// life grid and colour grid
			/** @type {Array<Uint16Array>} */ grid = this.engine.grid16,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Array<Uint8Array>} */ nextColourGrid = this.engine.nextColourGrid,
			/** @type {Array<Uint8Array>} */ overlayGrid = this.engine.overlayGrid,

			// lookup pattern width and height
			/** @type {number} */ width = pattern.width,
			/** @type {number} */ height = pattern.height,

			// get x and y grid position
			/** @type {number} */ panX = this.panX,
			/** @type {number} */ panY = this.panY,

			// pattern row and grid row
			/** @type {Uint16Array} */ patternRow = null,
			/** @type {Uint16Array} */ gridRow = null,
			/** @type {Uint8Array} */ multiStateRow = null,
			/** @type {Uint8Array} */ colourGridRow = null,
			/** @type {Uint8Array} */ overlayGridRow = null,

			// state number
			/** @type {number} */ state = 0,

			// bounded grid range
			/** @type {number} */ bLeftX = Math.round(-this.engine.boundedGridWidth / 2),
			/** @type {number} */ bRightX = Math.floor((this.engine.boundedGridWidth - 1) / 2),
			/** @type {number} */ bBottomY = Math.round(-this.engine.boundedGridHeight / 2),
			/** @type {number} */ bTopY = Math.floor((this.engine.boundedGridHeight - 1) / 2),

			// pattern destination
			/** @type {number} */ dLeftX = panX - (this.engine.width >> 1),
			/** @type {number} */ dRightX = dLeftX + width - 1,
			/** @type {number} */ dBottomY = panY - (this.engine.height >> 1),
			/** @type {number} */ dTopY = dBottomY + height - 1,

			// number of pattern states
			/** @type {number} */ numStates = this.engine.multiNumStates,

			// whether pattern is 2-state HROT
			/** @type {boolean} */ isTwoStateHROT = (numStates === 2 && this.engine.isHROT),

			// whether the pattern needs clipping along a row
			/** @type {boolean} */ needsClipping = true;

		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			// check if pattern is inside bounded grid
			if (this.engine.boundedGridWidth !== 0) {
				if (dLeftX < bLeftX || dRightX > bRightX) {
					this.wasClipped = true;
				}
			} else {
				bLeftX = -this.engine.width >> 1;
				bRightX = (this.engine.width >> 1) - 1;
			}
			if (this.engine.boundedGridHeight !== 0) {
				if (dTopY > bTopY || dBottomY < bBottomY) {
					this.wasClipped = true;
				}
			} else {
				bBottomY = -this.engine.height >> 1;
				bTopY = (this.engine.height >> 1) - 1;
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
			dLeftX = panX - (this.engine.width >> 1);
			dRightX = dLeftX + width - 1;
			dBottomY = panY - (this.engine.height >> 1);
			dTopY = dBottomY + height - 1;
		}

		// Margolus patterns must be on odd cell bounderies
		if (pattern.isMargolus) {
			if ((panX & 1) === 0) {
				panX -= 1;
			}
			if ((panY & 1) === 0) {
				panY -= 1;
			}
			dLeftX = panX - (this.engine.width >> 1);
			dRightX = dLeftX + width - 1;
			dBottomY = panY - (this.engine.height >> 1);
			dTopY = dBottomY + height - 1;
		}

		// create bounding box for copy
		if (this.engine.boundedGridType !== -1) {
			dLeftX = bLeftX;
			dRightX = bRightX;
			dBottomY = bBottomY;
			dTopY = bTopY;
		}
		dLeftX += this.engine.width >> 1;
		dRightX += this.engine.width >> 1;
		dBottomY += this.engine.height >> 1;
		dTopY += this.engine.height >> 1;

		// clip to grid
		if (dLeftX < 0) {
			dLeftX = 0;
		}
		if (dRightX >= this.engine.width) {
			dRightX = this.engine.width - 1;
		}
		if (dBottomY < 0) {
			dBottomY = 0;
		}
		if (dTopY >= this.engine.height) {
			dTopY = this.engine.height -1;
		}

		// check if the pattern needs clipping along each row
		if (panX >= dLeftX && panX <= dRightX && width + panX >= dLeftX && width - 1 + panX <= dRightX) {
			needsClipping = false;
		}

		// update the life grid
		for (y = 0; y < height; y += 1) {
			patternRow = pattern.lifeMap[y];
			if (y + panY >= dBottomY && y + panY <= dTopY) {

				gridRow = grid[y + panY];

				// check for multi-state view
				if (this.multiStateView || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended || !this.executable) {
					multiStateRow = pattern.multiStateMap[y];
					colourGridRow = colourGrid[y + panY];

					// copy colour cells
					if (!needsClipping) {
						// no clipping needed
						for (x = 0; x < width; x += 1) {
							state = multiStateRow[x];
							if (state > 0) {
								state += this.historyStates;
							}
							colourGridRow[x + panX] = state;
						}
					} else {
						// clipping needed
						for (x = 0; x < width; x += 1) {
							if (x + panX >= dLeftX && x + panX <= dRightX) {
								state = multiStateRow[x];
								if (state > 0) {
									state += this.historyStates;
								}
								colourGridRow[x + panX] = state;
							}
						}
					}
				} else {
					// check for multi-state pattern
					if (numStates > 2) {
						multiStateRow = pattern.multiStateMap[y];
						colourGridRow = colourGrid[y + panY];

						// copy colour cells
						if (!needsClipping) {
							// no clipping needed
							for (x = 0; x < width; x += 1) {
								// reverse order for rendering unless "none" rule is used
								state = multiStateRow[x];
								if (state > 0 && !this.engine.isNone) {
									state = numStates + this.historyStates - state;
								}
								colourGridRow[x + panX] = state;
							}
						} else {
							// clipping needed
							for (x = 0; x < width; x += 1) {
								if (x + panX >= dLeftX && x + panX <= dRightX) {
									// reverse order for rendering unless "none" rule is used
									state = multiStateRow[x];
									if (state > 0 && !this.engine.isNone) {
										state = numStates + this.historyStates - state;
									}
									colourGridRow[x + panX] = state;
								}
							}
						}
					}
				}

				// copy 2-state cells
				if (isTwoStateHROT) {
					colourGridRow = colourGrid[y + panY];

					// check if clipping is required
					if (!needsClipping) {
						// no clipping needed
						for (x = 0; x < width; x += 1) {
							if ((patternRow[x >> 4] & (1 << (~x & 15))) !== 0) {
								gridRow[(x + panX) >> 4] |= 1 << (~(x + panX) & 15);
								colourGridRow[x + panX] = LifeConstants.aliveStart;
							}
						}
					} else {
						// clipping needed
						for (x = 0; x < width; x += 1) {
							if (x + panX >= dLeftX && x + panX <= dRightX) {
								if ((patternRow[x >> 4] & (1 << (~x & 15))) !== 0) {
									gridRow[(x + panX) >> 4] |= 1 << (~(x + panX) & 15);
									colourGridRow[x + panX] = LifeConstants.aliveStart;
								}
							}
						}
					}
				} else {
					// check if clipping is required
					if (!needsClipping) {
						// no clipping needed
						for (x = 0; x < width; x += 1) {
							if ((patternRow[x >> 4] & (1 << (~x & 15))) !== 0) {
								gridRow[(x + panX) >> 4] |= 1 << (~(x + panX) & 15);
							}
						}
					} else {
						// clipping needed
						for (x = 0; x < width; x += 1) {
							if (x + panX >= dLeftX && x + panX <= dRightX) {
								if ((patternRow[x >> 4] & (1 << (~x & 15))) !== 0) {
									gridRow[(x + panX) >> 4] |= 1 << (~(x + panX) & 15);
								}
							}
						}
					}
				}
			}
		}

		// copy [R]History states to the overlay grid if required
		if (overlayGrid) {
			for (y = 0; y < height; y += 1) {
				if (y + panY >= dBottomY && y + panY <= dTopY) {
					multiStateRow = pattern.multiStateMap[y];
					overlayGridRow = overlayGrid[y + panY];

					// copy states
					if (!needsClipping) {
						// no clipping needed
						for (x = 0; x < width; x += 1) {
							// get the next state
							state = multiStateRow[x];
							if (state) {
								// copy to the overlay grid and convert into ascending importance order
								overlayGridRow[x + panX] = ViewConstants.stateMap[state] + 128;
							}
						}
					} else {
						// clipping needed
						for (x = 0; x < width; x += 1) {
							if (x + panX >= dLeftX && x + panX <= dRightX) {
								// get the next state
								state = multiStateRow[x];
								if (state) {
									// copy to the overlay grid and convert into ascending importance order
									overlayGridRow[x + panX] = ViewConstants.stateMap[state] + 128;
								}
							}
						}
					}
				}
			}
		}

		// copy colour grid to next colour grid for PCA, RuleTree and Super rules
		if (this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended) {
			nextColourGrid.whole.set(colourGrid.whole);
		}
	};

	// whether grid is finitely bounded
	/** @returns {boolean} */
	View.prototype.finitelyBounded = function() {
		var	/** @type {boolean} */ result = false;

		// check for a bounded grid with non-zero (not infinite) width or height
		if (this.engine.boundedGridType !== -1 && this.engine.boundedGridWidth !== 0 && this.engine.boundedGridHeight !== 0) {
			result = true;
		}

		return result;
	};

	// whether grid is infinitely bounded
	/** @returns {boolean} */
	View.prototype.infinitelyBounded = function() {
		var	/** @type {boolean} */ result = false;

		// check for a bounded grid with a zero (infinite) width or height
		if (this.engine.boundedGridType !== -1 && (this.engine.boundedGridWidth === 0 || this.engine.boundedGridHeight === 0)) {
			result = true;
		}

		return result;
	};

	// opacity range
	/** @returns {Array} */
	View.prototype.viewOpacityRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	result = newValue[0];

		// check if changing
		if (change) {
			me.popGraphOpacity = result;
		}

		return [result, result * 100];
	};

	// paste position range
	/** @returns {Array} */
	View.prototype.viewPastePositionRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {string} */ posName = "";

		// check if changing
		if (change) {
			me.pastePosition = newValue[0];
		}

		posName = ViewConstants.pastePositionNames[(me.pastePosition + 0.5) | 0];
		return [me.pastePosition, posName];
	};

	// cycle paste location
	View.prototype.cyclePasteLocation = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			me.pastePosition = ((me.pastePosition + 0.5) | 0) + 1;
			if (me.pastePosition >= ViewConstants.numPastePositions) {
				me.pastePosition = 0;
			}
			me.pastePositionItem.current = me.viewPastePositionRange([me.pastePosition, me.pastePosition], true, me);
		}
	};

	// random density range
	/** @returns {Array} */
	View.prototype.viewRandomRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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
	/** @returns {Array} */
	View.prototype.viewStatesRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	result = newValue;

		// check if changing
		if (change) {
			me.startState = ((me.engine.multiNumStates - me.maxDisplayStates) * newValue[0]) | 0;
		}
		result[1] = "";
		if (me.startState > 0) {
			result[1] = "<";
		}
		result[1] += me.startState + "-" + (me.startState + me.maxDisplayStates - 1);
		if (me.startState + me.maxDisplayStates < me.engine.multiNumStates) {
			result[1] += ">";
		}

		return result;
	};

	// zoom range
	/** @returns {Array} */
	View.prototype.viewZoomRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	result = newValue[0],
			/** @type {number} */ displayValue = 0;

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
	/** @returns {string} */
	View.prototype.asTime = function(/** @type {number} */ milliseconds) {
		var	/** @type {number} */ minutes = (milliseconds / 60000) | 0,
			/** @type {number} */ seconds = (milliseconds % 60000) / 1000,
			/** @type {string} */ result = "";

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
	View.prototype.fitZoomDisplay = function(/** @type {boolean} */ immediate, /** @type {boolean} */ smooth, /** @type {number} */ fitType) {
		// get the x, y and zoom that fits the pattern on the display
		var	/** @type {Array<number>} */ fitZoom = [],

			// remember the original x, y and zoom
			/** @type {number} */ origZoom = this.engine.zoom,
			/** @type {number} */ origX = this.engine.xOff,
			/** @type {number} */ origY = this.engine.yOff,

			// deltas
			/** @type {number} */ zoomDelta = 0,
			/** @type {number} */ xDelta = 0,
			/** @type {number} */ yDelta = 0,

			// sum weight
			/** @type {number} */ weight = this.autoFitWeight,

			// height adjust for GUI
			/** @type {number} */ heightAdjust = ViewConstants.guiExtraHeight,

			// offset for selection
			/** @type {number} */ swap = 0,
			/** @type {BoundingBox} */ middleBox = this.middleBox,
			/** @type {BoundingBox} */ selBox = this.selectionBox,
			/** @type {number} */ xOff = (this.engine.width >> 1) - (this.patternWidth >> 1) + (this.xOffset << 1),
			/** @type {number} */ yOff = (this.engine.height >> 1) - (this.patternHeight >> 1) + (this.yOffset << 1);

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
			fitZoom = this.engine.fitZoomDisplay(fitType, middleBox, this.displayWidth * this.thumbnailDivisor, this.displayHeight * this.thumbnailDivisor, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor, this.patternWidth, this.patternHeight, this.viewOnly && this.multiStateView, this.historyFit, this.state1Fit, this.autoFit);
			fitZoom[0] /= this.thumbnailDivisor;
		} else {
			if (this.noGUI) {
				heightAdjust = 0;
			}
			fitZoom = this.engine.fitZoomDisplay(fitType, middleBox, this.displayWidth, this.displayHeight - heightAdjust, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor, this.patternWidth, this.patternHeight, this.viewOnly && this.multiStateView, this.historyFit, this.state1Fit, this.autoFit);
		}

		// check for auto fit
		if (this.autoFit && !immediate) {
			// reduce the weight at high zooms
			if (this.engine.zoom >= 16) {
				weight = 2;
			}

			// reduce the weight if playback is on at STEP is greater than 1
			if (this.gensPerStep > 1 && this.generationOn) {
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
			this.startTiltPOI = this.engine.tilt;

			// save end point
			this.endXPOI = this.engine.width / 2 - fitZoom[1];
			this.endYPOI = this.engine.height / 2 - fitZoom[2];
			this.endZoomPOI = fitZoom[0];
			this.endAnglePOI = this.startAnglePOI;
			this.endTiltPOI = this.startTiltPOI;

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

		// update tilt control if available
		if (this.tiltItem) {
			this.tiltItem.current = this.viewTiltRange([this.convertFromTilt(this.engine.tilt), this.engine.tilt], false, this);
		}
	};

	// compute pattern pan X and Y
	View.prototype.computePanXY = function(/** @type {number} */ width, /** @type {number} */ height, /** @type {number} */ specifiedWidth, /** @type {number} */ specifiedHeight) {
		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			if (this.posDefined) {
				this.panX = Math.round((this.engine.width) / 2) + this.xOffset;
				this.panY = Math.round((this.engine.height) / 2) + this.yOffset;
			} else {
				this.panX = Math.round((this.engine.width - specifiedWidth) / 2);
				this.panY = Math.round((this.engine.height - specifiedHeight) / 2);
			}
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
	/** @returns {string} */
	View.prototype.shortenNumber = function(/** @type {number} */ value) {
		var	/** @type {number} */ pos = value,
			/** @type {string} */ result = "";

		// get absolute value
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
	View.prototype.adjustZoomPosition = function(/** @type {number} */ currentZoom, /** @type {number} */ zoomDelta) {
		// get the cursor position on the screen
		var	/** @type {number} */ x = this.menuManager.mouseLastX,
			/** @type {number} */ y = this.menuManager.mouseLastY,
			/** @type {number} */ newX = 0,
			/** @type {number} */ newY = 0,

			// compute new zoom
			/** @type {number} */ newZoom = currentZoom + zoomDelta,

			// get current angle and compute sin and cos
			/** @type {number} */ angle = -this.engine.angle,
			/** @type {number} */ sinAngle = Math.sin(angle / 180 * Math.PI),
			/** @type {number} */ cosAngle = Math.cos(angle / 180 * Math.PI),
			/** @type {number} */ dx = 0,
			/** @type {number} */ dy = 0;

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

	// get safe border size for grid (returns double the size to include amount needed to add to X or Y pattern dimension)
	/** @returns {number} */
	View.prototype.getSafeBorderSize = function() {
		// set default border to tile width
		var	/** @type {number} */ result = (1 << this.engine.tilePower) * 2;

		if (this.engine.isHROT) {
			result = this.engine.HROT.xrange * 4 + 1;

			if (this.engine.boundedGridType !== -1) {
				result += this.engine.HROT.xrange * 2;
			}

			if (this.engine.HROT.type === this.manager.vonNeumannHROT) {
				if (this.engine.boundedGridType !== -1) {
					result += this.engine.boundedGridHeight / 2;
				} else {
					result += this.engine.HROT.ncols / 2;
				}
			}
		}

		return result;
	};

	// check if grid needs to grow
	View.prototype.checkGridSize = function(/** @type {View} */ me, /** @type {BoundingBox} */ box) {
		var	/** @type {number} */ borderSize = me.getSafeBorderSize();

		// grow the grid if needed
		me.engine.checkForGrowth(me, box, borderSize);
	};

	// check if the selection needs the grid to grow
	/** @returns {boolean} */
	View.prototype.checkSelectionSize = function(/** @type {View} */ me) {
		var	/** @type {boolean} */ clipped = false,
			/** @type {number} */ swap = 0,

			// grid extent
			/** @type {number} */ gLeftX = 0,
			/** @type {number} */ gBottomY = 0,
			/** @type {number} */ gRightX = 0,
			/** @type {number} */ gTopY = 0,

			// convert selection box to middle coordinates
			/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {BoundingBox} */ midBox = me.middleBox,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		midBox.leftX = selBox.leftX + xOff;
		midBox.bottomY = selBox.bottomY + yOff;
		midBox.rightX = selBox.rightX + xOff;
		midBox.topY = selBox.topY + yOff;

		if (midBox.leftX > midBox.rightX) {
			swap = midBox.rightX;
			midBox.rightX = midBox.leftX;
			midBox.leftX = swap;
		}
		if (midBox.bottomY > midBox.topY) {
			swap = midBox.topY;
			midBox.topY = midBox.bottomY;
			midBox.bottomY = swap;
		}

		me.checkGridSize(me, midBox);

		// get grid extent
		gLeftX = 0;
		gRightX = me.engine.width - 1;
		gBottomY = 0;
		gTopY = me.engine.height - 1;

		// add border for HROT rules
		if (me.engine.isHROT) {
			gLeftX += me.engine.HROT.xrange * 2 + 1;
			gRightX -= me.engine.HROT.xrange * 2 + 1;
			gBottomY += me.engine.HROT.yrange * 2 + 1;
			gTopY -= me.engine.HROT.yrange * 2 + 1;
		}

		// clip the selection to the grid
		xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
		yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
		if (selBox.leftX + xOff < gLeftX) {
			selBox.leftX = -xOff;
			clipped = true;
		}

		if (selBox.leftX + xOff > gRightX) {
			selBox.leftX = me.engine.width - 1 - xOff;
			clipped = true;
		}

		if (selBox.rightX + xOff < gLeftX) {
			selBox.rightX = -xOff;
			clipped = true;
		}

		if (selBox.rightX + xOff > gRightX) {
			selBox.rightX = me.engine.width - 1 - xOff;
			clipped = true;
		}

		if (selBox.bottomY + yOff < gBottomY) {
			selBox.bottomY = -yOff;
			clipped = true;
		}

		if (selBox.bottomY + yOff > gTopY) {
			selBox.bottomY = me.engine.height - 1 - yOff;
			clipped = true;
		}

		if (selBox.topY + yOff < gBottomY) {
			selBox.topY = -yOff;
			clipped = true;
		}

		if (selBox.topY + yOff > gTopY) {
			selBox.topY = me.engine.height - 1 - yOff;
			clipped = true;
		}

		// return whether the selection was clipped
		return clipped;
	};

	// update progress bar for start from
	View.prototype.updateProgressBarStartFrom = function(/** @type {View} */ me) {
		// update the progress bar
		me.progressBar.current = 100 * (1 - (me.startFrom - me.engine.counter) / me.startFromGens);

		// show the progress bar
		me.progressBar.deleted = false;

		// clear the bg alpha to show the progress bar
		me.genToggle.bgAlpha = 0;
	};

	// update progress bar for history computation
	View.prototype.updateProgressBarHistory = function(/** @type {View} */ me, /** @type {number} */ targetGen) {
		// update the progress bar
		me.progressBar.current = 100 * (me.engine.counter / targetGen);

		// show the progress bar
		me.progressBar.deleted = false;

		// clear the bg alpha to show the progress bar
		me.genToggle.bgAlpha = 0;
	};

	// update progress bar
	View.prototype.updateProgressBar = function(/** @type {View} */ me) {
		var	/** @type {boolean} */ isLooping = false,
			/** @type {boolean} */ waypointsRunning = false,
			/** @type {number} */ journey = 0,
			/** @type {number} */ progress = 0,
			/** @type {boolean} */ isDeleted = false;

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
		var	/** @type {number} */ displayWidth = this.engine.displayWidth,
			/** @type {number} */ displayHeight = this.engine.displayHeight,
			/** @type {Uint32Array} */ data32 = this.engine.data32;

		// draw the starfield
		this.starField.create2D(this.engine.width / 2 - this.engine.camXOff, this.engine.height / 2 - this.engine.camYOff, this.engine.camZoom, this.engine.camAngle, displayWidth, displayHeight, data32, this.engine.pixelColours[0]);
	};

	// read a single cell state
	/** @returns {number} */
	View.prototype.readCell = function() {
		// position relative to display width and height
		var	/** @type {number} */ displayX = this.viewMenu.mouseX - this.displayWidth / 2,
			/** @type {number} */ displayY = this.viewMenu.mouseY - this.displayHeight / 2,

			// engine camera x and y
			/** @type {number} */ engineY = this.panY - this.engine.yOff,
			/** @type {number} */ engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

			// engine origin x and y
			/** @type {number} */ originX = this.engine.originX,
			/** @type {number} */ originY = this.engine.originY,

			// cell position
			/** @type {number} */ yPos = 0,
			/** @type {number} */ xPos = 0,
			/** @type {number} */ yFrac = 0,
			/** @type {number} */ xFrac = 0,

			// rotation
			/** @type {number} */ theta = 0,
			/** @type {number} */ radius = 0,

			// x and y zoom
			/** @type {number} */ xZoom = this.engine.zoom,
			/** @type {number} */ yZoom = this.engine.getYZoom(this.engine.zoom),

			// cell state
			/** @type {number} */ state = -1;

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
			yPos = displayY / yZoom - engineY + originY;
			yFrac = yPos - Math.floor(yPos);
			yPos -= yFrac;
			xPos = (displayX / xZoom) + (this.engine.isHex ? (engineY / 2) + (yPos / 2) : 0) - engineX + originX;
			if (this.engine.isTriangular) {
				xPos -= 0.5;
			}
			xFrac = xPos - Math.floor(xPos);
			xPos -= xFrac;

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
	View.prototype.updateCellLocation = function(/** @type {number} */ mouseX, /** @type {number} */ mouseY) {
		// position relative to display width and height
		var	/** @type {number} */ displayX = mouseX - this.displayWidth / 2,
			/** @type {number} */ displayY = mouseY - this.displayHeight / 2,

			// engine camera x and y
			/** @type {number} */ engineY = this.panY - this.engine.yOff,
			/** @type {number} */ engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

			// engine origin x and y
			/** @type {number} */ originX = this.engine.originX,
			/** @type {number} */ originY = this.engine.originY,

			// cell position
			/** @type {number} */ yPos = 0,
			/** @type {number} */ xPos = 0,
			/** @type {number} */ yFrac = 0,
			/** @type {number} */ xFrac = 0,

			// x and y zoom
			/** @type {number} */ xZoom = this.engine.zoom,
			/** @type {number} */ yZoom = this.engine.getYZoom(this.engine.zoom),

			// rotation
			/** @type {number} */ theta = 0,
			/** @type {number} */ radius = 0;

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

			// compute the y cell coordinate as an integer
			yPos = displayY / yZoom - engineY + originY;
			yFrac = yPos - Math.floor(yPos);
			yPos -= yFrac;

			// compute the x cell coordinate as an integer
			xPos = (displayX / xZoom) + (this.engine.isHex ? (engineY / 2) + (yPos / 2) : 0) - engineX + originX;
			if (this.engine.isTriangular && !this.engine.forceRectangles) {
				xPos -= 0.5;
			}
			xFrac = xPos - Math.floor(xPos);
			xPos -= xFrac;

			// handle hex corners
			if (this.engine.isHex) {
				if (xFrac < 0.25) {
					if (yFrac < 0.1) {
						yPos -= 1;
						xPos -= 1;
					} else {
						if (yFrac >= 0.9) {
							yPos += 1;

						}
					}
				} else {
					if (xFrac >= 0.75) {
						if (yFrac < 0.1) {
							yPos -= 1;
						} else {
							if (yFrac >= 0.9) {
								yPos += 1;
								xPos += 1;
							}
						}
					}
				}
			}
		}

		// adjust for triangular grid
		if (this.engine.isTriangular && !this.engine.forceRectangles) {
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
	View.prototype.drawCellLine = function(/** @type {number} */ startX, /** @type {number} */ startY, /** @type {number} */ endX, /** @type {number} */ endY, /** @type {number} */ colour) {
		var	/** @type {number} */ dx = Math.abs(endX - startX),
			/** @type {number} */ dy = Math.abs(endY - startY),
			/** @type {number} */ sx = (startX < endX) ? 1 : -1,
			/** @type {number} */ sy = (startY < endY) ? 1 : -1,
			/** @type {number} */ err = dx - dy,
			/** @type {number} */ e2 = 0,
			/** @type {number} */ width = this.engine.width,
			/** @type {number} */ height = this.engine.height,

			// whether [R]History state6 changed
			/** @type {number} */ result = 0;

		// set the first point
		result = this.setStateWithUndo(startX, startY, colour, true, true);

		// check for grid growth
		while (width !== this.engine.width || height !== this.engine.height) {
			if (width !== this.engine.width) {
				// double width
				width <<= 1;

				// adjust drawing cell position
				startX += width >> 2;
				endX += width >> 2;

				// update the default x
				this.defaultX += width >> 2;
				this.savedX += width >> 2;

				// check for hex mode  TBD
				if (this.engine.isHex) {
					this.defaultX -= height >> 3;
					this.savedX -= height >> 3;
				}

				// update pan position
				this.panX += width >> 2;
			}

			if (height !== this.engine.height) {
				// same for height
				height <<= 1;
				startY += height >> 2;
				endY += height >> 2;
				this.defaultY += height >> 2;
				this.savedY += height >> 2;
				this.panY += height >> 2;
			}
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
			result |= this.setStateWithUndo(startX, startY, colour, true, true);

			// check for grid growth
			while (width !== this.engine.width || height !== this.engine.height) {
				if (width !== this.engine.width) {
					// double width
					width <<= 1;

					// adjust drawing cell position
					startX += width >> 2;
					endX += width >> 2;

					// update the default x
					this.defaultX += width >> 2;
					this.savedX += width >> 2;

					// check for hex mode  TBD
					if (this.engine.isHex) {
						this.defaultX -= height >> 3;
						this.savedX -= height >> 3;
					}

					// update pan position
					this.panX += width >> 2;
				}

				if (height !== this.engine.height) {
					// same for height
					height <<= 1;
					startY += height >> 2;
					endY += height >> 2;
					this.defaultY += height >> 2;
					this.savedY += height >> 2;
					this.panY += height >> 2;
				}
			}
		}

		// return whether [R]History state6 changed
		return result;
	};

	// set the identify results label positions
	View.prototype.setResultsPosition = function() {
		var	/** @type {number} */ y = 170,
			/** @type {number} */ h = this.identifyCellsLabel.relHeight,
			/** @type {number} */ x = this.identifyCellsLabel.relX,
			/** @type {number} */ xv = this.identifyCellsValueLabel.relX;

		// banner
		this.identifyBannerLabel.setPosition(Menu.north, 0, y - 48);

		// close button at same height as banner
		this.identifyCloseButton.setY(y - 48);

		// cell period map toggle
		this.identifyStrictToggle.setY(y - 48 + 45);

		// save cell period map button
		this.identifySaveCellMapButton.setY(y - 48 + 170);

		// page up and down buttons
		this.identifyPageUpButton.setY(y - 48 + 215);
		this.identifyPageDownButton.setY(y - 48 + 260);

		// cells
		this.identifyCellsLabel.setPosition(Menu.north, x, y);
		this.identifyCellsValueLabel.setPosition(Menu.north, xv, y);
		y += h;

		// active cells
		if (this.lastIdentifyType === "Oscillator") {
			this.identifyActiveLabel.setPosition(Menu.north, x, y);
			this.identifyActiveValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

		// bounding box
		if (!(this.engine.isHex || this.engine.isTriangular)) {
			this.identifyBoxLabel.setPosition(Menu.north, x, y);
			this.identifyBoxValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

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
			if (!(this.engine.isHex || this.engine.isTriangular)) {
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

		if (this.lastIdentifyType !== "Still Life" && (!(this.engine.isRuleTree && this.engine.multiNumStates > 2) || this.engine.isLifeHistory) && !this.engine.altSpecified && this.engine.boundedGridType === -1) {
			// heat
			this.identifyHeatLabel.setPosition(Menu.north, x, y);
			this.identifyHeatValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

		if (this.lastIdentifyType === "Oscillator") {
			if (this.engine.boundedGridType === -1 && (!(this.engine.isRuleTree && this.engine.multiNumStates > 2))) {
				// temperature
				this.identifyTemperatureLabel.setPosition(Menu.north, x, y);
				this.identifyTemperatureValueLabel.setPosition(Menu.north, xv, y);
				y += h;
			}

			// volatility
			this.identifyVolatilityLabel.setPosition(Menu.north, x, y);
			this.identifyVolatilityValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

		if (this.lastIdentifyType === "Still Life") {
			// density
			this.identifyModLabel.setPosition(Menu.north, x, y);
			this.identifyModValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}
	};

	// update step label
	View.prototype.updateStepLabel = function(/** @type {number} */ stepsTaken) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ total = 0;

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
		var	/** @type {number} */ i = 0;

		for (i = 0; i < this.stepSamples.length; i += 1) {
			this.stepSamples[i] = 0;
		}
		this.stepIndex = 0;
		this.stepLabel.deleted = true;
	};

	// get cell distance from the center of the viewpoint
	/** @returns {number} */
	View.prototype.getDistFromCenter = function(/** @type {number} */ x, /** @type {number} */ y) {
		// position relative to display width and height
		var	/** @type {number} */ displayX = 0,
			/** @type {number} */ displayY = 0,

			// engine camera x and y
			/** @type {number} */ engineY = this.panY - this.engine.yOff,
			/** @type {number} */ engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

			// engine origin x and y
			/** @type {number} */ originX = this.engine.originX,
			/** @type {number} */ originY = this.engine.originY,

			// x and y zoom
			/** @type {number} */ xZoom = this.engine.zoom,
			/** @type {number} */ yZoom = this.engine.getYZoom(this.engine.zoom),

			// cell position
			/** @type {number} */ yPos = 0,
			/** @type {number} */ xPos = 0,
			/** @type {number} */ yFrac = 0,
			/** @type {number} */ xFrac = 0,

			// rotation
			/** @type {number} */ theta = 0,
			/** @type {number} */ radius = 0;

		// apply rotation to the display position
		if (this.engine.camAngle !== 0) {
			radius = Math.sqrt((displayX * displayX) + (displayY * displayY));
			theta = Math.atan2(displayY, displayX) * (180 / Math.PI);
			theta -= this.engine.camAngle;
			displayX = radius * Math.cos(theta * (Math.PI / 180));
			displayY = radius * Math.sin(theta * (Math.PI / 180));
		}

		// compute the x and y cell coordinate
		yPos = displayY / yZoom - engineY + originY;
		if ((this.engine.isTriangular && !this.engine.forceRectangles) || this.engine.isHex) {
			yFrac = yPos - Math.floor(yPos);
			yPos -= yFrac;
		}

		xPos = (displayX / xZoom) + (this.engine.isHex ? (engineY / 2) + (yPos / 2) : 0) - engineX + originX;
		if (this.engine.isTriangular && !this.engine.forceRectangles) {
			xPos -= (0.2 * (this.engine.zoom / 32));
		}
		if ((this.engine.isTriangular && !this.engine.forceRectangles) || this.engine.isHex) {
			xFrac = xPos - Math.floor(xPos);
			xPos -= xFrac;
		}

		// handle hex corners
		if (this.engine.isHex) {
			if (xFrac < 0.25) {
				if (yFrac < 0.1) {
					yPos -= 1;
					xPos -= 1;
				} else {
					if (yFrac >= 0.9) {
						yPos += 1;

					}
				}
			} else {
				if (xFrac >= 0.75) {
					if (yFrac < 0.1) {
						yPos -= 1;
					} else {
						if (yFrac >= 0.9) {
							yPos += 1;
							xPos += 1;
						}
					}
				}
			}
		}

		// adjust for triangular grid
		if (this.engine.isTriangular && !this.engine.forceRectangles) {
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
		var	/** @type {number} */ yPos = 0,
			/** @type {number} */ xPos = 0,

			// display strings
			/** @type {string} */ xDisplay = "",
			/** @type {string} */ yDisplay = "",
			/** @type {number} */ stateDisplay = 0,
			/** @type {number} */ rawState = 0,

			// display limit
			/** @type {number} */ displayLimit = this.engine.maxGridSize > 9999 ? 99999 : 9999,

			// bounded grid top left
			/** @type {number} */ boxOffset = (this.engine.isMargolus ? -1 : 0),
			/** @type {number} */ leftX = Math.round((-this.engine.boundedGridWidth) / 2) + boxOffset,
			/** @type {number} */ bottomY = Math.round((-this.engine.boundedGridHeight) / 2) + boxOffset,

			// bounded grid bottom right
			/** @type {number} */ rightX = leftX + this.engine.boundedGridWidth - 1,
			/** @type {number} */ topY = bottomY + this.engine.boundedGridHeight - 1;

		// check if there are mouse coordinates
		if (this.viewMenu.mouseX === -1) {
			// no coordinates to display
			this.xyLabel.preText = "";

			// delete label if generation statistics are hidden
			this.xyLabel.deleted = !this.statsOn;
		} else {
			// update cell location from mouse position
			this.updateCellLocation(this.viewMenu.mouseX, this.viewMenu.mouseY);

			// read the state
			stateDisplay = this.engine.getState(this.cellX, this.cellY, this.multiStateView && this.viewOnly);
			rawState = this.engine.getState(this.cellX, this.cellY, true);

			// add the offset to display coordinates
			xPos = this.cellX - this.panX + this.xOffset;
			yPos = this.cellY - this.panY + this.yOffset;
			if (this.engine.boundedGridType !== -1 && !this.posDefined) {
				xPos -= Math.floor(this.patternWidth / 2 + (this.specifiedWidth - this.patternWidth) / 2);
				yPos -= Math.floor(this.patternHeight / 2 + (this.specifiedHeight - this.patternHeight) / 2);
			}

			// check the size of the coordinates
			if (xPos < -displayLimit || xPos > displayLimit) {
				xDisplay = (Number(xPos / 1000).toFixed(1)) + "K";
			} else {
				xDisplay = String(xPos);
			}
			if (yPos < -displayLimit || yPos > displayLimit) {
				if (this.yUp) {
					yDisplay = (Number(-yPos / 1000).toFixed(1)) + "K";
				} else {
					yDisplay = (Number(yPos / 1000).toFixed(1)) + "K";
				}
			} else {
				if (this.yUp) {
					yDisplay = String(-yPos);
				} else {
					yDisplay = String(yPos);
				}
			}

			// set the caption
			if (this.engine.boundedGridType !== -1) {
				if (this.engine.boundedGridWidth === 0) {
					leftX = -this.engine.maxGridSize;
					rightX = this.engine.maxGridSize;
				}
				if (this.engine.boundedGridHeight === 0) {
					bottomY = -this.engine.maxGridSize;
					topY = this.engine.maxGridSize;
				}
				if (xPos < leftX || xPos > rightX || yPos < bottomY || yPos > topY) {
					if (((xPos === leftX - 1 || xPos === rightX + 1) && (yPos >= bottomY - 1 && yPos <= topY + 1)) ||
						((yPos === bottomY - 1 || yPos === topY + 1) && (xPos >= leftX -1 && xPos <= rightX + 1))) {
						this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + "[bounded]";
						if (this.stateNumberDisplayed) {
							this.xyLabel.preText += " " + String(rawState);
						}
					} else {
						this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + "[boundary]";
					}
				} else {
					this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + stateDisplay + " (" + this.getStateName(stateDisplay) + ")";
					if (this.stateNumberDisplayed) {
						this.xyLabel.preText += " " + String(rawState);
					}
				}
			} else {
				// compute the grid extent
				leftX = -(this.engine.maxGridSize - this.patternWidth) >> 1;
				rightX = leftX + this.engine.maxGridSize - 1;
				bottomY = -(this.engine.maxGridSize - this.patternHeight) >> 1;
				topY = bottomY + this.engine.maxGridSize - 1;

				// display the state
				if (xPos < leftX || xPos > rightX || yPos < bottomY || yPos > topY) {
					this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + "[boundary]";
					if (this.stateNumberDisplayed) {
						this.xyLabel.preText += " " + String(rawState);
					}
				} else {
					this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + stateDisplay + " (" + this.getStateName(stateDisplay) + ")";
					if (this.stateNumberDisplayed) {
						this.xyLabel.preText += " " + String(rawState);
					}
				}
			}
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

		// draw selection size
		if ((this.isSelection || this.drawingSelection) && (!this.displayHelp || this.displayErrors)) {
			this.selSizeLabel.enabled = true;
			this.selSizeLabel.deleted = false;
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
	View.prototype.processMouseWheel = function(/** @type {number} */ mouseZoom) {
		var	/** @type {number} */ zoomValue = 0;

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
					if (!(this.controlsLocked || this.zoomItem.locked)) {
						zoomValue = this.zoomItem.current[0];
						mouseZoom = (mouseZoom / 125) * 0.05;
						this.adjustZoomPosition(zoomValue, mouseZoom);
					}
				}
			}
		}
	};

	// draw state icons callback (when in Draw mode)
	View.prototype.renderStateIcons = function(/** @type {View} */ me) {
		var	/** @type {CanvasRenderingContext2D} */ ctx = me.mainContext,
			/** @type {number} */ i = 0,
			/** @type {number} */ xScale = me.viewMenu.xScale,
			/** @type {number} */ yScale = me.viewMenu.yScale,
			/** @type {MenuItem} */ list = me.stateColsList,
			/** @type {number} */ x = list.x,
			/** @type {number} */ y = list.y,
			/** @type {number} */ height = list.relHeight,
			/** @type {number} */ width = list.relWidth,
			/** @type {number} */ yPos = 0,
			/** @type {HTMLCanvasElement} */ iconCanvas = me.engine.cellIconCanvas31,
			/** @type {number} */ iconSize = 0;

		// check if icons are available
		if (iconCanvas !== null && me.useIcons) {
			ctx.imageSmoothingEnabled = true;
			iconSize = iconCanvas.width;

			// draw the icon for each displayed state
			for (i = 0; i < me.maxDisplayStates; i += 1) {
				// find the icon in the canvas
				yPos = (i + me.startState - 1) * iconSize;
				if (yPos >= 0 && yPos < iconCanvas.height) {
					ctx.drawImage(iconCanvas, 0, yPos, iconSize, iconSize, (i * (width / me.maxDisplayStates) * xScale + x), y, height * xScale, height * yScale);
				}
			}

			ctx.imageSmoothingEnabled = false;
		}
	};

	// update generation counter label
	View.prototype.updateGenerationLabel = function(/** @type {View} */ me) {
		var	/** @type {number} */ counter = me.engine.counter,
			/** @type {string} */ separator = " ";

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

		// update generation labels
		if (!me.genRelative) {
			counter += me.genOffset;
			if (counter >= 1000000000) {
				me.genValueLabel.preText = "1B+";
			} else {
				me.genValueLabel.preText = String(counter);
			}
			me.genValueLabel.toolTip = "absolute generation " + counter;
		} else {
			if (me.engine.isMargolus || me.engine.isPCA) {
				counter = me.engine.counter;
			}
			if (counter >= 1000000000) {
				me.genValueLabel.preText = "1B+";
			} else {
				me.genValueLabel.preText = String(counter);
			}
			me.genValueLabel.preText = String(counter);
			me.genValueLabel.toolTip = "generation " + counter;
		}
		me.genLabel.toolTip = me.genValueLabel.toolTip;
	};

	// check if Life has ended (including any future PASTE commands)
	/** @returns {boolean} */
	View.prototype.lifeEnded = function() {
		return this.justDied && (!(this.pasteEvery || this.engine.counter <= this.maxPasteGen));
	};

	// update view mode for normal processing
	View.prototype.viewAnimateNormal = function(/** @type {number} */ timeSinceLastUpdate, /** @type {View} */ me) {
		// get the current time and mouse wheel
		var	/** @type {number} */ deltaTime = 0,
			/** @type {number} */ currentTime = 0,
			/** @type {Waypoint} */ currentWaypoint = me.waypointManager.current,
			/** @type {number} */ i = 0,

			// whether update needed
			/** @type {boolean} */ updateNeeded = false,

			// whether frame budget exceeded (machine too slow)
			/** @type {boolean} */ tooSlow = false,

			// whether at end of waypoints
			/** @type {boolean} */ waypointsEnded = false,

			// whether bailing out of stepping
			/** @type {boolean} */ bailout = false,

			// whether manual stepping (so ignore bailout)
			/** @type {boolean} */ manualStepping = false,

			// how many steps to take
			/** @type {number} */ stepsToTake = 1,

			// many many steps taken
			/** @type {number} */ stepsTaken = 0,

			// current and target generations
			/** @type {number} */ currentGen = me.engine.counter,
			/** @type {number} */ targetGen = 0,

			// frame target time in ms
			/** @type {number} */ frameTargetTime = (1000 / me.refreshRate),

			// flag if Life was empty before step started
			/** @type {boolean} */ wasEmpty = false;

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

		// enable stats if pending
		if (me.pendingStatsOn) {
			me.genToggle.current = me.viewStats([true], true, me);
			me.pendingStatsOn = false;
			me.menuManager.toggleRequired = true;
		}

		// copy gens per step from control since it gets overwritten by waypoint playback
		me.setPlaybackFromIndex(me.speedRange.current[0]);

		// update elapsed time if not paused
		if (me.generationOn) {
			// check if actual interval (in ms) is greater than frame budget
			if (timeSinceLastUpdate > frameTargetTime) {
				// flag machine too slow
				if (timeSinceLastUpdate - 0.3 > frameTargetTime) {
					tooSlow = true;
				}

				// cap to frame rate
				timeSinceLastUpdate = frameTargetTime;
			}

			// update fixed point counters
			if (me.generationOn && !(me.waypointsDefined && !me.waypointsDisabled)) {
				me.fixedPointCounter += me.genSpeed * me.gensPerStep;
				targetGen = (me.fixedPointCounter / me.refreshRate) | 0;
				if (targetGen > currentGen) {
					me.nextStep = true;
				} else {
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
					me.fixedPointCounter += me.refreshRate;
				} else {
					me.fixedPointCounter += me.gensPerStep * me.refreshRate;
				}
				targetGen = (me.fixedPointCounter / me.refreshRate) | 0;
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
					me.elapsedTime = me.waypointManager.createTemporaryPosition(me.engine.width / 2 - me.engine.xOff, me.engine.height / 2 - me.engine.yOff, me.engine.zoom, me.engine.angle, me.engine.tilt, me.engine.layers, me.engine.layerDepth * ViewConstants.depthScale, me.engine.colourTheme, me.genSpeed, me.gensPerStep, me.engine.counter, me.elapsedTime);
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
			waypointsEnded = me.waypointManager.update(me, me.elapsedTime + timeSinceLastUpdate, me.engine.counter, true);

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
				me.fixedPointCounter += me.genSpeed * me.gensPerStep;
				targetGen = (me.fixedPointCounter / me.refreshRate) | 0;
				if (targetGen > currentGen) {
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
					if (!(me.engine.isHex || me.engine.isTriangular || me.engine.isNone)) {
						me.engine.angle = currentWaypoint.angle;
						if (me.angleItem) {
							me.angleItem.current = [me.engine.angle, me.engine.angle];
						}

						// set tilt and update tilt control
						me.engine.tilt = currentWaypoint.tilt;
						if (me.tiltItem) {
							me.tiltItem.current = [me.convertFromTilt(me.engine.tilt), me.engine.tilt];
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
				}

				// set gps and step
				me.genSpeed = currentWaypoint.gps;
				me.gensPerStep = currentWaypoint.step;
				me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);

				// set stars TBD
				//me.starsOn = currentWaypoint.stars;

				// set grid TBD
				//me.engine.displayGrid = currentWaypoint.grid; 

				// if waypoints not ended then work out whether to step to next generation
				if (currentWaypoint.targetGen > me.engine.counter) {
					me.nextStep = true;
					me.fixedPointCounter = currentWaypoint.targetGen * me.refreshRate;
					targetGen = (me.fixedPointCounter / me.refreshRate) | 0;
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
						me.menuManager.notification.notify(ScriptParser.substituteVariables(me, currentWaypoint.textMessage), 15, 21600, 15, false);
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
			// get current time
			currentTime = performance.now();

			// compute how many steps there are to take
			stepsToTake = targetGen - currentGen;
			stepsTaken = 0;

			// check if Life was already dead before steps started
			wasEmpty = me.lifeEnded();

			// check if statistics are displayed and if so compute them
			while (!bailout && (me.engine.counter < targetGen)) {
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

				// compute next generation
				me.computeNextGeneration();

				// next step
				stepsTaken += 1;

				// check for loop
				if ((me.loopGeneration !== -1) && (me.engine.counter >= me.loopGeneration) && !me.loopDisabled) {
					// save elapsed time up to the loop generation
					for (i = 1; i <= stepsTaken; i += 1) {
						me.saveElapsedTime(currentGen + i, timeSinceLastUpdate, stepsTaken);
					}

					// reset
					me.elapsedTime = 0;
					me.reset(me);
					currentGen = 0;
					targetGen = 0;

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

				// bail out if all cells died unless they were already dead before step started
				if (me.lifeEnded() && !wasEmpty) {
					bailout = true;
				}
			}

			// save elapsed time for each step actually taken
			for (i = 1; i <= stepsTaken; i += 1) {
				// add the time increment as if all steps could be taken (time will slow when throttled)
				me.saveElapsedTime(currentGen + i, timeSinceLastUpdate, stepsToTake);
			}

			// check if life just stopped
			if (me.lifeEnded()) {
				// remember the generation that life stopped
				if (me.diedGeneration === -1) {
					me.diedGeneration = me.engine.counter;

					// notify simulation stopped unless loop defined and enabled
					if (me.genNotifications && !(me.loopGeneration !== -1 && !me.loopDisabled)) {
						if (me.engine.isPCA || me.engine.isMargolus) {
							me.menuManager.notification.notify("Life ended at generation " + (me.engine.counterMargolus + me.genOffset), 15, 600, 15, false);
						} else {
							me.menuManager.notification.notify("Life ended at generation " + (me.engine.counter + me.genOffset), 15, 600, 15, false);
						}
					}

					// stop the simulation unless the pattern was empty and this is after step 1 or looping
					if (!wasEmpty && !(me.loopGeneration !== -1 && !me.loopDisabled)) {
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					}
				}
			}

			// remove steps not taken from target counter
			me.fixedPointCounter -= (stepsToTake - stepsTaken) * me.refreshRate;
			if (me.fixedPointCounter < 0) {
				me.fixedPointCounter = 0;
			}

			// if not enough steps taken then display actual number
			if ((stepsTaken < stepsToTake) && ((me.engine.counter !== me.stopGeneration) || me.stopDisabled) && me.perfWarning) {
				me.updateStepLabel(stepsTaken);
			} else {
				me.clearStepSamples();
			}

			// check for stop
			if (me.engine.counter === me.stopGeneration && !me.stopDisabled) {
				// stop
				me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);

				if (this.autoFit) {
					me.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
				}

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
		me.angleItem.locked = (me.controlsLocked && me.waypointsDefined) || me.engine.isHex || me.engine.isTriangular || me.engine.isNone;
		me.tiltItem.locked = (me.controlsLocked && me.waypointsDefined) || me.engine.isHex || me.engine.isTriangular || me.engine.isNone;
		me.autoFitToggle.locked = me.controlsLocked && me.waypointsDefined;
		me.fitButton.locked = me.controlsLocked || (me.autoFit && me.generationOn);
		me.speedRange.locked = me.controlsLocked && me.waypointsDefined;
		me.speed1Button.locked = me.controlsLocked && me.waypointsDefined;
		me.themeButton.locked = me.controlsLocked && me.waypointsDefined;
		me.zoomItem.locked = me.controlsLocked || me.autoFit;
		me.layersItem.locked = (me.controlsLocked && me.waypointsDefined) || me.engine.isHex || me.engine.isTriangular || me.engine.isNone;
		me.depthItem.locked = (me.controlsLocked && me.waypointsDefined) || me.engine.isHex || me.engine.isTriangular || me.engine.isNone;
		me.snapToNearest45Button.locked = me.engine.isHex || me.engine.isTriangular || me.engine.isNone;

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
	View.prototype.renderWorld = function(/** @type {View} */ me, /** @type {boolean} */ tooSlow, /** @type {number} */ deltaTime, /** @type {boolean} */ manualStepping) {
		var	/** @type {number} */ saveTheme = me.engine.colourTheme,
			/** @type {boolean} */ saveMajor = me.engine.gridLineMajorEnabled,
			/** @type {boolean} */ saveDisplayGrid = me.engine.displayGrid,
			/** @type {number} */ saveZoom = me.engine.zoom;

		// check for autofit
		if (me.autoFit && me.generationOn) {
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

		// draw grid (disable tilt if selection displayed)
		me.engine.drawGrid((!(this.isSelection || this.drawingSelection || this.isPasting || me.modeList.current !== ViewConstants.modePan)));

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

			if (me.screenShotScheduled === 3) {
				// draw grid in black and white with grid lines
				me.engine.setTheme(6, 0, me);
				me.engine.colourChange = 1;
				me.engine.displayGrid = true;
				me.engine.gridLineMajorEnabled = false;
				me.engine.createPixelColours(1);

				// ensure integer zoom
				me.engine.zoom = me.engine.zoom | 0;

				me.engine.renderGrid(false, false);
				me.engine.drawGrid((!(this.isSelection || this.drawingSelection || this.isPasting || me.modeList.current !== ViewConstants.modePan)));

				// check if hexagons or triangles should be drawn
				if (!me.engine.forceRectangles && me.engine.isHex && me.engine.zoom >= 4) {
					me.engine.drawHexagons();
				} else {
					if (!me.engine.forceRectangles && me.engine.isTriangular && me.engine.zoom >= 4) {
						me.engine.drawTriangles();
					}
				}
			}

			// capture screen shot
			me.captureScreenShot(me);

			// restore saved them if black and white capture happened
			if (me.screenShotScheduled === 3) {
				me.engine.setTheme(saveTheme, 0, me);
				me.engine.colourChange = 1;
				me.engine.displayGrid = saveDisplayGrid;
				me.engine.gridLineMajorEnabled = saveMajor;
				me.engine.createPixelColours(1);

				me.engine.zoom = saveZoom;
				me.engine.renderGrid(me.drawingSnow, me.starsOn);

				// draw stars if switched on
				if (me.starsOn) {
					me.drawStars();
				}
			}

			// check for grid capture or black and white capture
			if (me.screenShotScheduled >= 2) {
				// restore grid (disable tilt if selection displayed)
				me.engine.drawGrid((!(this.isSelection || this.drawingSelection || this.isPasting || me.modeList.current !== ViewConstants.modePan)));

				// check if hexagons or triangles should be drawn
				if (!me.engine.forceRectangles && me.engine.isHex && me.engine.zoom >= 4) {
					me.engine.drawHexagons();
				} else {
					if (!me.engine.forceRectangles && me.engine.isTriangular && me.engine.zoom >= 4) {
						me.engine.drawTriangles();
					}
				}
			}

			// mark screenshot complete
			me.screenShotScheduled = 0;
		}

		// draw any selections
		me.engine.drawSelections(me);

		// check if grid buffer needs to grow
		if (me.engine.counter && me.engine.population > 0) {
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

		// draw cell period map or table
		if (me.resultsDisplayed && me.periodMapDisplayed > 0 && me.engine.cellPeriod !== null) {
			// don't display if Help, Errors or Settings open
			if (me.displayHelp === 0 && me.displayErrors === 0 && me.navToggle.current[0] === false) {
				if (me.periodMapDisplayed === 1) {
					// draw cell period table below the main banner
					me.engine.drawCellPeriodTable(me.identifyBannerLabel);
				} else {
					// draw cell period map
					me.engine.drawCellPeriodMap(me.identifyBannerLabel);
				}
			}
		}

		// display help if requested
		if (me.displayHelp) {
			Help.drawHelpText(me);
		} else {
			// display script errors if present
			if (me.displayErrors) {
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
			if (me.engine.isPCA) {
				me.birthsValue.preText = (((me.engine.population * 25) / (me.engine.boundedGridHeight * me.engine.boundedGridWidth)) | 0) + "%";
			} else {
				me.birthsValue.preText = (((me.engine.population * 100) / (me.engine.boundedGridHeight * me.engine.boundedGridWidth)) | 0) + "%";
			}
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
			if (me.engine.isPCA) {
				me.birthsValue.toolTip = "density " + (((me.engine.population * 25) / (me.engine.boundedGridHeight * me.engine.boundedGridWidth)) | 0) + "%";
			} else {
				me.birthsValue.toolTip = "density " + (((me.engine.population * 100) / (me.engine.boundedGridHeight * me.engine.boundedGridWidth)) | 0) + "%";
			}
		} else {
			// show births and deaths
			me.birthsValue.toolTip = "births " + me.engine.births;
			me.deathsValue.toolTip = "deaths " + me.engine.deaths;
		}

		// update gps and step control background based on performance if enabled
		if (me.perfWarning) {
			me.updateControlBackgrounds(deltaTime, tooSlow, manualStepping, me);
		} else {
			me.speedRange.bgCol = me.fitButton.bgCol;
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
		me.updateUIForHelp(me.displayHelp !== 0 || me.displayErrors !== 0);

		// dim display if settings displayed
		if (me.navToggle.current[0] && !(me.hideGUI && me.generationOn)) {
			me.mainContext.globalAlpha = 0.7;
			me.mainContext.fillStyle = me.menuManager.bgCol;
			me.mainContext.fillRect(0, 0, me.mainCanvas.width, me.mainCanvas.height);
			me.mainContext.globalAlpha = 1;
		}
	};

	// update GPS and Step control background based on performance
	View.prototype.updateControlBackgrounds = function(/** @type {number} */ deltaTime, /** @type {boolean} */ tooSlow, /** @type {boolean} */ manualStepping, /** @type {View} */ me) {
		var	/** @type {number} */ red = 0,
			/** @type {number} */ green = 0,
			/** @type {number} */ blue = 0,
			/** @type {number} */ errorRed = 255,
			/** @type {number} */ errorGreen = 48,
			/** @type {number} */ errorBlue = 48,
			/** @type {number} */ mixWeight = 0,
			/** @type {string} */ controlColour;

		// check for frame skip or STEP skip
		if ((tooSlow || deltaTime > ViewConstants.updateThreshold) && !manualStepping) {
			// ramp the red colour up
			if (me.perfStep < ViewConstants.perfMax) {
				me.perfStep += 1;
			}
		} else {
			// ramp the red colour down
			if (me.perfStep > ViewConstants.perfMin) {
				me.perfStep -= 1;
			}
		}

		// get the blend amount
		mixWeight = me.perfStep / (ViewConstants.perfMax - ViewConstants.perfMin);

		// get the UI background colour
		red = me.uiBackgroundRGB >> 16;
		green = (me.uiBackgroundRGB >> 8) & 255;
		blue = me.uiBackgroundRGB & 255;

		// get the error colour
		if (me.customErrorColour) {
			errorRed = me.customErrorColour[0];
			errorGreen = me.customErrorColour[1];
			errorBlue = me.customErrorColour[2];
		}

		// blend the colours
		red = (errorRed * mixWeight + red * (1 - mixWeight)) | 0;
		green = (errorGreen * mixWeight + green * (1 - mixWeight)) | 0;
		blue = (errorBlue * mixWeight + blue * (1 - mixWeight)) | 0;

		// set the background on the generation and step UI controls
		controlColour = "rgb(" + red + "," + green + "," + blue + ")";
		me.speedRange.bgCol = controlColour;
	};

	// set stats label positions
	View.prototype.setStatsLabelPositions = function() {
		var	/** @type {number} */ topY = this.genLabel.relY,
			/** @type {number} */ midY = this.elapsedTimeLabel.relY,
			/** @type {number} */ lowY = this.xyLabel.relY;

		if (this.birthsLabel.deleted && this.deathsLabel.deleted) {
			// only population displayed so put at bottom
			this.popLabel.setY(lowY);
			this.popValue.setY(lowY);
		} else {
			if (this.deathsLabel.deleted) {
				// population and births displayed
				this.popLabel.setY(midY);
				this.popValue.setY(midY);
				this.birthsLabel.setY(lowY);
				this.birthsValue.setY(lowY);
			} else {
				// population, births and deaths displayed
				this.popLabel.setY(topY);
				this.popValue.setY(topY);
				this.birthsLabel.setY(midY);
				this.birthsValue.setY(midY);
				this.deathsLabel.setY(lowY);
				this.deathsValue.setY(lowY);
			}
		}
	};

	// update origin
	View.prototype.updateOrigin = function() {
		// initial zoom at T=0
		var	/** @type {number} */ initialZoom = 0,

			// current zoom now
			/** @type {number} */ currentZoom = 0,

			// origin offset
			/** @type {number} */ originCounter = this.fixedPointCounter / this.refreshRate;

		// check if track defined
		if (this.trackDefined && !this.trackDisabled) {
			// compute origin
			this.engine.originX = originCounter * (this.trackBoxE + this.trackBoxW) / 2;
			this.engine.originY = originCounter * (this.trackBoxN + this.trackBoxS) / 2;

			// compute initial zoom
			initialZoom = this.engine.zoomAt(0, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.displayWidth, this.displayHeight - 80, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor);
			currentZoom = this.engine.zoomAt(originCounter, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.displayWidth, this.displayHeight - 80, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor);
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
	View.prototype.updateUIForHelp = function(/** @type {boolean} */ hide) {
		var	/** @type {boolean} */ showTopicButtons = !(this.displayHelp && (this.helpTopic === ViewConstants.welcomeTopic)),
			/** @type {number} */ i = 0,
			/** @type {number} */ value = 0,
			/** @type {Array<string>} */ captions = [],
			/** @type {Array<string>} */ toolTips = [],
			/** @type {boolean} */ settingsMenuOpen = this.navToggle.current[0],
			/** @type {boolean} */ shown = false;

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
				this.themeSelections[i].locked = !(this.customTheme || this.customGridMajor || this.customGridColour !== -1 || this.customGridMajorColour !== -1);
			}
		}

		// identify close button
		shown = hide || !this.resultsDisplayed || (this.lastIdentifyType === "Empty") || (this.lastIdentifyType === "none") || settingsMenuOpen;
		this.identifyCloseButton.deleted = hide || !this.resultsDisplayed || settingsMenuOpen;

		// identify cell period display and save buttons
		this.identifyStrictToggle.deleted = hide || !this.resultsDisplayed || this.engine.cellPeriod === null || settingsMenuOpen;
		this.identifySaveCellMapButton.deleted = hide || !this.resultsDisplayed || this.engine.cellPeriod === null || settingsMenuOpen;

		// identify results
		shown = shown || this.periodMapDisplayed === 2;
		this.identifyBannerLabel.deleted = shown;
		shown = shown || this.periodMapDisplayed > 0;
		this.identifyCellsLabel.deleted = shown;
		this.identifyBoxLabel.deleted = shown || (this.engine.isHex || this.engine.isTriangular);
		this.identifyDirectionLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifyPeriodLabel.deleted = shown || (this.lastIdentifyType === "Still Life");
		this.identifyModLabel.deleted = shown || (this.engine.isHex || this.engine.isTriangular);
		this.identifyActiveLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator");
		this.identifySlopeLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifySpeedLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship");
		this.identifyHeatLabel.deleted = shown || (this.lastIdentifyType === "Still Life") || (this.engine.altSpecified || (this.engine.isRuleTree && this.engine.multiNumStates > 2)) || (this.engine.boundedGridType !== -1);
		this.identifyTemperatureLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || (this.engine.boundedGridType !== -1) || (this.engine.isRuleTree && this.engine.multiNumStates > 2);
		this.identifyVolatilityLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator");
		this.identifyCellsValueLabel.deleted = shown;
		this.identifyBoxValueLabel.deleted = shown || (this.engine.isHex || this.engine.isTriangular);
		this.identifyDirectionValueLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifyPeriodValueLabel.deleted = shown || (this.lastIdentifyType === "Still Life");
		this.identifyModValueLabel.deleted = shown || (this.engine.isHex || this.engine.isTriangular);
		this.identifyActiveValueLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator");
		this.identifySlopeValueLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifySpeedValueLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship");
		this.identifyHeatValueLabel.deleted = shown || (this.lastIdentifyType === "Still Life") || this.engine.altSpecified || (this.engine.boundedGridType !== -1) || (this.engine.isRuleTree && this.engine.multiNumStates > 2);
		this.identifyTemperatureValueLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || (this.engine.boundedGridType !== -1) || (this.engine.isRuleTree && this.engine.multiNumStates > 2);
		this.identifyVolatilityValueLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator");

		// identify page up and down buttons
		shown = hide || !this.resultsDisplayed || (this.periodMapDisplayed !== 1 || this.engine.tableMaxRow === 0 || settingsMenuOpen);
		this.identifyPageUpButton.deleted = shown;
		this.identifyPageDownButton.deleted = shown;

		// lock page up and down buttons
		this.identifyPageUpButton.locked = (this.engine.tableStartRow === 0);
		this.identifyPageDownButton.locked = (this.engine.tableStartRow === this.engine.tableMaxRow);

		// undo and redo buttons
		this.redoButton.locked = (this.editNum === this.numEdits);
		this.undoButton.locked = (this.editNum <= 1 || this.undoButton.toolTip === "undo [" + this.controlKeyText + " Z]");

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
		this.iconToggle.deleted = hide;

		// graph controls
		shown = hide || !this.popGraph || this.drawing || this.selecting || settingsMenuOpen;
		this.opacityItem.deleted = shown;
		this.graphCloseButton.deleted = shown;
		this.linesToggle.deleted = shown;
		this.graphDataToggle.deleted = shown || (this.engine.boundedGridType !== -1);

		// cancel button
		this.cancelButton.deleted = !((this.identify && this.engine.identifyDeferredCounter === -1) || this.startFrom !== -1);
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

		// set stats label positions
		this.setStatsLabelPositions();

		this.fitButton.deleted = hide;
		this.shrinkButton.deleted = hide || !this.thumbnailEverOn;
		this.escButton.deleted = !this.isInPopup;

		if (this.showDisplaySettings || this.showClipboardSettings || this.showInfoSettings || this.showPatternSettings || this.showPlaybackSettings || this.showThemeSelection || this.showActionsSettings) {
			this.backButton.preText = "Back";
			this.backButton.toolTip = "back to previous menu [Backspace]";
		} else {
			this.backButton.preText = "Close";
			this.backButton.toolTip = "close menu [Backspace]";
		}

		this.altGridButton.locked = !(this.engine.isMargolus && this.engine.gridLineMajor === 2);
		if (this.altGridButton.locked) {
			this.altGridButton.current = [false];
		} else {
			this.altGridButton.current = [this.engine.altGrid];
		}

		// settings menu
		this.backButton.deleted = hide;
		shown = hide || this.showThemeSelection;
		this.depthItem.deleted = shown;
		this.angleItem.deleted = shown;
		this.tiltItem.deleted = shown;
		this.layersItem.deleted = shown;

		// setting category buttons
		shown = hide || this.showThemeSelection || this.showClipboardSettings || this.showPatternSettings || this.showDisplaySettings || this.showInfoSettings || this.showPlaybackSettings || this.showPatternSettings || this.showActionsSettings;
		this.patternButton.deleted = shown;
		this.clipboardButton.deleted = shown;
		this.themeButton.deleted = shown;
		this.infoButton.deleted = shown;
		this.displayButton.deleted = shown;
		this.actionsButton.deleted = shown;
		this.playbackButton.deleted = shown;
		this.graphButton.deleted = shown;

		// clipboard category
		shown = hide || !this.showClipboardSettings;
		this.openClipboardButton.deleted = shown;
		this.copyOriginalButton.deleted = shown;
		this.copyRuleButton.deleted = shown;
		this.copyAsMAPButton.deleted = shown;
		this.copyNeighbourhoodButton.deleted = shown;
		this.pasteToSelectionButton.deleted = shown;
		this.copySyncToggle.deleted = shown;
		this.copyWithCommentsButton.deleted = shown;
		this.copyPositionButton.deleted = shown;
		this.copyViewButton.deleted = shown;

		// pattern category
		shown = hide || !this.showPatternSettings;
		this.ruleButton.deleted = shown;
		this.saveButton.deleted = shown;
		this.newButton.deleted = shown;
		this.loadButton.deleted = shown;
		this.randomizeButton.deleted = shown;
		this.randomizePatternButton.deleted = shown;
		this.identifyButton.deleted = shown;
		this.lastIdentifyResultsButton.deleted = shown;
		this.saveImageButton.deleted = shown;
		this.saveGraphButton.deleted = shown;

		// advanced category
		shown = hide || !this.showInfoSettings;
		this.fpsButton.deleted = shown;
		this.timingDetailButton.deleted = shown;
		this.relativeToggle.deleted = shown;
		this.relativeToggle.locked = !this.genDefined;
		this.stopAllButton.deleted = shown;
		this.stopOthersButton.deleted = shown;
		this.resetAllButton.deleted = shown;
		this.infoBarButton.deleted = shown;
		this.fastLookupButton.deleted = shown;
		this.fastLookupButton.locked = !this.engine.isRuleTree || (this.engine.isRuleTree && !this.engine.ruleLoaderLookupAvailable());
		this.stateNumberButton.deleted = shown;
		this.yDirectionButton.deleted = shown;

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
		this.qualityToggle.deleted = shown;
		this.integerZoomButton.deleted = shown;

		// general categroy
		shown = hide || !this.showActionsSettings;
		this.centerPatternButton.deleted = shown;
		this.clearDrawingStateButton.deleted = shown;
		this.snapToNearest45Button.deleted = shown;
		this.saveViewButton.deleted = shown;
		this.restoreViewButton.deleted = shown;
		this.fitSelectionButton.deleted = shown;

		// playback category
		shown = hide || !this.showPlaybackSettings;
		this.goToGenButton.deleted = shown;
		this.historyFitButton.deleted = shown;
		this.throttleToggle.deleted = shown;
		this.showLagToggle.deleted = shown;
		this.killButton.deleted = shown;
		this.autoHideButton.deleted = shown;

		// lock buttons depending on rule
		shown = this.engine.isNone || !this.executable;
		this.randomizeButton.locked = shown || this.engine.isRuleTree;
		this.randomizePatternButton.locked = shown;
		this.identifyButton.locked = shown || this.viewOnly || this.engine.HROT.useRandom || (this.engine.boundedGridType !== -1 && (this.engine.boundedGridWidth === 0 || this.engine.boundedGridHeight === 0)) || this.engine.altSpecified;
		this.lastIdentifyResultsButton.locked = shown || this.viewOnly || this.lastIdentifyType === "Empty" || this.lastIdentifyType === "none" || this.lastIdentifyType === "";
		this.copyRuleButton.locked = shown;
		this.copyAsMAPButton.locked = shown || !(this.engine.isRuleTree && this.engine.multiNumStates === 2 && !this.engine.ruleTableB0 && !(this.engine.ruleTableOutput && this.engine.ruleTableNeighbourhood === PatternConstants.ruleTableOneD));
		this.copyNeighbourhoodButton.locked = shown;
		this.copyWithCommentsButton.locked = shown;
		this.pasteToSelectionButton.locked = shown || (this.pasteBuffers[this.currentPasteBuffer] === null);
		this.goToGenButton.locked = !this.executable || this.viewOnly;
		this.rainbowButton.locked = (this.engine.multiNumStates > 2 || this.engine.isHROT || this.engine.isPCA || this.engine.isLifeHistory || this.engine.isSuper || this.engine.isExtended || this.engine.isRuleTree);
		this.saveButton.locked = shown;
		this.fitSelectionButton.locked = shown;

		// set theme section label text
		this.themeSectionLabel.deleted = hide || !(this.showDisplaySettings || this.showClipboardSettings || this.showInfoSettings || this.showPlaybackSettings || this.showPatternSettings || this.showActionsSettings) || this.displayHeight < ViewConstants.preferredMenuHeight;
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
						if (this.showClipboardSettings) {
							this.themeSectionLabel.preText = "Clipboard";
						} else {
							if (this.showActionsSettings) {
								this.themeSectionLabel.preText = "General";
							} else {
								this.themeSectionLabel.preText = "";
							}
						}
					}
				}
			}
		}

		// lock kill button if not 2-state moore
		this.killButton.locked = (this.engine.wolframRule !== -1) || this.engine.patternDisplayMode || (this.engine.isHROT && this.engine.HROT.xrange > 1) || this.engine.isTriangular || this.engine.isVonNeumann || this.engine.isHex || this.engine.boundedGridType !== -1 || this.engine.isMargolus || this.engine.multiNumStates > 2 || this.engine.isRuleTree;
		if (this.killButton.locked) {
			this.killButton.current = [false];
		}

		// lock theme button if mode doesn't support themes
		this.themeButton.locked = this.multiStateView || this.engine.isNone || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended;

		// lock major button if hex or triangular grid
		this.majorButton.locked = this.engine.isHex || this.engine.isTriangular || this.engine.gridLineMajor === 0;

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

		// close errors button
		this.closeErrorsButton.deleted = (this.displayErrors === 0 || this.displayHelp !== 0);

		// help done button
		this.doneButton.deleted = !(this.chromeBug && this.displayHelp && this.helpTopic === ViewConstants.welcomeTopic);

		// help topics
		this.topicsButton.deleted = !(this.displayHelp && (this.helpTopic !== ViewConstants.welcomeTopic));
		this.helpSectionList.deleted = (!(this.displayHelp && (this.helpTopic !== ViewConstants.welcomeTopic))) || !this.showSections;

		// help individual topics buttons
		this.helpKeysButton.deleted = showTopicButtons;
		this.helpScriptsButton.deleted = showTopicButtons;
		this.helpInfoButton.deleted = showTopicButtons;
		this.helpThemesButton.deleted = showTopicButtons || (this.engine.isNone || this.engine.isSuper || this.engine.isExtended || this.engine.isRuleTree);
		this.helpColoursButton.deleted = showTopicButtons;
		this.helpAliasesButton.deleted = showTopicButtons;
		this.helpMemoryButton.deleted = showTopicButtons;
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
				if (captions[i] === "Top") {
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
		this.autoShrinkButton.deleted = shown;
		this.libraryToggle.deleted = shown;
		this.clipboardList.deleted = shown;
		this.pastePositionItem.deleted = shown;
		this.pasteModeList.deleted = shown;
		this.copyButton.deleted = shown;
		this.cutButton.deleted = shown;
		this.pasteButton.deleted = shown;

		// selection action tools
		shown = hide || !this.selecting || settingsMenuOpen;
		this.cancelSelectionButton.deleted = shown;
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
		this.changeCellStateButton.deleted= shown;
		this.randomButton.deleted = shown;
		this.randomItem.deleted = shown;
		this.advanceOutsideButton.deleted = shown;
		this.advanceSelectionButton.deleted = shown;
		shown = hide || !this.selecting || settingsMenuOpen || this.engine.multiNumStates <= 2 || this.engine.isNone;
		this.random2Button.deleted = shown || this.engine.isPCA;

		// lock select tools in VIEWONLY
		shown = this.viewOnly;
		this.pastePositionItem.locked = shown;
		this.pasteModeList.locked = shown;

		// lock select tools
		shown = !this.isSelection;
		this.copyButton.locked = shown;
		this.autoShrinkButton.locked = shown;

		// lock select tools for VIEWONLY
		shown = !(this.isSelection || this.isPasting) || this.viewOnly;
		this.cancelSelectionButton.deleteIfShown(shown);
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
		this.changeCellStateButton.deleteIfShown(shown);
		this.advanceOutsideButton.deleteIfShown(shown);
		this.advanceSelectionButton.deleteIfShown(shown);
		shown = !this.isSelection || this.viewOnly;
		this.cutButton.locked = shown;

		// lock paste tools (unless external sync is on since the system clipboard contents are not known)
		shown = ((!this.canPaste || this.pasteBuffers[this.currentPasteBuffer] === null) && !this.copySyncExternal) || this.isPasting || this.viewOnly;
		this.pasteButton.locked = shown;

		// drawing tools
		shown = hide || !this.drawing || !this.showStates || settingsMenuOpen;
		this.stateList.deleted = shown;
		this.stateColsList.deleted = shown;
		if (this.engine.multiNumStates <= 2 && !this.engine.isRuleTree) {
			// 2-state potentially with LifeHistory
			for (i = 0; i < /** @type {!Array} */ (this.stateColsList.lower).length; i += 1) {
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
			for (i = 0; i < /** @type {!Array} */ (this.stateColsList.lower).length; i += 1) {
				if (i + this.startState === 0) {
					value = 0;
				} else {
					if (this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended) {
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

		// lock use icons if icons not available
		this.iconToggle.locked = !this.engine.iconsAvailable;

		// lock nav toggle if window height is too short
		shown = this.displayHeight < ViewConstants.minMenuHeight;
		this.navToggle.locked = shown;

		// replace nav toggle with shrink button if window height too short for nav button and thumbnail mode enabled
		if (shown && this.thumbnailEverOn) {
			this.navToggle.deleted = true;
			this.shrinkButton.setPosition(this.navToggle.position, this.navToggle.relX, this.navToggle.relY);
			this.shrinkButton.enabled = true;
		} else {
			this.navToggle.deleted = false;
			this.shrinkButton.setPosition(Menu.southEast, -40, -90);
			this.shrinkButton.enabled = this.navToggle.current[0];
		}
	};

	// update infobar
	View.prototype.updateInfoBar = function() {
		// compute the x and y coordinates
		var	/** @type {number} */ xVal = -((this.engine.width / 2 - this.engine.xOff - this.engine.originX) | 0),
			/** @type {number} */ yVal = -((this.engine.height / 2 - this.engine.yOff - this.engine.originY) | 0),
			/** @type {string} */ xValStr = String(xVal),
			/** @type {string} */ yValStr = String(yVal);

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
		this.stopIndicator.toolTip = ["stop at " + this.stopGeneration + " [" + this.altKeyText + " P]"];
	};

	// save elapsed time at generation
	View.prototype.saveElapsedTime = function(/** @type {number} */ counter, /** @type {number} */ timeSinceLastUpdate, /** @type {number} */ gensPerStep) {
		var	/** @type {Float32Array} */ buffer = null;

		// save elapsed time
		if (counter >= this.elapsedTimes.length) {
			// grow buffer
			buffer = /** @type {!Float32Array} */ (this.engine.allocator.allocate(Type.Float32, this.elapsedTimes.length + ViewConstants.numElapsedTimes, "View.elapsedTimes"));

			// copy buffer
			buffer.set(this.elapsedTimes);
			this.elapsedTimes = buffer;
		}
		this.elapsedTime += (timeSinceLastUpdate / gensPerStep);
		this.elapsedTimes[counter] = this.elapsedTime;
	};

	// compute next generation and set flag if Life just died
	View.prototype.computeNextGeneration = function() {
		var	/** @type {BoundingBox} */ zoomBox = this.engine.zoomBox,
			/** @type {BoundingBox} */ historyBox = this.engine.historyBox,
			/** @type {number} */ initialPopulation = this.engine.population;

		// save bounding box in case all cells die
		this.engine.saveBox.set(zoomBox);
		this.engine.saveHistoryBox.set(historyBox);

		// compute next generation
		this.engine.nextGeneration(this.noHistory);
		this.engine.convertToPensTile();

		// save snapshot if needed
		this.engine.saveSnapshotIfNeeded(this);

		// paste any RLE snippets
		this.pasteRLEList();

		// save population data
		this.engine.savePopulationData();

		// if nothing alive now then restore last bounding box
		if (this.engine.population === 0) {
			zoomBox.set(this.engine.saveBox);
			historyBox.set(this.engine.saveHistoryBox);
		}

		// check if Life just died
		if (this.engine.population === 0 && initialPopulation !== 0) {
			this.justDied = true;
		} else {
			this.justDied = false;
		}

		// check if grid buffer needs to grow
		if (this.engine.counter && this.engine.population > 0) {
			this.middleBox.leftX = this.engine.zoomBox.leftX;
			this.middleBox.bottomY = this.engine.zoomBox.bottomY;
			this.middleBox.rightX = this.engine.zoomBox.rightX;
			this.middleBox.topY = this.engine.zoomBox.topY;
			this.checkGridSize(this, this.middleBox);
		}
	};

	// create RuleLoader Lookup
	View.prototype.createRuleLoaderLookup = function() {
		// check for Moore with 3 bits since it is slow to generate and needs to be done in steps
		if (this.engine.ruleTableOutput !== null && this.engine.ruleTableNeighbourhood === PatternConstants.ruleTableMoore && this.engine.multiNumStates > 4) {
			// reset to first init step
			this.engine.ruleLoaderStep = 0;
		} else {
			// normal case so process now
			this.engine.createRuleLoaderLookup();
		}
	};

	// view update for create RuleLoader Lookup
	View.prototype.viewAnimateInitLookup = function(/** @type {View} */ me, /** @type {number} */ startTime) {
		// start time of updates
		var	// time budget in ms for this frame
			/** @type {number} */ elapsedTime = 0,
			/** @type {number} */ timeLimit = 14;

		// if just started then notify
		if (me.engine.ruleLoaderStep === 0) {
			me.engine.ruleLoaderGenerationTime = performance.now();
		}

		// process the next step
		do {
			this.engine.createRuleTableLookupStep();
			elapsedTime = performance.now() - startTime;
		} while (elapsedTime < timeLimit && me.engine.ruleLoaderStep !== -1);

		// if complete then notify
		if (me.engine.ruleLoaderStep === -1) {
			me.engine.ruleLoaderGenerationTime = performance.now() - me.engine.ruleLoaderGenerationTime;
			me.menuManager.updateCount = 10;
		}

		// set the auto update mode
		me.menuManager.setAutoUpdate(true);
	};

	// stop start from (go to generation)
	View.prototype.stopStartFrom = function(/** @type {View} */ me, /** @type {boolean} */ cancelled, /** @type {boolean} */ notify) {
		var	/** @type {number} */ gps = 0,
			/** @type {number} */ genTime = 0;

		me.viewMenu.locked = false;
		if (cancelled) {
			if (notify) {
				me.menuManager.notification.notify("Cancelled", 15, 80, 15, true);
			}
		} else {
			if (me.genNotifications) {
				if (notify || me.startFromTiming !== -1) {
					me.menuManager.notification.notify("Arrived at generation " + me.engine.counter, 15, 150, 15, true);
					if (me.startFromTiming !== -1) {
						// calculate benchmark results
						genTime = (performance.now() - me.startFromTiming) / 1000;
						gps = (me.startFromGens / genTime) | 0;
						me.menuManager.notification.notify("Calculated " + me.startFromGens + " gens in " + genTime.toFixed(1) + "s = " + gps + "gps", 15, 1200, 15, false);

						// save benchmark info
						me.lastBenchmarkTime = genTime;
						me.lastBenchmarkGens = me.startFromGens;
					}
				}
			}
		}
		if (me.startFromTiming === -1 && (me.engine.population !== 0 || (me.pasteEvery || me.engine.counter <= me.maxPasteGen))) {
			me.menuManager.notification.clear(false, false);
		}
		me.afterEdit("");
		me.startFrom = -1;
		me.startFromTiming = -1;
	};

	// view update for start from
	View.prototype.viewAnimateStartFrom = function(/** @type {View} */ me) {
		// start time of updates
		var	/** @type {number} */ startTime = performance.now(),

			// time budget in ms for this frame
			/** @type {number} */ timeLimit = 13;

		// lock the menu
		me.viewMenu.locked = true;

		// compute the next set of generations
		while (!me.lifeEnded() && me.engine.counter < me.startFrom && (me.startFromTiming !== -1 || (performance.now() - startTime < timeLimit))) {
			// compute next generation
			me.computeNextGeneration();

			// check if life just stopped
			if (me.lifeEnded()) {
				// remember the generation that life stopped
				if (me.diedGeneration === -1) {
					me.diedGeneration = me.engine.counter;

					// notify simulation stopped unless loop defined and enabled
					if (me.genNotifications && !(me.loopGeneration !== -1 && !me.loopDisabled)) {
						if (me.engine.isPCA || me.engine.isMargolus) {
							me.menuManager.notification.notify("Life ended at generation " + (me.engine.counterMargolus + me.genOffset), 15, 600, 15, false);
						} else {
							me.menuManager.notification.notify("Life ended at generation " + (me.engine.counter + me.genOffset), 15, 600, 15, false);
						}
					}
				}
			}

			// save elapsed time
			me.saveElapsedTime(me.engine.counter, 0, 1);
		}

		// render world
		me.renderWorld(me, false, 0, false);

		// update progress bar
		me.updateProgressBarStartFrom(me);

		// set counter to the current generation
		me.fixedPointCounter = me.engine.counter * me.refreshRate;

		// set the auto update mode
		me.menuManager.setAutoUpdate(true);

		// stop if target reached or all cells died
		if ((me.engine.counter >= me.startFrom) || me.lifeEnded()) {
			me.stopStartFrom(me, me.engine.population === 0 && !(me.pasteEvery || me.engine.counter <= me.maxPasteGen), false);
		}
	};

	// view update for identify
	View.prototype.viewAnimateIdentify = function(/** @type {View} */ me) {
		// start time of updates
		var	/** @type {number} */ startTime = performance.now(),

			// time budget in ms for this frame
			/** @type {number} */ timeLimit = 13,

			// identify result
			/** @type {Array<string>} */ identifyResult = [];

		// lock the menu
		me.viewMenu.locked = true;

		// update the origin
		me.fixedPointCounter = me.engine.counter * me.refreshRate;
		me.updateOrigin();

		// compute the next set of generations without stats for speed
		while (me.identify && (performance.now() - startTime < timeLimit) && (me.engine.population > 0 || me.pasteEvery || me.engine.counter <= me.maxPasteGen)) {
			if (me.engine.identifyDeferredCounter === -1) {
				// compute next generation
				me.computeNextGeneration();

				// check if life just stopped
				if (me.engine.population === 0) {
					// remember the generation that life stopped
					if (me.diedGeneration === -1) {
						me.diedGeneration = me.engine.counter;

						// notify simulation stopped
						if (me.genNotifications) {
							// don't notify if there are pending pastes
							if (!(me.isPasteEvery || me.engine.counter <= me.maxPasteGen)) {
								if (me.engine.isPCA || me.engine.isMargolus) {
									me.menuManager.notification.notify("Life ended at generation " + (me.engine.counterMargolus + me.genOffset), 15, 600, 15, false);
								} else {
									me.menuManager.notification.notify("Life ended at generation " + (me.engine.counter + me.genOffset), 15, 600, 15, false);
								}
							}
						}
					}
				}

				// save elapsed time
				me.saveElapsedTime(me.engine.counter, 0, 1);
			}

			// check if any cells are alive
			if (me.engine.population > 0 || me.pasteEvery || me.engine.counter <= me.maxPasteGen) {
				// compute oscillators
				identifyResult = me.engine.oscillating(me);
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
						me.lastIdentifyStrict = "";
						me.lastIdentifyMod = "";
						me.lastIdentifyActive = "";
						me.lastIdentifyTemperature = "";
						me.lastIdentifyDensity = "";
					} else {
						// check results
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
							me.lastIdentifyStrict = identifyResult[11];
							me.lastIdentifyMod = identifyResult[12];
							me.lastIdentifyActive = identifyResult[13];
							me.lastIdentifyTemperature = identifyResult[14];
							me.lastIdentifyDensity = identifyResult[15];

							// update result labels
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
							if (me.lastIdentifyStrict === "") {
								me.identifyVolatilityValueLabel.preText = me.lastIdentifyVolatility + " | N/A";
								me.identifyVolatilityValueLabel.toolTip = "normal | strict";
							} else {
								me.identifyVolatilityValueLabel.preText = me.lastIdentifyVolatility + " | " + me.lastIdentifyStrict;
								me.identifyVolatilityValueLabel.toolTip = "normal | strict";
							}
							me.identifyModValueLabel.preText = me.lastIdentifyMod;
							me.identifyActiveValueLabel.preText = me.lastIdentifyActive;
							me.identifyActiveValueLabel.toolTip = "rotor | stator | total";
							me.identifyTemperatureValueLabel.preText = me.lastIdentifyTemperature;
							me.identifyTemperatureValueLabel.toolTip = "active | rotor";

							if (me.lastIdentifyType === "Still Life") {
								me.identifyModValueLabel.preText = me.lastIdentifyDensity;
								me.identifyModLabel.preText = "Density";
							} else {
								me.identifyModLabel.preText = "Mod";
							}
						}
						me.resultsDisplayed = true;

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
					if (me.lastIdentifyType === "Empty" || me.lastIdentifyType === "none" || me.lastIdentifyType === "") {
						me.menuManager.notification.notify(identifyResult[0], 15, 240, 15, false);
						me.resultsDisplayed = false;
					} else {
						me.menuManager.notification.clear(true, false);
						me.menuManager.notification.clear(false, false);

						me.fixedPointCounter = me.engine.counter * me.refreshRate;
						me.updateOrigin();

						me.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
					}
					me.engine.initSearch(me.identify);

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
				me.engine.initSearch(me.identify);

				// unlock the menu
				me.viewMenu.locked = false;
			}

			// if waiting for deferred calculation to start break out of the loop
			if (me.engine.identifyDeferredCounter !== -1) {
				me.cancelButton.locked = true;
				break;
			}
		}

		// render world
		me.renderWorld(me, false, 0, false);

		// set counters to the current generation
		me.fixedPointCounter = me.engine.counter * me.refreshRate;

		// set the auto update mode
		me.menuManager.setAutoUpdate(true);
	};

	// view update for history calculation
	View.prototype.viewAnimateHistory = function(/** @type {View} */ me) {
		// target generation
		var	/** @type {number} */ targetGen = me.computeHistoryTarget,

			// start time of updates
			/** @type {number} */ startTime = performance.now(),

			// time budget in ms for this frame
			/** @type {number} */ timeLimit = 13,

			// whether to save snapshots during next generation
			/** @type {boolean} */ saveNoHistory = this.noHistory,

			// compute number of generations in snapshot buffer
			/** @type {number} */ snapshotBufferGens = me.engine.snapshotManager.maxSnapshots * LifeConstants.snapshotInterval;

		// compute the next set of generations
		while (me.engine.counter < targetGen && (performance.now() - startTime < timeLimit)) {
			// check whether to save snapshots
			if (targetGen - 1 - me.engine.counter <= snapshotBufferGens) {
				this.noHistory = false;
			} else {
				this.noHistory = saveNoHistory;
			}

			// compute next generation
			me.computeNextGeneration();
		}

		// check if complete
		if (me.engine.counter === targetGen) {
			// switch back to normal mode
			me.computeHistory = false;

			// clear notification
			if (me.computeHistoryClear) {
				me.menuManager.notification.clear(true, false);
			}

			// set the fixed point counter
			me.fixedPointCounter = me.engine.counter * me.refreshRate;

			// unlock the menu
			me.viewMenu.locked = false;
		} else {
			// lock the menu
			me.viewMenu.locked = true;
		}

		// update progress bar
		me.updateProgressBarHistory(me, targetGen);

		// render world
		me.renderWorld(me, false, 0, false);

		// restore no history
		me.noHistory = saveNoHistory;

		// set the auto update mode
		me.menuManager.setAutoUpdate(true);
	};

	// initialize overview
	View.prototype.initOverview = function() {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ px = 0,
			/** @type {number} */ py = 0,
			/** @type {number} */ size = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ maxWidth = 0,
			/** @type {number} */ maxHeight = 0,
			/** @type {number} */ patWidth = 0,
			/** @type {number} */ patHeight = 0,
			/** @type {number} */ patScale = 1,
			/** @type {number} */ divider = 1,
			/** @type {number} */ xOff = 0,
			/** @type {number} */ yOff = 0,
			/** @type {number} */ xSize = 0,
			/** @type {number} */ ySize = 0,
			/** @type {Array<PatternInfo>} */ patterns = Controller.patterns,
			/** @type {Array<Uint8Array>} */ map = null,
			/** @type {Uint8Array} */ mapRow = null,
			/** @type {MenuItem} */ menuItem = null,
			/** @const {number} */ maxImageSize = 4096,
			/** @type {string} */ patName = "";

		// find the largest pattern
		for (i = 0; i < patterns.length; i += 1) {
			width = patterns[i].width;
			height = patterns[i].height;

			if (width > maxWidth) {
				maxWidth = width;
			}

			if (height > maxHeight) {
				maxHeight = height;
			}
		}

		// find the nearest power of two square that's bigger than any pattern
		i = 0;
		while (((1 << i) <= maxWidth) || ((1 << i) <= maxHeight)) {
			i += 1;
		}
		size = 1 << i;

		// now create a grid of patterns
		width = Math.ceil(Math.sqrt(patterns.length));
		height = width;

		// ensure the image is not too big
		while (width * size / divider > maxImageSize || height * size / divider > maxImageSize) {
			divider += 1;
		}

		// create the overview image
		this.overviewCanvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
		this.overviewCanvas.width = width * size / divider;
		this.overviewCanvas.height = height * size / divider;
		this.overviewContext = /** @type {!CanvasRenderingContext2D} */ (this.overviewCanvas.getContext("2d"));
		this.overviewContext.fillStyle = "black";
		this.overviewContext.fillRect(0, 0, this.overviewCanvas.width, this.overviewCanvas.height);

		// create the overview menu
		this.overviewMenu = this.menuManager.createMenu(this.viewAnimateOverview, this.viewStart, this);
		this.overviewMenu.bgAlpha = 0.2;

		// determine button size
		xSize = this.displayWidth / width;
		ySize = this.displayHeight / height;

		for (y = 0; y < height; y += 1) {
			for (x = 0; x < width; x += 1) {
				i = y * height + x;
				if (i < patterns.length) {
					// remove trailing .rle from pattern name if present
					patName = patterns[i].name;
					if (patName.endsWith(".rle")) {
						patName = patName.substring(0, patName.length - 4);
					}

					// create the button for the pattern
					menuItem = this.overviewMenu.addButtonItem(this.overviewPressed, Menu.northWest, x * xSize, y * ySize, xSize, ySize, patName);
					
					// set the universe ID in the button
					menuItem.lower = i;

					// draw the pattern onto the image
					this.overviewContext.fillStyle = "rgb(32,255,255)";
					map = patterns[i].map;
					patHeight = map.length;
					patWidth = map[0].length;

					// scale the pattern
					patScale = 1;
					while (patHeight * patScale < size && patWidth * patScale < size) {
						patScale += 1;
					}
					patScale -= 1;
					if (patScale > 1) {
						patScale -= 1;
					}
					xOff = (size - patWidth * patScale) >> 1;
					yOff = (size - patHeight * patScale) >> 1;

					var pixelSize = Math.ceil(patScale / divider);
					for (py = 0; py < patHeight; py += 1) {
						mapRow = map[py];
						for (px = 0; px < patWidth; px += 1) {
							if (mapRow[px] > 0) {
								//if (patScale <= 2) {
									this.overviewContext.fillRect(Math.ceil((x * size + px * patScale + xOff) / divider), Math.ceil((y * size + py * patScale + yOff) / divider), pixelSize, pixelSize);
								//} else {
									//this.overviewContext.fillRect((x * size + px * patScale + xOff) / divider + (patScale / divider) * 0.1, (y * size + py * patScale + yOff) / divider + (patScale / divider) * 0.1, (patScale / divider) * 0.8, (patScale / divider) * 0.8);
								//}
							}
						}
					}
				}
			}
		}

		// set the overview menu as active
		this.menuManager.activeMenu(this.overviewMenu);

		// clear the canvas
		this.mainContext.fillStyle = "blue";
		this.mainContext.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

		// mark initialization complete
		this.overviewInitialized = true;
	};

	// update overview
	View.prototype.viewAnimateOverview = function(/** @type {number} */ unused, /** @type {View} */ me) {
		var	/** @type {number} */ overviewWidth = 0,
			/** @type {number} */ overviewHeight = 0,
			/** @type {number} */ xScale = 0,
			/** @type {number} */ yScale = 0,
			/** @type {number} */ scale = 0;

		// scale the image to the window
		overviewWidth = me.overviewCanvas.width;
		overviewHeight = me.overviewCanvas.height;
		xScale = me.displayWidth / overviewWidth;
		yScale = me.displayHeight / overviewHeight;
		scale = xScale;
		if (yScale > scale) {
			scale = yScale;
		}

		// draw the overview
		me.mainContext.fillStyle = "black";
		me.mainContext.fillRect(0, 0, me.mainCanvas.width, me.mainCanvas.height);
		me.mainContext.save();
		me.mainContext.translate(me.displayWidth / 2, me.displayHeight / 2);
		me.mainContext.scale(scale, scale);
		me.mainContext.imageSmoothingEnabled = true;
		me.mainContext.imageSmoothingQuality = "high";
		me.mainContext.drawImage(me.overviewCanvas, -(overviewWidth / 2), -(overviewHeight / 2));
		me.mainContext.restore();
	};

	// update view mode dispatcher
	View.prototype.viewAnimate = function(/** @type {number} */ timeSinceLastUpdate, /** @type {View} */ me) {
		var	/** @type {number} */ startTime = performance.now();

		if (me.computeHistory) {
			// computing history
			me.viewAnimateHistory(me);
		} else {
			if (me.identify) {
				// identifying pattern
				me.viewAnimateIdentify(me);
			} else {
				if (me.startFrom !== -1) {
					// starting from a specified generation
					me.viewAnimateStartFrom(me);
				} else {
					// normal
					me.viewAnimateNormal(timeSinceLastUpdate, me);

					// check if initializing Fast Lookup
					if (me.engine.isRuleTree && me.engine.ruleLoaderStep !== -1) {
						me.viewAnimateInitLookup(me, startTime);
					}
				}
			}
		}
	};

	// start view mode
	View.prototype.viewStart = function(/** @type {View} */ me) {
		// zero life counter
		me.engine.counter = 0;
		me.engine.counterMargolus = 0;
		me.engine.maxMargolusGen = 0;
		me.fixedPointCounter = 0;

		// reset elapsed time
		me.elapsedTime = 0;

		// center on pan position
		me.engine.xOff = me.engine.width >> 1;
		me.engine.yOff = me.engine.height >> 1;
		me.engine.xOff &= (me.engine.width - 1);
		me.engine.yOff &= (me.engine.height - 1);

		// flag just started for first frame measurement
		me.justStarted = true;

		// reset died generation
		me.diedGeneration = -1;
	};

	// toggle stars display
	/** @returns {Array<boolean>} */
	View.prototype.viewStarsToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.starsOn = newValue[0];
		}

		return [me.starsOn];
	};

	// toggle history fit mode
	/** @returns {Array<boolean>} */
	View.prototype.viewHistoryFitToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.historyFit = newValue[0];
		}

		return [me.historyFit];
	};

	// toggle major gridlines display
	/** @returns {Array<boolean>} */
	View.prototype.viewMajorToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.engine.gridLineMajorEnabled = newValue[0];
		}

		return [me.engine.gridLineMajorEnabled];
	};

	// toggle infobar display
	/** @returns {Array<boolean>} */
	View.prototype.viewInfoBarToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.infoBarEnabled = newValue[0];
		}

		return [me.infoBarEnabled];
	};

	// toggle fast lookup
	/** @returns {Array<boolean>} */
	View.prototype.viewFastLookupToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.engine.ruleLoaderLookupEnabled = newValue[0];
		}

		return [me.engine.ruleLoaderLookupEnabled];
	};

	// toggle state number display
	/** @returns {Array<boolean>} */
	View.prototype.viewStateNumberToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.stateNumberDisplayed = newValue[0];
		}

		return [me.stateNumberDisplayed];
	};

	// toggle y direction
	/** @returns {Array<boolean>} */
	View.prototype.viewYDirectionToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.yUp = newValue[0];
			me.saveBooleanSetting(ViewConstants.ySettingName, me.yUp);
		}

		return [me.yUp];
	};

	// toggle graph data elements
	/** @returns {Array<boolean>} */
	View.prototype.viewGraphList = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.graphShowPopulation = newValue[0];
			me.graphShowBirths = newValue[1];
			me.graphShowDeaths = newValue[2];
		}

		return [me.graphShowPopulation, me.graphShowBirths, me.graphShowDeaths];
	};

	// toggle graph display
	/** @returns {Array<boolean>} */
	View.prototype.viewGraphToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			// switch to Pan mode
			if (me.modeList.current !== ViewConstants.modePan) {
				me.modeList.current = me.viewModeList(ViewConstants.modePan, true, me);
			}

			// close settings menu
			if (me.navToggle.current[0]) {
				me.navToggle.current = me.toggleSettings([false], true, me);
			}

			// set the graph displayed flag - must come after changing mode above
			me.popGraph = newValue[0];
		}

		return [me.popGraph];
	};

	// toggle kill gliders
	/** @returns {Array<boolean>} */
	View.prototype.viewKillToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.engine.clearGliders = newValue[0];
		}

		return [me.engine.clearGliders];
	};

	// toggle labels display
	/** @returns {Array<boolean>} */
	View.prototype.viewLabelToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.showLabels = newValue[0];
		}

		return [me.showLabels];
	};

	// toggle cell borders
	/** @returns {Array<boolean>} */
	View.prototype.viewBordersToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			// toggle cell borders
			me.engine.cellBorders = newValue[0];
		}

		return [me.engine.cellBorders];
	};

	// toggle auto hide grid
	/** @returns {Array<boolean>} */
	View.prototype.viewAutoGridToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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
	/** @returns {Array<boolean>} */
	View.prototype.viewRainbowToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			// toggle rainbow
			me.engine.rainbow = newValue[0];
			me.engine.clearHistoryCells();
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
	/** @returns {Array<boolean>} */
	View.prototype.viewAltGridToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			// toggle auto hide
			me.engine.altGrid = newValue[0];
		}
		return [me.engine.altGrid];
	};

	// toggle auto hide gui
	/** @returns {Array<boolean>} */
	View.prototype.viewAutoHideToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			// toggle auto hide
			me.hideGUI = newValue[0];
		}
		return [me.hideGUI];
	};

	// toggle hexagonal cells
	/** @returns {Array<boolean>} */
	View.prototype.viewHexCellToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			// toggle cell shape
			me.engine.forceRectangles = newValue[0];
			me.updateGridIcon();
		}

		return [me.engine.forceRectangles];
	};

	// toggle timing detail display
	/** @returns {Array<boolean>} */
	View.prototype.viewTimingDetailToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.menuManager.showExtendedTiming = newValue[0];
		}

		// ensure update happens
		me.menuManager.setAutoUpdate(true);

		return [me.menuManager.showExtendedTiming];
	};

	// toggle fps display
	/** @returns {Array<boolean>} */
	View.prototype.viewFpsToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			me.menuManager.showTiming = newValue[0];
		}

		// ensure update happens
		me.menuManager.setAutoUpdate(true);

		return [me.menuManager.showTiming];
	};

	// colour theme
	View.prototype.setNewTheme = function(/** @type {number} */ newTheme, /** @type {number} */ steps, /** @type {View} */ me) {
		var	/** @type {number} */ i = 0;

		// check if it has changed
		if (me.engine.colourTheme !== newTheme) {
			me.engine.setTheme(newTheme, steps, me);
			if (me.engine.colourChangeSteps > 1) {
				me.menuManager.updateCount = me.engine.colourChangeSteps;
			}

			// clear theme selection buttons apart from this one
			for (i = 0; i <= me.engine.numThemes; i += 1) {
				if (newTheme !== ViewConstants.themeOrder[i]) {
					me.themeSelections[i].current = [false];
				} else {
					me.themeSelections[i].current = [true];
				}
			}

			// mark that the Theme has changed so relevant Icons recolour
			me.iconManager.recolour = true;
			me.iconManager.recolourGrid = me.engine.gridLineColour;

			// update the grid major button
			me.majorButton.current = [me.engine.gridLineMajorEnabled && me.engine.gridLineMajor > 0];
		}
	};

	// convert playback speed to range index
	/** @returns {number} */ 
	View.prototype.speedIndex = function() {
		var	/** @type {number} */ perSPart = 0,
			/** @type {number} */ stepPart = 0,
			/** @type {number} */ result = 0,
			/** @type {number} */ deadZone = ViewConstants.deadZoneSpeed;

		// ensure gen speed is not greater than the refresh rate
		if (this.genSpeed > ViewConstants.defaultRefreshRate) {
			this.genSpeed = ViewConstants.defaultRefreshRate;
		}

		perSPart = Math.sqrt((this.genSpeed - ViewConstants.minGenSpeed) / (ViewConstants.defaultRefreshRate - ViewConstants.minGenSpeed));
		stepPart = (this.gensPerStep - ViewConstants.minStepSpeed) / (ViewConstants.maxStepSpeed - ViewConstants.minStepSpeed);

		if (stepPart === 0) {
			result = perSPart * (1 - deadZone);
		} else {
			result = stepPart * (1 - deadZone) + 1 + deadZone;

		}
		return result;
	};

	// set playback speed from speed index
	View.prototype.setPlaybackFromIndex = function(/** @type {number} */ indexValue) {
		var	/** @type {number} */ deadZone = ViewConstants.deadZoneSpeed;

		// ensure gen speed is not greater than refresh rate
		if (this.genSpeed > ViewConstants.defaultRefreshRate) {
			this.genSpeed = ViewConstants.defaultRefreshRate;
		}

		// compute the generations per step and step
		if (indexValue <= (1 - deadZone)) {
			indexValue /= (1 - deadZone);
			this.genSpeed = Math.round(ViewConstants.minGenSpeed + (indexValue * indexValue * (ViewConstants.defaultRefreshRate - ViewConstants.minGenSpeed)));
			this.gensPerStep = 1;
		} else {
			if (indexValue < 1 + deadZone) {
				indexValue = 0;
			} else {
				indexValue -= 1 + deadZone;
				indexValue /= (1 - deadZone);
			}
			this.genSpeed = ViewConstants.defaultRefreshRate;
			this.gensPerStep = Math.round(ViewConstants.minStepSpeed + (indexValue * (ViewConstants.maxStepSpeed - ViewConstants.minStepSpeed)));
		}
	};

	// set playback speed
	/** @returns {Array} */
	View.prototype.viewSpeedRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {string} */ label = "",
			/** @type {number} */ value = me.speedIndex();

		// check if changing
		if (change) {
			value = newValue[0];
			me.setPlaybackFromIndex(value);
		}

		// ensure gen speed is not greater than frame rate
		if (me.genSpeed > ViewConstants.defaultRefreshRate) {
			me.genSpeed = ViewConstants.defaultRefreshRate;
		}

		// compute the label
		if (Math.round(me.genSpeed) < ViewConstants.defaultRefreshRate) {
			label = String(Math.round(me.genSpeed)) + "/s";
		} else {
			label = String(Math.round(me.gensPerStep)) + "x";
		}

		return [value, label];
	};

	// save the camera position
	View.prototype.saveCamera = function(/** @type {View} */ me) {
		// save zoom
		me.savedZoom = me.engine.zoom;
		if (me.thumbnail) {
			me.savedZoom = me.savedZoom * me.thumbnailDivisor;
		}

		// save angle
		me.savedAngle = me.engine.angle;

		// save tilt
		me.savedTilt = me.engine.tilt;

		// save x and y
		me.savedX = me.engine.xOff;
		me.savedY = me.engine.yOff;
	};

	// reset the saved camera
	View.prototype.resetSavedCamera = function(/** @type {View} */ me) {
		// save start point
		me.startXPOI = me.engine.width / 2 - me.engine.xOff;
		me.startYPOI = me.engine.height / 2 - me.engine.yOff;
		me.startZoomPOI = me.engine.zoom;
		me.startAnglePOI = me.engine.angle;
		me.startTiltPOI = me.engine.tilt;

		// set destination
		me.endXPOI = me.engine.width / 2 - me.savedX;
		me.endYPOI = me.engine.height / 2 - me.savedY;
		me.endAnglePOI = me.savedAngle;
		me.endTiltPOI = me.savedTilt;

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
	View.prototype.resetCamera = function(/** @type {View} */ me, /** @type {boolean} */ fullReset) {
		var	/** @type {number} */ numberValue = 0;

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

		// reset tilt
		me.engine.tilt = me.defaultTilt;
		if (me.tiltItem) {
			me.tiltItem.current = [me.convertFromTilt(me.defaultTilt), me.defaultTilt];
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

			// reset gps and step
			me.genSpeed = me.defaultGPS;
			me.gensPerStep = me.defaultStep;
			//me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);
			if (me.gensPerStep === 1) {
				me.speedRange.current = me.viewSpeedRange([1, 1], true, me);
			} else {
				me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);
			}

			// reset layers
			me.engine.layers = me.defaultLayers;
			me.layersItem.current = [me.defaultLayers, me.defaultLayers];

			// reset depth
			numberValue = Math.sqrt(me.defaultDepth);
			me.depthItem.current = me.viewDepthRange([numberValue, numberValue], true, me);

			// reset rainbow
			me.rainbowButton.current = this.viewRainbowToggle([this.defaultRainbow], true, me);
		}
	};

	// adjust origin if track just switched on or off
	View.prototype.adjustOrigin = function(/** @type {boolean} */ trackDisabled) {
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
	View.prototype.resetGeneration = function(/** @type {View} */ me) {
		// reset time
		me.elapsedTime = 0;

		// check for simple view
		if (!me.multiStateView) {
			// reset grid and generation counter
			me.engine.restoreSavedGrid(me, me.noHistory);

			// reset history box
			me.engine.resetHistoryBox();
		}
	};

	// reset to first generation
	View.prototype.reset = function(/** @type {View} */ me) {
		var	/** @type {boolean} */ hardReset = false,
			/** @type {boolean} */ looping = false,
			/** @type {Waypoint} */ currentWaypoint = me.waypointManager.firstWaypoint();

		// clear just died flag
		this.justDied = false;

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
			me.engine.restoreSavedGrid(me, me.noHistory);
			Array.copy(me.engine.tileGrid, me.engine.colourTileGrid);
			Array.copy(me.engine.tileGrid, me.engine.colourTileHistoryGrid);

			// set tiles on the bounded grid boundary since the grid size may have grown
			if (me.engine.boundedGridType !== -1) {
				me.engine.setBoundedTiles();
			}

			// re-convert grid to colours so rainbow on/off works
			if (!me.engine.isLifeHistory) {
				if (me.engine.multiNumStates === -1) {
					me.engine.resetColourGridBox(me.engine.grid16);
				} else {
					me.engine.convertToPensTile();
				}
			}
		}

		// reset population data for graph
		if (!me.graphDisabled) {
			me.engine.resetPopulationData();
		}

		// reset history box
		me.engine.resetHistoryBox();

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
		if (hardReset) {
			// check for waypoint message
			if (currentWaypoint && currentWaypoint.textDefined) {
				if (currentWaypoint.textMessage !== me.lastWaypointMessage) {
					// if the message is different then notify
					me.menuManager.notification.notify(ScriptParser.substituteVariables(me, currentWaypoint.textMessage), 15, 21600, 15, false);
					me.lastWaypointMessage = currentWaypoint.textMessage;
				}
			} else {
				// clear any waypoint message
				me.menuManager.notification.clear(false, false);
				me.lastWaypointMessage = "";
			}
		} else {
			// clear any waypoint messages
			me.menuManager.notification.clear(false, false);

			// clear last waypoint message
			me.lastWaypointMessage = "";
		}

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
	View.prototype.setPauseIcon = function(/** @type {boolean} */ isPlaying) {
		var	/** @type {boolean} */ reverse = this.engine.reverseMargolus,
			/** @type {string} */ toolTip = "",
			/** @type {string} */ iconName = "",
			/** @type {string} */ backIconName = "",
			/** @type {string} */ backToolTip = "",
			/** @type {string} */ forwardIconName = "",
			/** @type {string} */ forwardToolTip = "",
			/** @type {Array<string>} */ currentToolTips = [];

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
		currentToolTips = /** @type {!Array<string>} */ (this.playList.toolTip);
		currentToolTips[ViewConstants.modePause] = forwardToolTip;
		this.playList.toolTip = currentToolTips;
		this.playList.icon[ViewConstants.modeStepBack] = this.iconManager.icon(backIconName);
		currentToolTips = /** @type {!Array<string>} */ (this.playList.toolTip);
		currentToolTips[ViewConstants.modeStepBack] = backToolTip;
		this.playList.toolTip = currentToolTips;

		// set the play icon and tooltip
		this.playList.icon[ViewConstants.modePlay] = this.iconManager.icon(iconName);
		this.playList.toolTip[ViewConstants.modePlay] = toolTip;
	};

	// overview button pressed
	View.prototype.overviewPressed = function(/** @type {View} */ me) {
		// get the universe number
		var	/** @type {number} */ i = /** @type {!number} */ (me.menuManager.activeItem().lower);

		// switch to the standard menu
		me.menuManager.activeMenu(me.viewMenu);
		Controller.overview = false;

		// set the pattern
		me.universe = i;
		me.startViewer(Controller.patterns[me.universe].pattern, false);
	};

	// multiverse button pressed
	View.prototype.multiversePressed = function(/** @type {View} */ me) {
		Controller.overview = true;
		me.menuManager.activeMenu(me.overviewMenu);
	};

	// done button pressed
	View.prototype.donePressed = function(/** @type {View} */ me) {
		localStorage.setItem(ViewConstants.doneKey, "y");
		me.checkForChromeBug();
	};

	// set help topic
	View.prototype.setHelpTopic = function(/** @type {number} */ newValue, /** @type {View} */ me) {
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
	View.prototype.keysTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.keysTopic, me);
	};

	// scripts help topic
	View.prototype.scriptsTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.scriptsTopic, me);
	};

	// info help topic
	View.prototype.infoTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.informationTopic, me);
	};

	// themes help topic
	View.prototype.themesTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.themesTopic, me);
	};

	// colours help topic
	View.prototype.coloursTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.coloursTopic, me);
	};

	// aliases help topic
	View.prototype.aliasesTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.aliasesTopic, me);
	};

	// memory help topic
	View.prototype.memoryTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.memoryTopic, me);
	};

	// annotations help topic
	View.prototype.annotationsTopicPressed = function(/** @type {View} */ me) {
		me.setHelpTopic(ViewConstants.annotationsTopic, me);
	};

	// view help section list
	/** @returns {number} */
	View.prototype.viewHelpSectionList = function(/** @type {number} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {number} */ result = newValue;

		if (change) {
			me.displayHelp = me.helpSections[newValue][0];
			me.showSections = false;
		}

		return result;
	};

	// auto-shrink selection
	/** @returns {Array<boolean>} */
	View.prototype.viewAutoShrinkList = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.autoShrink = newValue[0];
			if (me.autoShrink) {
				me.autoShrinkSelection(me);
			}
		}

		return [me.autoShrink];
	};

	// shrink selection button
	View.prototype.shrinkSelectionPressed = function(/** @type {View} */ me) {
		me.autoShrinkSelection(me);
	};

	// display cells as icons 
	/** @returns {Array<boolean>} */
	View.prototype.viewIconList = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.useIcons = newValue[0];
		}

		return [me.useIcons];
	};

	// copy sync with external clipboard
	/** @returns {Array<boolean>} */
	View.prototype.viewCopySyncList = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.copySyncExternal = newValue[0];
			if (me.copySyncExternal) {
				me.syncNotified = true;
			}
		}

		return [me.copySyncExternal];
	};

	// view mode list
	/** @returns {number} */
	View.prototype.viewModeList = function(/** @type {number} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {number} */ result = newValue;

		if (change) {
			switch (newValue) {
				case ViewConstants.modeDraw:
					// drawing
					me.playbackDrawPause = false;
					if (me.viewOnly || me.engine.isNone) {
						result = /** @type {!number} */ (me.modeList.current);
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

			// close graph if open
			if (me.popGraph) {
				me.popGraph = false;
				me.graphButton.current = me.viewGraphToggle([me.popGraph], true, me);
			}
		}

		// set the background cursor
		me.setMousePointer(result);

		return result;
	};

	// set mouse cursor
	View.prototype.setMousePointer = function(/** @type {number} */ mode) {
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
	/** @returns {number} */
	View.prototype.viewClipboardList = function(/** @type {number} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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

	// get UI paste mode
	/** @returns {number} */
	View.prototype.getUIPasteMode = function() {
		return ViewConstants.uiPasteModes[/** @type {!number} */ (this.pasteModeList.current)];
	};

	// paste mode
	/** @returns {number} */
	View.prototype.viewPasteModeList = function(/** @type {number} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.pasteModeForUI = newValue;
			me.pasteMode = ViewConstants.uiPasteModes[newValue];
		}

		return me.pasteModeForUI;
	};

	// cycle paste mode
	View.prototype.cyclePasteMode = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			me.pasteModeForUI += 1;
			if (me.pasteModeForUI > 3) {
				me.pasteModeForUI = 0;
			}
			me.pasteModeList.current = me.viewPasteModeList(me.pasteModeForUI, true, me);
		}
	};

	// get PCA state number from name
	/** @returns {number} */
	View.prototype.getPCAStateFromName = function(/** @type {string} */ name) {
		var	/** @type {number} */ number = -1,
			/** @type {number} */ i = 0,
			/** @type {number} */ n = 0,
			/** @type {number} */ s = 0,
			/** @type {number} */ e = 0,
			/** @type {number} */ w = 0;

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
		return number;
	};

	// get state number from name
	/** @returns {number} */
	View.prototype.getStateFromName = function(/** @type {string} */ name) {
		var	/** @type {number} */ number = -1,
			/** @type {number} */ i = 0;

		// remove quotes from the name
		if (name.charAt(0) === "\"") {
			name = name.substring(1, name.length - 1);
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
						i += 1;
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
						number = this.getPCAStateFromName(name);
					} else {
						if (this.engine.isSuper) {
							i = 0;
							while (i < LifeConstants.namesSuper.length && number === -1) {
								if (LifeConstants.namesSuper[i] === name) {
									number = i;
								}
								i += 1;
							}
						} else {
							if (this.engine.isExtended) {
								i = 0;
								while (i < LifeConstants.namesExtended.length && number === -1) {
									if (LifeConstants.namesExtended[i] === name) {
										number = i;
									}
									i += 1;
								}
							} else {
								if (name === "alive") {
									number = 1;
								} else {
									if (name.substring(0, 6) === "dying ") {
										number = Number(name.substring(6)) + 1;
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
		}

		return number;
	};

	// get state name
	/** @returns {string} */
	View.prototype.getStateName = function(/** @type {number} */ state) {
		var	/** @type {string} */ name = "";

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
					switch (state) {
						case 0:
							name = "dead";
							break;
						case 1:
							name = "alive";
							break;
						default:
							name = "state " + String(state);
							break;
					}
				}
			} else {
				// multi-state (Generations, PCA or none)
				if (state === 0) {
					if (this.engine.isNone) {
						name = "state 0";
					} else {
						name = "dead";
					}
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
							if (this.engine.isExtended) {
								name = LifeConstants.namesExtended[state];
							} else {
								if (this.engine.isNone) {
									name = "state " + String(state);
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
			}
		}

		return name;
	};

	// drawing states list
	/** @returns {number} */
	View.prototype.viewStateList = function(/** @type {number} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {number} */ result = newValue;

		if (change) {
			if (me.engine.multiNumStates <= 2) {
				me.drawState = newValue;
			} else {
				newValue += me.startState;
				if (newValue === 0) {
					me.drawState = 0;
				} else {
					if (me.engine.isNone || me.engine.isPCA || me.engine.isRuleTree || me.engine.isSuper|| me.engine.isExtended) {
						me.drawState = newValue;
					} else {
						me.drawState = me.engine.multiNumStates - newValue;
					}
				}
			}

			// turn off pick mode unless in change state mode
			if (!me.pickReplace) {
				me.pickToggle.current = me.togglePick([false], true, me);

				// notify after switching mode since switching clears notifications
				me.menuManager.notification.notify("Drawing with state " + newValue + " (" + me.getStateName(newValue) + ")", 15, 120, 15, true);
			} else {
				me.menuManager.notification.notify("Replace: Now click on a cell", 15, 180, 15, true);
			}
		}

		return result;
	};

	// switch to state from keyboard shortcut
	View.prototype.switchToState = function(/** @type {number} */ state) {
		var	/** @type {number} */ numStates = this.engine.multiNumStates,
			/** @type {number} */ maxDisplayStates = this.maxDisplayStates;

		if (numStates === -1) {
			numStates = 2;
			maxDisplayStates = 2;
		}
		if (this.engine.isLifeHistory) {
			numStates = 7;
			maxDisplayStates = 7;
		}

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
	/** @returns {Array<boolean>} */
	View.prototype.viewStateColsList = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {Array<boolean>} */ result = newValue,
			/** @type {number} */ i = 0;

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
	View.prototype.replaceCells = function(/** @type {number} */ replace) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ numReplaced = 0,
			/** @type {number} */ current = this.drawState,
			/** @type {BoundingBox} */ historyBox = this.engine.historyBox,
			/** @type {BoundingBox} */ selBox = this.selectionBox,
			/** @type {number} */ leftX = historyBox.leftX,
			/** @type {number} */ rightX = historyBox.rightX,
			/** @type {number} */ bottomY = historyBox.bottomY,
			/** @type {number} */ topY = historyBox.topY,
			/** @type {number} */ swap = 0,
			/** @type {number} */ xOff = (this.engine.width >> 1) - (this.patternWidth >> 1) + (this.xOffset << 1),
			/** @type {number} */ yOff = (this.engine.height >> 1) - (this.patternHeight >> 1) + (this.yOffset << 1);

		// adjust current state if generations style
		if (this.engine.multiNumStates > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper|| this.engine.isExtended)) {
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
					if (this.engine.multiNumStates > 2 && !(this.engine.isSuper || this.engine.isExtended || this.engine.isPCA || this.engine.isRuleTree) && state > 0) { // TBD 
						state = this.engine.multiNumStates - state;
					}
					if (state === replace) {
						this.setStateWithUndo(x, y, current, true, false);
						numReplaced += 1;
					}
				}
			}
			if (numReplaced > 0) {
				// check for state 6
				if ((this.engine.isLifeHistory || this.engine.isSuper) && (replace === 6 || current === 6)) {
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
	/** @returns {number} */
	View.prototype.clearCells = function(/** @type {View} */ me, /** @type {boolean} */ ctrl, /** @type {boolean} */ markedOnly) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ current = me.drawState,
			/** @type {BoundingBox} */ historyBox = me.engine.historyBox,
			/** @type {number} */ numCleared = 0,
			/** @type {number} */ clearValue = 0;

		// delete any cell of the current pen colour   TBD [R]Super state 6
		if (current > 0) {
			// adjust current state if generations style
			if (me.engine.multiNumStates > 2 && !(me.engine.isNone || me.engine.isPCA || me.engine.isRuleTree || me.engine.isSuper || me.engine.isExtended)) {
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
								me.setStateWithUndo(x, y, state & 1, true, false);
								numCleared += 1;
							}
						}
					}
					if (numCleared > 0) {
						if (me.engine.isSuper) {
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
								me.setStateWithUndo(x, y, state & 1, true, false);
								numCleared += 1;
							}
						}
					}
					if (numCleared > 0) {
						if (me.engine.isSuper) {
							me.afterEdit("clear Super cells");
						} else {
							// update state 6 grid
							this.engine.populateState6MaskFromColGrid();
							me.afterEdit("clear History cells");
						}
					}
				}
			} else {
				// clear all cells that match the current drawing state
				for (y = historyBox.bottomY; y <= historyBox.topY; y += 1) {
					for (x = historyBox.leftX; x <= historyBox.rightX; x += 1) {
						state = me.engine.getState(x, y, false);
						if (state === current) {
							me.setStateWithUndo(x, y, clearValue, true, false);
							numCleared += 1;
						}
					}
				}
				if (numCleared > 0) {
					if ((me.engine.isLifeHistory || me.engine.isSuper) && current === 6) {
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
	/** @returns {number} */
	View.prototype.viewPlayList = function(/** @type {number} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {number} */ result = newValue,
			/** @type {boolean} */ stopMode = me.stopDisabled,
			/** @type {boolean} */ loopMode = me.loopDisabled,
			/** @type {boolean} */ waypointMode = me.waypointsDisabled,
			/** @type {boolean} */ autoStartMode = me.autoStartDisabled,
			/** @type {boolean} */ autoFitMode = me.autoFit,
			/** @type {boolean} */ trackMode = me.trackDisabled,
			/** @type {number} */ i = 0,
			/** @type {string} */ message = "",
			/** @type {number} */ duration = 40,
			/** @type {number} */ numChanged = 0,

			// whether loop switched on or off
			/** @type {number} */ loopChange = 0,

			// whether stop switched on or off
			/** @type {number} */ stopChange = 0,

			// whether waypoints switched on or off
			/** @type {number} */ waypointsChange = 0,

			// whether track switched on or off
			/** @type {number} */ trackChange = 0,

			// whether autostart switched on or off
			/** @type {number} */ autoStartChange = 0,

			// whether autofit switched on or off
			/** @type {number} */ autoFitChange = 0;

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
				} else {
					newValue = ViewConstants.modePause;
					me.generationOn = false;
				}

				// reset
				me.afterEdit("");
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

					// check for exclusive playback mode
					if (me.exclusivePlayback) {
						Controller.stopOtherViewers(me);
					}

					// zoom text
					me.menuManager.notification.notify("Play", 15, 40, 15, true);
					me.lastPlaybackMS = performance.now();
				} else {
					// pause
					me.generationOn = false;
					me.afterEdit("");

					// zoom text unless STOP and generation notifications disabled
					if (!(me.engine.counter === me.stopGeneration && !me.stopDisabled && !me.genNotifications)) {
						me.menuManager.notification.notify("Pause", 15, 40, 15, true);
					}
					me.lastPlaybackMS = performance.now() - me.lastPlaybackMS;
					if (me.showPlayDuration) {
						me.menuManager.notification.notify("Playback time " + (me.lastPlaybackMS / 1000).toFixed(2), 15, 300, 15, false);
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
							// compute next generation
							me.computeNextGeneration();

							me.fixedPointCounter = me.engine.counter * me.refreshRate;

							// check if life jsut stopped
							if (me.lifeEnded()) {
								// remember the generation that life stopped
								if (me.diedGeneration === -1) {
									me.diedGeneration = me.engine.counter;

									// notify simulation stopped unless loop defined and enabled
									if (me.genNotifications && !(me.loopGeneration !== -1 && !me.loopDisabled)) {
										if (me.engine.isPCA || me.engine.isMargolus) {
											me.menuManager.notification.notify("Life ended at generation " + (me.engine.counterMargolus + me.genOffset), 15, 600, 15, false);
										} else {
											me.menuManager.notification.notify("Life ended at generation " + (me.engine.counter + me.genOffset), 15, 600, 15, false);
										}
									}
								}
							}
						}
						me.engine.reversePending = true;
					} else {
						// check if at start
						if (me.engine.counter > 0) {
							// adjust undo stack pointer
							me.setUndoGen(me.engine.counter - me.gensPerStep);

							// check current population
							numChanged = me.engine.population;

							// run from start to previous generation
							me.runTo(me.engine.counter - me.gensPerStep);

							// check if population was zero and is now non-zero after step back
							if (numChanged === 0 && me.engine.population > 0) {
								// reset died generation since cells are alive now
								me.diedGeneration = -1;
							}

							// re-convert grid to colours so rainbow on/off works
							if (me.engine.counter === 0) {
								if (!me.engine.isLifeHistory) {
									if (me.engine.multiNumStates === -1) {
										me.engine.resetColourGridBox(me.engine.grid16);
									} else {
										me.engine.convertToPensTile();
									}
								}
							}
						}
					}

					if (me.autoFit) {
						me.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);
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
					me.lastPlaybackMS = performance.now() - me.lastPlaybackMS;
					if (me.showPlayDuration) {
						me.menuManager.notification.notify("Playback time " + (me.lastPlaybackMS / 1000).toFixed(2), 15, 300, 15, false);
					}
				} else {
					// step
					me.nextStep = true;
					me.afterEdit("");
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
	/** @returns {Array} */
	View.prototype.viewAngleRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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

	// convert Tilt value to 0..1
	/** @returns {number} */
	View.prototype.convertFromTilt = function(/** @type {number} */ value) {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ mult = 0.5 / (0.5 - ViewConstants.deadZoneTilt / 2);

		result = (value - ViewConstants.minTilt) / (ViewConstants.maxTilt - ViewConstants.minTilt);
		if (result < (0.5 - ViewConstants.deadZoneTilt / 2)) {
			result *= mult;
		} else {
			if (result > (0.5 + ViewConstants.deadZoneTilt / 2)) {
				result -= (0.5 + ViewConstants.deadZoneTilt / 2);
				result = result * mult + 0.5;
			} else {
				result = 0.5;
			}
		}

		return result;
	};

	// convert 0..1 to the Tilt value
	/** @returns {number} */
	View.prototype.convertToTilt = function(/** @type {number} */ value) {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ mult = 0.5 / (0.5 - ViewConstants.deadZoneTilt / 2);

		// ignore dead zone
		if (value < (0.5 - ViewConstants.deadZoneTilt / 2)) {
			value *= mult;
		} else {
			if (value > (0.5 + ViewConstants.deadZoneTilt / 2)) {
				value -= (0.5 + ViewConstants.deadZoneTilt / 2);
				value = value * mult + 0.5;
			} else {
				value = 0.5;
			}
		}

		result = (ViewConstants.maxTilt - ViewConstants.minTilt) * value + ViewConstants.minTilt;
		return result;
	};

	// tilt range
	/** @returns {Array} */
	View.prototype.viewTiltRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		// check if changing
		if (change) {
			// set manual change happened
			me.manualChange = true;

			// set tilt
			me.engine.tilt = me.convertToTilt(newValue[0]);
		}

		// return value
		return [newValue[0], me.engine.tilt];
	};

	// layers range
	/** @returns {Array} */
	View.prototype.viewLayersRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {number} */ result;

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
	/** @returns {Array} */
	View.prototype.viewDepthRange = function(/** @type {Array} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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
	/** @returns {boolean} */
	View.prototype.drawCells = function(/** @type {number} */ toX, /** @type {number} */ toY, /** @type {number} */ fromX, /** @type {number} */ fromY) {
		var	/** @type {number} */ startCellX = 0,
			/** @type {number} */ startCellY = 0,
			/** @type {number} */ endCellX = 0,
			/** @type {number} */ endCellY = 0,
			/** @type {number} */ bLeftX = Math.round(-this.engine.boundedGridWidth / 2),
			/** @type {number} */ bRightX = Math.floor((this.engine.boundedGridWidth - 1) / 2),
			/** @type {number} */ bBottomY = Math.round(-this.engine.boundedGridHeight / 2),
			/** @type {number} */ bTopY = Math.floor((this.engine.boundedGridHeight - 1) / 2),
			/** @type {number} */ testState = this.drawState,
			/** @type {boolean} */ result = false;

		// check if this is the start of drawing
		if (fromX === -1 && fromY === -1) {
			// check if location within bounded box
			if (this.engine.boundedGridType !== -1) {
				if (this.engine.boundedGridWidth === 0) {
					bLeftX = -this.engine.width / 2;
					bRightX = this.engine.width / 2 - 1;
				}

				if (this.engine.boundedGridHeight === 0){
					bBottomY = -this.engine.height / 2;
					bTopY = this.engine.height / 2 - 1;
				}

				this.updateCellLocation(toX, toY);
				startCellX = this.cellX - this.engine.width / 2;
				startCellY = this.cellY - this.engine.height / 2;

				// if outside bounded grid then do not start drawing
				if (startCellX < bLeftX || startCellX > bRightX || startCellY < bBottomY || startCellY > bTopY) {
					return true;
				}
			}

			this.penColour = this.readCell();

			// adjust test state if generations style
			if (this.engine.multiNumStates > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)) {
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

		// if the population is now non-zero then reset died generation
		if (this.engine.population > 0) {
			this.diedGeneration = -1;
		}

		return result;
	};

	// update zoom from pinch
	View.prototype.updateZoomFromPinch = function() {
		var	/** @type {number} */ startDx = Math.abs(this.pinchStartX2 - this.pinchStartX1),
			/** @type {number} */ startDy = Math.abs(this.pinchStartY2 - this.pinchStartY1),
			/** @type {number} */ currentDx = Math.abs(this.pinchCurrentX2 - this.pinchCurrentX1),
			/** @type {number} */ currentDy = Math.abs(this.pinchCurrentY2 - this.pinchCurrentY1),

			// compute the distance between the two touches at start
			/** @type {number} */ startDelta = Math.sqrt((startDx * startDx) + (startDy * startDy)),

			// compute the distance between the two touches now
			/** @type {number} */ currentDelta = Math.sqrt((currentDx * currentDx) + (currentDy * currentDy)),

			// get the current zoom
			/** @type {number} */ currentZoom = ViewConstants.minZoom * Math.pow(ViewConstants.maxZoom / ViewConstants.minZoom, this.zoomItem.current[0]);

		// adjust the zoom by the ratio of the distance between touches now and at start
		currentZoom *= (currentDelta / startDelta);

		// ensure zoom is in allowed range
		if (currentZoom < ViewConstants.minZoom) {
			currentZoom = ViewConstants.minZoom;
		} else {
			if (currentZoom > ViewConstants.maxZoom) {
				currentZoom = ViewConstants.maxZoom;
			}
		}

		// apply new zoom
		currentZoom = Math.log(currentZoom / ViewConstants.minZoom) / Math.log(ViewConstants.maxZoom / ViewConstants.minZoom);
		this.zoomItem.current = this.viewZoomRange([currentZoom, currentZoom], true, this);

		// save current position as start position
		this.pinchStartX1 = this.pinchCurrentX1;
		this.pinchStartY1 = this.pinchCurrentY1;
		this.pinchStartX2 = this.pinchCurrentX2;
		this.pinchStartY2 = this.pinchCurrentY2;
	};

	// pinch callback
	View.prototype.viewPinch = function(/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {number} */ mode, /** @type {View} */ me) {
		if (!me.noGUI) {
			switch (mode) {
				case 0:
					// pinch started
					me.pinchStartX1 = x1;
					me.pinchStartY1 = y1;
					me.pinchStartX2 = x2;
					me.pinchStartY2 = y2;
					me.pinchCurrentX1 = x1;
					me.pinchCurrentY1 = y1;
					me.pinchCurrentX2 = x2;
					me.pinchCurrentY2 = y2;
					break;

				case 1:
					// first touch moved
					me.pinchCurrentX1 = x1;
					me.pinchCurrentY1 = y1;
					me.updateZoomFromPinch();
					break;

				case 2:
					// second touch moved
					me.pinchCurrentX2 = x1;
					me.pinchCurrentY2 = y1;
					me.updateZoomFromPinch();
					break;

				default:
					// ignore others
					break;
			}
		}

		// ensure menu manager updates
		me.menuManager.setAutoUpdate(true);
	};

	// view menu wakeup callback
	View.prototype.viewWakeUp = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ dragOn, /** @type {View} */ me) {
		// on mouse release pause playback so GUI unhides
		if (me.hideGUI) {
			if (!dragOn) {
				me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
			}
		}
	};

	// view menu background drag callback
	View.prototype.viewDrag = function(/**@type {number} */ x, /**@type {number} */ y, /**@type {boolean} */ dragOn, /** @type {View} */ me) {
		if (!me.noGUI) {
			me.viewDoDrag(x, y, dragOn, me, false);
		}
	};

	// drag help
	View.prototype.dragHelp = function(/** @type {View} */ me, /** @type {number} */ y) {
		// compute the movement
		var	/** @type {number} */ dy = (me.lastDragY - y) / me.helpFontSize;

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
	View.prototype.dragErrors = function(/** @type {View} */ me, /** @type {number} */ y) {
		// compute the movement
		var	/** @type {number} */ dy = (me.lastDragY - y) / me.helpFontSize;

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

	// drag period cell table
	View.prototype.dragTable = function(/** @type {View} */ me, /** @type {number} */ y) {
		// compute the movement
		var	/** @type {number} */ dy = ((me.lastDragY - y) / (24 * this.viewMenu.xScale));

		// scroll period map
		if (me.lastDragY !== -1) {
			me.engine.tableStartRow += dy;
			if (me.engine.tableStartRow < 0) {
				me.engine.tableStartRow = 0;
			}
			if (me.engine.tableStartRow > me.engine.tableMaxRow) {
				me.engine.tableStartRow = me.engine.tableMaxRow;
			}
		}
	};

	// drag grid (pan)
	View.prototype.dragPan = function(/** @type {View} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// compute the movement
		var	/** @type {number} */ dx = (me.lastDragX - x) / me.engine.camZoom,
			/** @type {number} */ dy = ((me.lastDragY - y) / me.engine.camZoom) / me.engine.getYFactor(),
			/** @type {number} */ angle = 0,
			/** @type {number} */ sinAngle = 0,
			/** @type {number} */ cosAngle = 0;

		// do nothing if AutoFit enabled
		if (me.autoFit) {
			return;
		}

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
	/** @returns {boolean} */
	View.prototype.dragDraw = function(/** @type {View} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		var	/** @type {boolean} */ wasPlaying = me.generationOn,
			/** @type {number} */ savedIndex = me.currentEditIndex,
			/** @type {boolean} */ result = false;

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

			// draw cells and get a flag indicating if draw was cancelled (because draw is out of bounded grid)
			result = me.drawCells(x, y, me.lastDragX, me.lastDragY);

			// if playback was on then save undo record
			if (wasPlaying) {
				me.afterEdit("");
			}
		}

		return result;
	};

	// drag select
	View.prototype.dragSelect = function(/** @type {View} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		if (!me.isPasting) {
			me.doDragSelect(me, x, y);
		}
	};

	// compute bounded grid bounding box and grid offset
	View.prototype.getBoundingBox = function(/** @type {BoundingBox} */ box, /** @type {number} */ offset) {
		var	/** @type {number} */ xOff = this.engine.width >> 1,
			/** @type {number} */ yOff = this.engine.height >> 1;

		if (this.posDefined) {
			xOff -= Math.floor(this.specifiedWidth / 2) - this.xOffset - this.xOffset;
			yOff -= Math.floor(this.specifiedHeight / 2) - this.yOffset - this.yOffset;
		} else {
			xOff -= Math.floor(this.specifiedWidth / 2);
			yOff -= Math.floor(this.specifiedHeight / 2);
		}

		if (this.engine.boundedGridWidth === 0) {
			box.leftX = 0;
			box.rightX = this.engine.width - 1;
		} else {
			box.leftX = Math.round((this.engine.width - this.engine.boundedGridWidth) / 2) + offset;
			box.rightX = box.leftX + this.engine.boundedGridWidth - 1;
		}

		if (this.engine.boundedGridHeight === 0) {
			box.bottomY = 0;
			box.topY = this.engine.height - 1;
		} else {
			box.bottomY = Math.round((this.engine.height - this.engine.boundedGridHeight) / 2) + offset;
			box.topY = box.bottomY + this.engine.boundedGridHeight - 1;
		}

		return [xOff, yOff];
	};

	// process drag for selection
	View.prototype.doDragSelect = function(/** @type {View} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// selection box
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {BoundingBox} */ boundedBox = new BoundingBox(0, 0, 0, 0),

			// flag if off the grid
			/** @type {boolean} */ offGrid = false,

			// offset to middle of grid
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),

			// box offset for Margolus
			/** @type {number} */ boxOffset = (me.engine.isMargolus ? -1 : 0),

			// x and y offset return from function
			/** @type {Array<number>} */ xyOff = [];

		// check for infinite dimension bounded grid
		if (me.engine.boundedGridType !== -1) {
			xyOff = me.getBoundingBox(boundedBox, boxOffset);
			xOff = xyOff[0];
			yOff = xyOff[1];
		}

		// check for drag start
		if (x !== -1 && y !== -1) {
			// check for existing selection
			if (me.isSelection) {
				me.removeSelection(me);
			}

			// convert display coordinates to cell location
			me.updateCellLocation(x, y);

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
							if (me.cellX < boundedBox.leftX || me.cellX > boundedBox.rightX || me.cellY < boundedBox.bottomY || me.cellY > boundedBox.topY) {
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

					/* TBD
					if (me.engine.isHex) {
						var dx = (me.cellX - xOff) - box.leftX;
						var dy = (me.cellY - yOff) - box.bottomY;
						var ax = Math.abs(dx);
						var ay = Math.abs(dy);
						var max = ax > ay ? ax : ay;
						dx = dx < 0 ? -max : max;
						dy = dy < 0 ? -max : max;
						if ((max & 1) === 0) {
							box.rightX = box.leftX + dx;
							box.topY = box.bottomY + dy;
						}
					} else {
						box.rightX = me.cellX - xOff;
						box.topY = me.cellY - yOff;
					}
					*/
				}

				// check grid for growth
				if (me.drawingSelection) {
					me.checkSelectionSize(me);
					if (me.engine.boundedGridType !== -1) {
						xyOff = me.getBoundingBox(boundedBox, boxOffset);
						xOff = xyOff[0];
						yOff = xyOff[1];
					} else {
						xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
						yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
					}
				}

				// clip to bounded grid if specified
				if (me.drawingSelection && me.engine.boundedGridType !== -1) {
					// adjust for mid-grid
					boundedBox.leftX -= xOff;
					boundedBox.rightX -= xOff;
					boundedBox.bottomY -= yOff;
					boundedBox.topY -= yOff;

					// test against grid boundaries
					if (box.leftX < box.rightX) {
						if (box.leftX < boundedBox.leftX) {
							box.leftX = boundedBox.leftX;
						}
						if (box.rightX > boundedBox.rightX) {
							box.rightX = boundedBox.rightX;
						}
					} else {
						if (box.rightX < boundedBox.leftX) {
							box.rightX = boundedBox.leftX;
						}
						if (box.leftX > boundedBox.rightX) {
							box.leftX = boundedBox.rightX;
						}
					}
					if (box.bottomY < box.topY) {
						if (box.bottomY < boundedBox.bottomY) {
							box.bottomY = boundedBox.bottomY;
						}
						if (box.topY > boundedBox.topY) {
							box.topY = boundedBox.topY;
						}
					} else {
						if (box.topY < boundedBox.bottomY) {
							box.topY = boundedBox.bottomY;
						}
						if (box.bottomY > boundedBox.topY) {
							box.bottomY = boundedBox.topY;
						}
					}
				}
			}
		}
	};

	// remove selection
	View.prototype.removeSelection = function(/** @type {View} */ me) {
		me.isSelection = false;
		me.afterSelectAction = false;
		me.afterEdit("cancel selection");
		me.drawingSelection = false;
	};

	// drag ended for select
	View.prototype.dragEndSelect = function(/** @type {View} */ me) {
		if (me.isPasting) {
			// perform paste at the mouse position
			me.performPaste(me, me.cellX, me.cellY, true);
		} else {
			me.doDragEndSelect(me);
		}
	};

	// auto shrink a selection
	View.prototype.autoShrinkSelection = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {BoundingBox} */ zoomBox = me.engine.zoomBox,
			/** @type {number} */ leftX = selBox.leftX,
			/** @type {number} */ bottomY = selBox.bottomY,
			/** @type {number} */ rightX = selBox.rightX,
			/** @type {number} */ topY = selBox.topY,
			/** @type {number} */ swap = 0,
			/** @type {number} */ minX = 0,
			/** @type {number} */ maxX = 0,
			/** @type {number} */ minY = 0,
			/** @type {number} */ maxY = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ population = 0,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		// ensure bounding box is correct
		me.engine.shrinkNeeded = true;
		me.engine.doShrink();

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
			topY = zoomBox.topY - yOff;
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
	View.prototype.doDragEndSelect = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0;

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
		}
	};

	// drag ended for pick
	View.prototype.dragEndPick = function(/** @type {View} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		var	/** @type {number} */ state = 0;

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
	View.prototype.dragEndDraw = function(/** @type {View} */ me) {
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
	View.prototype.viewDoDrag = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ dragOn, /** @type {View} */ me, /** @type {boolean} */ fromKey) {
		var	/** @type {boolean} */ cancelled = false;

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
							// check if Cell Period Table displayed
							if (me.resultsDisplayed && me.periodMapDisplayed === 1 && me.engine.tableMaxRow !== 0) {
								me.dragTable(me, y);
							} else {
								// check if panning
								if (!(me.drawing || me.selecting) || fromKey) {
									me.dragPan(me, x, y);
								} else {
									// check if drawing
									if (me.drawing) {
										// drawing
										cancelled = me.dragDraw(me, x, y);
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
				}

				// save last drag position unless draw cancelled (by being out of bounded grid)
				if (!cancelled) {
					me.lastDragX = x;
					me.lastDragY = y;
				}
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
							if (me.pickReplace) {
								me.menuManager.notification.notify("Replace: Now click on a cell", 15, 180, 15, true);
							} else {
								me.menuManager.notification.notify("Pick: Now click on a cell", 15, 180, 15, true);
							}
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
	View.prototype.moveView = function(/** @type {number} */ dx, /** @type {number} */ dy) {
		// do nothing if AutoFit enabled
		if (this.autoFit) {
			return;
		}

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

	// return number of bits needed to represent given number
	/** @returns {number} */
	View.prototype.bitsFor = function(/** @type {number} */ n) {
		return Math.ceil(Math.log2(n + 1));
	};

	// decode a base64 string into a Uint8Array
	/** @returns {Uint8Array} */
	View.prototype.base64Decode = function(/** @type {string} */ dataString) {
		var	/** @type {Uint8Array} */ result = new Uint8Array(Math.ceil(dataString.length / 8) * 6),
			/** @type {number} */ i = 0,
			/** @type {number} */ c = 0,
			/** @type {number} */ cBit = 0,
			/** @type {number} */ byte = 0,
			/** @type {number} */ bit = 0,
			/** @type {number} */ cCode = 0;

		// read each character in the string
		bit = 7;
		c = 0;
		i = 0;
		byte = 0;

		while (c < dataString.length) {
			// convert character into 6 bits
			cCode = this.manager.base64Characters.indexOf(dataString.charAt(c));

			// add 6 bits to array
			for (cBit = 5; cBit >= 0; cBit -= 1) {
				byte |= ((cCode >> cBit) & 1) << bit;
				bit -= 1;

				// if current byte is full save it and move to next byte
				if (bit < 0) {
					result[i] = byte;
					byte = 0;
					bit = 7;
					i += 1;
				}
			}

			// next character
			c += 1;
		}

		// check if final byte needed
		if (bit < 7) {
			result[i] = byte;
		}

		// return the array
		return result;
	};

	// decode the base64 string into a LifeViewer image
	/** @returns {CanvasRenderingContext2D} */
	View.prototype.decode = function(/** @type {string} */ encodedData) {
		var	/** @type {BitVector} */ data = new BitVector(this.base64Decode(encodedData)),
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ left = 0,
			/** @type {number} */ right = 0,
			/** @type {number} */ bits = 0,
			/** @type {number} */ longBits0 = 0,
			/** @type {number} */ longBits1 = 0,

			// read the image width and height
			/** @type {number} */ imageWidth = data.getValue(12),
			/** @type {number} */ imageHeight = data.getValue(12),

			// read the top and bottom border size (they are the same)
			/** @type {number} */ topBorder = data.getValue(4),

			/** @type {number} */ numIcons = imageWidth / imageHeight,
			/** @type {number} */ iconWidth = imageWidth / numIcons,
			/** @type {Uint8Array} */ borderLeft = new Uint8Array(numIcons),
			/** @type {Uint8Array} */ borderRight = new Uint8Array(numIcons),
			/** @type {Uint8Array} */ iconOrder = new Uint8Array(numIcons),
			/** @type {number} */ pixelsWidth = imageWidth,
			/** @type {number} */ pixelsHeight = imageHeight - topBorder * 2,
			/** @type {number} */ uniqueWhites = 0,
			/** @type {number} */ uniqueBlacks = 0,
			/** @type {number} */ maxWhiteDelta = 0,
			/** @type {number} */ maxBlackDelta = 0,
			/** @type {Uint32Array} */ uniqueBlackValues = null,
			/** @type {Uint32Array} */ uniqueWhiteValues = null,
			/** @type {Uint32Array} */ rows = null,
			/** @type {Uint32Array} */ column = null,
			/** @type {number} */ rowOffset = 0,
			/** @type {number} */ lastOffset = 0,
			/** @type {number} */ currentRow = 0,
			/** @type {number} */ currentColumn = 0,
			/** @type {number} */ pixel = 0,
			/** @type {number} */ rowType = 0,
			/** @type {number} */ runCount = 0,
			/** @type {number} */ nextBits = 0,
			/** @type {number} */ index = 0,

			// canvas for decoded image
			/** @type {HTMLCanvasElement} */ imageCanvas = null,
			/** @type {CanvasRenderingContext2D} */ imageContext = null,
			/** @type {ImageData} */ imageData = null,
			/** @type {Uint32Array} */ imageData32 = null,

			// pixel colour
			/** @const {number} */ whitePixel = 0xffffffff;

		// read the icon borders and compute the width of the reduced image
		for (i = 0; i < numIcons; i += 1) {
			borderLeft[i] = data.getValue(4);
			borderRight[i] = data.getValue(4);

			// subtract the border widths for this icon from the original image width
			pixelsWidth -= borderLeft[i] + borderRight[i];
		}

		// read the icon order
		bits = this.bitsFor(numIcons);
		for (i = 0; i < numIcons; i += 1) {
			iconOrder[i] = data.getValue(bits);
		}

		// read the number of entries for the unique black counts
		bits = this.bitsFor(Math.ceil(-1 + Math.sqrt(1 - 8 * (-pixelsWidth * pixelsHeight)) / 2));
		uniqueBlacks = data.getValue(bits);

		// read the maximum black delta
		maxBlackDelta = data.getValue(this.bitsFor(pixelsWidth));

		// allocate the values array
		uniqueBlackValues = new Uint32Array(uniqueBlacks);

		// read the first value
		uniqueBlackValues[0] = data.getValue(this.bitsFor(pixelsWidth));

		// read the number of sequential ones
		j = data.getValue(this.bitsFor(uniqueBlacks));

		i = 1;
		while (j > 0) {
			uniqueBlackValues[i] = uniqueBlackValues[i - 1] + 1;
			i += 1;
			j -= 1;
		}

		// read the number of 2 bit entries
		j = i + data.getValue(this.bitsFor(uniqueBlacks));
		bits = 2;
		while (i < j) {
			uniqueBlackValues[i] = uniqueBlackValues[i - 1] + data.getValue(bits) + 1;
			i += 1;
		}

		// read the number of 3 bit entries
		j = i + data.getValue(this.bitsFor(uniqueBlacks));
		bits = 3;
		while (i < j) {
			uniqueBlackValues[i] = uniqueBlackValues[i - 1] + data.getValue(bits) + 1;
			i += 1;
		}

		// read the deltas
		bits = this.bitsFor(maxBlackDelta);
		while (i < uniqueBlacks) {
			uniqueBlackValues[i] = uniqueBlackValues[i - 1] + data.getValue(bits);
			i += 1;
		}

		// read the number of entries for the unique white counts
		bits = this.bitsFor(Math.ceil(-1 + Math.sqrt(1 - 8 * (-pixelsWidth * pixelsHeight)) / 2));
		uniqueWhites = data.getValue(bits);

		// read the maximum white delta
		maxWhiteDelta = data.getValue(this.bitsFor(pixelsWidth));

		// allocate the values array
		uniqueWhiteValues = new Uint32Array(uniqueWhites);

		// read the first value
		uniqueWhiteValues[0] = data.getValue(this.bitsFor(pixelsWidth));

		// read the number of sequential ones
		j = data.getValue(this.bitsFor(uniqueWhites));

		i = 1;
		while (j > 0) {
			uniqueWhiteValues[i] = uniqueWhiteValues[i - 1] + 1;
			i += 1;
			j -= 1;
		}

		// read the number of 2 bit entries
		j = i + data.getValue(this.bitsFor(uniqueWhites));
		bits = 2;
		while (i < j) {
			uniqueWhiteValues[i] = uniqueWhiteValues[i - 1] + data.getValue(bits) + 1;
			i += 1;
		}

		// read the number of 3 bit entries
		j = i + data.getValue(this.bitsFor(uniqueWhites));
		bits = 3;
		while (i < j) {
			uniqueWhiteValues[i] = uniqueWhiteValues[i - 1] + data.getValue(bits) + 1;
			i += 1;
		}

		// read the deltas
		bits = this.bitsFor(maxWhiteDelta);
		while (i < uniqueWhites) {
			uniqueWhiteValues[i] = uniqueWhiteValues[i - 1] + data.getValue(bits);
			i += 1;
		}

		// read the row order
		bits = this.bitsFor(pixelsHeight);
		rows = new Uint32Array(pixelsHeight);
		for (i = 0; i < pixelsHeight; i += 1) {
			rows[i] = data.getValue(bits);
		}

		// create the array that maps borderless image columns to full size image columns
		column = new Uint32Array(pixelsWidth);
		j = 0;
		k = 0;
		for (i = 0; i < numIcons; i += 1) {
			left = borderLeft[i];
			right = borderRight[i];
			for (j = 0; j < iconWidth - left - right; j += 1) {
				column[k] = iconOrder[i] * iconWidth + left + j;
				k += 1;
			}
		}

		// create a canvas to store the image
		imageCanvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
		imageCanvas.width = imageWidth;
		imageCanvas.height = imageHeight;
		imageContext = /** @type {!CanvasRenderingContext2D} */ (imageCanvas.getContext("2d"));

		// clear the canvas
		imageContext.clearRect(0, 0, imageWidth, imageHeight);

		// get the image data
		imageData = imageContext.createImageData(imageWidth, imageHeight);
		imageData32 = new Uint32Array(imageData.data.buffer);

		// read each row of data
		i = 0;
		rowOffset = -1;
		lastOffset = 0;
		currentRow = 0;
		longBits0 = this.bitsFor(uniqueBlackValues.length);
		longBits1 = this.bitsFor(uniqueWhiteValues.length);

		while (currentRow < pixelsHeight) {
			if (rowOffset === -1) {
				rowType = data.getValue(1);
				pixel = data.getValue(1);

				// find the start of the row in the image
				rowOffset = (rows[currentRow] + topBorder) * imageWidth;
				currentColumn = 0;
			} else {
				// read the next run count
				nextBits = data.getValue(2);
				switch(nextBits) {
					case 0:
						nextBits = data.getValue(1);
						if (nextBits === 0) {
							runCount = 4;	// code 000
						} else {
							runCount = 3;	// code 001
						}
						break;

					case 1:
						runCount = 0;	// code 01
						break;

					case 2:
						nextBits = data.getValue(1);
						if (nextBits === 1) {
							runCount = 2;	// code 101
						} else {
							nextBits = data.getValue(1);
							if (nextBits === 0) {
								runCount = 5;	// code 1000
							} else {
								nextBits = data.getValue(1);
								if (nextBits === 0) {
									runCount = 6;	// code 10010
								} else {
									runCount = 7;	// code 10011
								}
							}
						}

						break;

					case 3:
						runCount = 1;	// code 11
						break;
				}

				// check for long run
				if (runCount === 0) {
					// long count
					if (pixel === 0) {
						index = data.getValue(longBits0);

						// check for end of row
						if (index === uniqueBlackValues.length) {
							runCount = pixelsWidth - currentColumn;

						} else {
							runCount = uniqueBlackValues[index];
						}
					} else {
						index = data.getValue(longBits1);

						// check for end of row
						if (index === uniqueWhiteValues.length) {
							runCount = pixelsWidth - currentColumn;

						} else {
							runCount = uniqueWhiteValues[index];
						}
					}

					// output pixels
					for (j = 0; j < runCount; j += 1) {
						if (pixel === 1) {
							imageData32[rowOffset + column[currentColumn]] = whitePixel;
						}
						if (rowType === 1) {
							imageData32[rowOffset + column[currentColumn]] ^= imageData32[lastOffset + column[currentColumn]];
						}
						currentColumn += 1;
					}
				} else {
					// small count
					// output pixels
					for (j = 0; j < runCount; j += 1) {
						if (pixel === 1) {
							imageData32[rowOffset + column[currentColumn]] = whitePixel;
						}
						if (rowType === 1) {
							imageData32[rowOffset + column[currentColumn]] ^= imageData32[lastOffset + column[currentColumn]];
						}
						currentColumn += 1;
					}
				}

				// invert pixel
				pixel = 1 - pixel;

				// check for end of row
				if (currentColumn === pixelsWidth) {
					// remember the last row for XOR
					lastOffset = rowOffset;

					// next row
					currentRow += 1;
					rowOffset = -1;
				}
			}
		}

		// write the pixels to the image
		imageContext.putImageData(imageData, 0, 0);

		return imageContext;
	};

	// create icons
	View.prototype.createIcons = function(/** @type {CanvasRenderingContext2D} */ context) {
		// load icon file
		var	/** @const {number} */ w = 40,
			/** @const {number} */ h = 40,
			/** @type {CanvasRenderingContext2D} */ icons = ViewConstants.icons,
			/** @type {Array<number>} */ gridIcons = [8, 11, 16, 17, 44],
			/** @type {number} */ i = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ offset = 0,
			/** @type {ImageData} */ data = null,
			/** @type {Uint32Array} */ data32 = null,
			/** @const {number} */ greyPixel = 0xff707070;

		// check if the icons exist
		if (icons === null) {
			// create the icon image
			icons = this.decode("dYAoERERERISIiIiIiIiJEM1WIZofMZlWId3d3iHd3iYiIiIiIiIh3uIuJi///M5mZMyC0EbBhyUl4KjK22WobTmDU1FnYowAQgxBSlXHn5JaKT5p7jeDIBDMugiAAgSABKlFgQIAoGA8EIEE80EEEQkdAREbIKgUAQwKWOERomkoiqgsecuwaYy0WU24SQ68O+MLBCJEHGFICBKT58+egefPnz458+fPQFQFQFQDJTROEXxnGg9L/pz7947/886KzofQOLLR0kNoL6KgNADA7oD6KgONC8kyDsX0DUlLTpGSUQIAwEEJ/////+l16AZIJYVBSoOxUVRUoEDISQK4hBAiQOgO3//6z//8oC1nBLnz58mTnQ5SxTn3vnH6Av+is6RmyM5kr9DaC/H/oApbRG0FTm/H635d5bKQLJA75rVAVAVAV1/n+255aF0NovxcVG8tJUVE9P49CUVDVB2KhKgQZT7pHFQ+stDbOq91NoID9IagotoqEqNILHqaB3fMIwYMGC4tDlLFQdKAseeo/SHk4/YdygNKm1B2mgBB3tnFukclD1nqnKB9RHKp4iQKaIKkQLJA75r1AVAVAba0dUdVH/f/EdOktI9IvfQdloDlUZeoWWUBoe9QJtQdpJBQdt7wgdI2lD1WUZkcVIVHBHVF1K1F8tAcv1JoKDeoa+RGmBUFCFqMoq4UDuFCL3fMG9N6b03pvWvE4Sf6HKWKdqA5f99AaL/R+eL31jURL/QGh6iag6gCCg6UUBJ+EPWeqckrCGt6I0RorvLunqKpUCyQO+atQFQFQFdWMX/yOdQehtE45n0VijSdQ1g3QGhqif0D+gaKg6P+UZyt5Ieo7lpXQWzamaiqiqdRaDuc9Q1vwKiNFCQRVReNj407u/nz589Dz58+eDem9N6b07chSlLFRZsgL/+pdCG6wqGsG6A4vxUT+gf0DRUHZoBBWkoXqFPTVypyW3OcEdp+VRFRIkE/jUyBZIHfz58+el58+fODBgwULUBUBXCUsVOfvcZrEx3Glaiu6UqGqDqb0Dp7SOnND6A04qUtTtR9FQeoNEfpD/+o/VVWKCP/9L8tGf/6A3fz58+el58+fODBgwW3CrKWKdvn+/f/x3U1Q2deaAPoDi+kf5/oPGg7CROVDejTiBXKnGSKcEegbSiCiBIO/nz589Lz58+cGDBgoCoCoCoCt0pYp3N+3/t+X6G0NobRGi8YxqiqmxULjQX4/U2oc06W5adVKOqGo8IbT2i9F8+MrFXUR3SBCWoqiRFQFRCJDNZ2QqylinvPnH8dvqQovXfK99Aaa7x3SdhMnMYx6JPTVypxmLjBlMKASCg7oYiQLvmnoCoC3i3bxtR1pUHHLye7Dtxyx2ohSgM26Co9TOoGpzQfSFqM0DoXPc6F5VHVIWqqEdUHVLULornpzRv9qKqW1ZXfOyFWUsU/f+f358ah0ZqtT8iLP+iqUB/H6F7oKxakpC1A4wjUElcqccQSDInhIaGEgoAhiJAu+aYkJGZbKZBlLFP95d83jjQdptuiNM40BjWiFKTRFQX4/RBS+htHaE18qT9VNT+mtF30YesaqDQG752Qqylinv47e+f0n//p/VOhu2IJlejQOgNAIUMEDYoR39LU4x35o3RE1cqcaMyKKm6Q0MJBQBD0W0V3zA4MGDBjqCoKgsMuEWoQRSxTxJIuO/oc220qjGgsap0JRUkhUFQOmcaF0BoLGgdBaZIKKVJ2q2oHRWgdMaR+o0pPCJDIkVUMijlu+YHBgwYLbjhSlLFP8u/jHfxrbVOhu2IFj9AaA0BoKEQEBYs0f+lB0aBQJxAkiCCCFTjRVAUSjQSQJxNLGMbvmBwYMGDHUFQVBYZUcKUpYp/FjP//fxr7GhMbMhK4/ROnNMUcsVYaAx/////6cqxqA6ZG6D0to/SGgMrFnU9jd8wKb03pvTencpSxT3L//+35a61RobtA8Efz0DoDHERoIIDioFDf0pMaBPJMSyk6LKiumYQlCgiiChEEkCcTO+YN6b03pvTcICoCoCt82o60p6x+L5zR+tv5Y0NjT2eNQVD1Pc9M5590DRIVAUSFFR1+Wh6jgjqatLOoSoXSmk81T61stEZ7u+YN6b03pvTeuUpYp7t7Fz047rYqfQ3aReXbeegdAZ0ToEToqDmNLHot4JnPRUyUpjQGN0TtmKChQdRFQqCSBOpTnvLu75g3pvTem9N7agKgKgKp9HaE0dzkjpZGAAMHkjpG/mO28u0yR0k5joAuNM2dE1BCCUXP6NK5qD0bgWgIvGMAAYwABmreoLGi9JaC0BUTF8oPYtSInXfz58+el58+fKmDBgwU/Lnz58miUsU7/bPjj9d6mvJAd/xeXcaA0BoDvO9n2Ql4qFg30zREuJJKUbtkhMTt9D6I0MgkgTyS13rQ8+fPnoPQOgc4YjSGKNIY4qOsskAAG/xUdULbUHT/8qjrGmYAAEXQWif56P0TpFVajs6ZRoqERCFIAAKKoIAAkAAC7+fPnz0PPnz59YEufPnyaJSxUvabLPa0v40B34PIDQGgNAaE0JIILUTT/6ZNkhYSUJ6oSu+auaM0ZpqkqQqAqQqAqQoNIAANIqQqE7xfv2nsVIVO4wABjTGdBaAUr+xp6otEiESAIAAIqKIAAkAAC753FLFT6B8xWn8tBn72oAhCgkKD/QcgiSJC13zVqAqAqAqiqSsqkrKpKkpYmpKozp9DVJVN40dj0SINmkFaDKDWJEha75hGDBgwXMUsVLzx9itQomEHu+a9QFQFQGn6lKKlKKlLL/////////4qUssaB73jlUpU9pDCQpIqG3fMG9N6b03pvXKwUHGgO/tiHfNaoCoCoCp+pa2pa2pap6paoynQlOkrV50loaHfMCm9N6b03p3KwUGLeWdE6WXu+acqgqCoFCEgAEgLRo7FTlGjsUY7Y7UJRo7BS5Shd8wODBgwXOwVFQFnu8nz589A8+fPnoHnz56EqAqAqAsufPnu+d4");
		//	icons = this.decode("dYAoERERERISIiIiIiIiJEM1WIZofMZlWId3d3iHd3iYiIiIiIiIh3uIuJi///M5mZMyC0EbBhyUl4KjK22WobTmDU1FnYowAQgxBSlXHn5JaKT5p7jeDIBDMugiAAgSABKlFgQIAoGA8EIEE80EEEQkdAREbIKgUAQwKWOERomkoiqgsecuwaYy0WU24SQ68O+MLBCJEHGFICBKqVussSLKzo2vlgvVAoUFuFk1KkbB8j0Vm9ZTNG1j5Wqcqt3ROjYuMydE2LIKdlmtjNhXiIjOfm650kZ7pa2Z186OtndNW0TpIiXT1tM6WtqiKnTVtdbZW2zp626tvnUVuD13UTqZ1VbjW5Vuc6ut0rdZ1lbtW71vFbzOtrep11b3GhW+RFzr4oK32t+rf52FchXI1yVcnXKVytcs6mdi6qdlXLyUJKMlKSnFDKslWr91T2b24g3PeXV213tbA77c1nf5z8PxzpPnz577nz58+OfPnz11dXVriuicOHGcb3UX7j9+8d/+edJneN9iy2ckdh9FXrGB3X9FXxoeTl7Yvvq2S14xyamWYDAT/////9RPK1xgtLoovbFSUVqD6Qk+XxDAESB19v//14f/+WK7PKS58+fJ3XO8FuXH73zj9d/0mdjm7pnMnaNHYfj/1lvst3pTsvx+6bl3lusZTs/nX1dXV1Kf5/tueWh0dw8XFaPLbKK09P49BRUa9sVBXwMp92PFeNT6O7zXb9XbAD9NttFtFQVokF1dcwHfzqTBgwYLy28FuW3pXY89a2m8nH7qrlelTa9tNAD29s4t2PJeK61SqA+suVTkSBcwgucynZ/NBV1dXu/7Os6xH9/8R07ZsfSL33tlr5VyXqGWV7xevja9tJIL2294fbHaXiujozI4qaswzrhUrXDlr5fudsIN6jfIjUYrUIa5KK7W6HcOnDfyovTem9N6b1oInDl/eC3KhV8v++vcP2tni99iayl/r3itNe1ZBe0pgOXw8V1qnYysI29EbLSd5d09FebKdn8xdXV1dSljF/8jnXujtOOZ9JijctRsG69GtP7799RXtH/KM5Q5PFZ8tK7Dd4qXUlSU6r725z1G34FZaQSCSuGN1eNQ3/Pnz57/Pnz54N6b03pvTvIQ8y3Kr5sgL/+89AbukqNg3XxfitP7799RXtmwgoEoevp5qZTsbbnOCO0/Ksq0iQVsauZTs/58+fPR58+fODBgwUNXV15UtypD97jNdxx3Glak7tVRr2ui32n2Pcd417ip51QrWor3bdl+m//rW3ZqxLR//qLluT//Xv+fPnz0efPnzgwYMF2EK8tyoXz/fv/47q6o53btZ9fF9j/n+9xvbDhxqPvXFlMpUkinBHvrSyLISD/nz589Hnz584MGDBXV1dXXkS3Khm/b/2/L9HR0dluGMY3PqlsVDjYfj9Xbm5p2/LUFMRXNrWCOn3DcOfGVqvrLumIRqallV1klFdmhhXluU/nzj+O33OLhun5Xvr3M7x3cthy44xj0p5qZSpMXGDKYbRINvdEiQL+dDXV28W7yRtZ2lt45eT3dVbjljtZO15t2FHu519XHe9IQcm+0Oe50PKs6mtVQzr2vOodJz3HaP9qSt90dfzQwry3Ktf+f358bm7k1e7+RFn/RXa/4/Q92Fi1xSEH2MPW2SmUqYgkGRPCbREg2hEiQL+dASEjMu/OXpblW7y75vHG9tNt2Wl4143SvtU2VYfj9kVFo7PQbqFK1UtVtzNwvuQ9dzrbr380MK8tyn/jt75/cv/+ral0e2IJlejfa9b6IfWKHt/b04x35tHZTUylS9Mimm6bREg2h4otor+a/BgwYMdatWsO7Q4OmBblOSSLjv7wbbaXPxsMal0FFbH22vtLxodewxvthpZBSKUK7PX2k32o9j+tEuXCUUpKimOW/mvwYMGC7COHmW5VuXfxjv42K1Lo9sQLH69evYQyC7Fm9/2odG+ZxZsIIIIUqU1iliGkzi5ljGN/NfgwYMGOtWrWHWRw8y3Ktixn//v43UY0GN3eErj9p3HUdHLFdJrx/////7jWJq+mRu92+1tNrytdpqfG/mvTem9N6b06qLcp+X//9vy3bdz9HtA8Efz32vHERsAvivn7+1TG+PJRyy5aLKipRmHy+wLIoGkzi5fyovTem9N6bhdXV15M2s7Snsfi+c0fsV/LGjjT5422vFT89Lzz7vqJCrokKKzvy3iswzprpbOoKh2rcuapN2qy2We7+VF6b03pvTeqotyn7exc9OO7FFSaPaReXbee+152nfCdFezG3PRbwTOekmS1Y140oTtmKC+9rKoWkygic95d38qL03pvTem9tXV1dUmz0Gz5yZyyMAAYPJnI38x23l2mTOTjjoAuNLs6JtsMHVz+0S7ZXu0cC0BwxjAAGMAAZrpqwxuG2bDXWmL5e7uVYxOv+fPnz0efPnypgwYMFWlz58+Tri3Kh/bPjj90+rryX3/F5dxr16+872fZCXioYN9LoiXEmyUarJIMTt942Wi0mTuLX68Tz58+e932+zhfjTYo02OKzsskAAG/xWdQ217T/8qzsaXAAAi7Daf57W2nY1Ws86W9SQyhCQAAUlBAAEgAAX/Pnz57/Pnz59a8ufPnydcW5efabLPa73/GvvweQGvXr0GgkGtaaf/SzZIYbIT1BX8xeaM0ZprnVNV1NV1NQaQAAaRU1Qd4v37T2KmqhjAAGNR52Gt27hY09cEskrIAAIqQgACQAAL+VaW5Um+8xXQ+W2fvash9g+9/eyCWMhB/MXV1dXVXrZZVssq2UluTWyuTp9GtldFjZ49LI2aZevS9WsZCD+dSYMGDBdkW5efPH2K74WmHu/mgq6ur1atVFaqK1WX/////////xWqyxvu945VqqfTYcFxFR38qL03pvTem9VSxt419/d9h/Ovq6urqtW9tb21vU9b1yU6CnbLXk7Zow/mvTem9N6b06qWNuLeWdp27y/nQlWrVnNCYAJhaNniuNGzxRjtjtQUbPBURai/mvwYMGC8usc+rs9+T58+e+58+fPfc+fPQVdXV2XPnz38/")
		}

		// re-colour the grid icons
		data = icons.getImageData(0, 0, icons.canvas.width, icons.canvas.height);
		data32 = new Uint32Array(data.data.buffer);

		for (i = 0; i < gridIcons.length; i += 1) {
			for (y = 0; y < h; y += 1) {
				offset = y * icons.canvas.width + gridIcons[i] * w;
				for (x = 0; x < w; x += 1) {
					if (data32[offset + x] !== 0) {
						data32[offset + x] = greyPixel;
					}
				}
			}
		}

		icons.putImageData(data, 0, 0);

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
		this.iconManager.add("advancesel", w, h);
		this.iconManager.add("cancelsel", w, h);
		this.iconManager.add("trirectgrid", w, h);
		this.iconManager.add("download", w, h);
		this.iconManager.add("changestate", w, h);
		this.iconManager.add("advanceoutside", w, h);
	};

	// check if a rule is valid and returns the rule string (or "" for invalid)
	/** @returns {string} */
	View.prototype.ruleIsValid = function(/** @type {string} */ ruleName) {
		var	/** @type {string} */ result = "",
			/** @type {string} */ patternText = "x = 1, y = 1, rule = ",
			/** @type {number} */ textPos = -1,
			/** @type {Pattern} */ pattern = null;

		// check if the rule name is blank
		if (ruleName === "") {
			// default to Conway's Life
			ruleName = "Life";
		}

		// remove all /r characters
		ruleName = ruleName.replace(/[\n\r]/g, "\n");

		// ignore lines beginning with # or blank lines
		textPos = ruleName.indexOf("\n");
		while (textPos === 0 || (textPos > 0 && ruleName[0] === "#")) {
			ruleName = ruleName.substring(textPos + 1);
			textPos = ruleName.indexOf("\n");
		}

		// only use first line
		textPos = ruleName.indexOf("\n");
		if (textPos !== -1) {
			ruleName = ruleName.substring(0, textPos).trim();

			// check for rule =
			textPos = ruleName.indexOf("rule=");
			if (textPos !== -1) {
				ruleName = ruleName.substring(textPos + 1 + "rule=".length).trim();
			} else {
				textPos = ruleName.indexOf("rule =");
				if (textPos !== -1) {
					ruleName = ruleName.substring(textPos + 1 + "rule =".length).trim();
				}
			}
		}

		// create an empty pattern
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
			result = ruleName;
			pattern = null;
		}

		return result;
	};

	// change rule
	View.prototype.changeRule = function(/** @type {View} */ me) {
		var	/** @type {string} */ patternText = "",
			/** @type {number} */ index = -1,
			/** @type {string} */ ruleName = (me.patternAliasName === "" ? me.patternRuleName : me.patternAliasName) + me.patternBoundedGridDef,
			/** @type {string|null} */ result = null;

		// if the current rule name is blank (typically after an error) then use the last valid one
		if (ruleName === "") {
			ruleName = this.lastRuleName;
		}

		// prompt for the new rule name
		result = window.prompt("Change rule", ruleName);

		// check if the prompt was confirmed
		if (result !== null) {
			// save the current rule name as the last valid one
			this.lastRuleName = ruleName;

			// check if the rule is valid
			result = me.ruleIsValid(result);

			if (result !== "") {
				// check for bounded grid
				index = result.indexOf(":");
				if (index !== -1) {
					me.patternRuleName = result.substring(0, index);
					me.patternBoundedGridDef = result.substring(index);
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
	View.prototype.convertPattern = function(/** @type {string} */ fromPostfix, /** @type {string} */ toPostfix, /** @type {number} */ fromStates, /** @type {number} */ toStates, /** @type {Array<number>} */ mapping) {
		var	/** @type {string} */ currentRule = this.patternRuleName,
			/** @type {string} */ patternText = "";

		// remove the from postfix if present
		if (fromPostfix !== "") {
			currentRule = currentRule.substring(0, currentRule.length - fromPostfix.length);
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
	View.prototype.convertToSuper = function(/** @type {View} */ me) {
		var	/** @type {string} */ fromPostfix = (me.engine.isLifeHistory ? "History" : ""),
			/** @type {number} */ fromStates = (me.engine.isLifeHistory ? 7 : 2),
			/** @type {string} */ toPostfix = "Super",
			/** @type {number} */ toStates = 26,
			/** @type {Array<number>} */ mapping = (me.engine.isLifeHistory ? ViewConstants.historyToSuperStates : ViewConstants.standardToSuperStates);

		me.convertPattern(fromPostfix, toPostfix, fromStates, toStates, mapping);
	};

	// convert [R]Standard or [R]Super to [R]History
	View.prototype.convertToHistory = function(/** @type {View} */ me) {
		var	/** @type {string} */ fromPostfix = (me.engine.isSuper ? "Super" : ""),
			/** @type {number} */ fromStates = (me.engine.isSuper ? 26 : 2),
			/** @type {string} */ toPostfix = "History",
			/** @type {number} */ toStates = 7,
			/** @type {Array<number>} */ mapping = (me.engine.isSuper ? ViewConstants.superToHistoryStates : ViewConstants.standardToHistoryStates);

		me.convertPattern(fromPostfix, toPostfix, fromStates, toStates, mapping);
	};

	// convert [R]History or [R]Super to [R]Standard
	View.prototype.convertToStandard = function(/** @type {View} */ me) {
		var	/** @type {string} */ fromPostfix = (me.engine.isLifeHistory ? "History" : "Super"),
			/** @type {number} */ fromStates = (me.engine.isLifeHistory ? 7 : 26),
			/** @type {string} */ toPostfix = "",
			/** @type {number} */ toStates = 2,
			/** @type {Array<number>} */ mapping = (me.engine.isLifeHistory ? ViewConstants.historyToStandardStates : ViewConstants.superToStandardStates);

		me.convertPattern(fromPostfix, toPostfix, fromStates, toStates, mapping);
	};

	// create random HROT rule name
	/** @returns {string} */
	View.prototype.createRandomHROT = function() {
		var	/** @type {string} */ result = "",
			/** @type {number} */ neighbours = 0,
			/** @type {number} */ range = this.engine.HROT.yrange,
			/** @type {string} */ neighbourhood = "",
			/** @type {number} */ lastValue = -1,
			/** @type {number} */ value = 0,
			/** @type {number} */ number = 0,
			/** @type {number} */ added = 0,
			/** @type {number} */ i = 0;

		// set the range
		result = "R" + range  + ",";

		// set the number of states
		result += "C" + this.engine.HROT.scount + ",";

		// get the max neighbour count
		neighbours = this.manager.maxNeighbours(range, this.engine.HROT.type, this.engine.HROT.customNeighbourCount);

		// set the neighbourhood
		switch (this.engine.HROT.type) {
		case this.manager.cornerEdgeHROT:
			neighbourhood = "FC" + this.engine.HROT.cornerRange + "E" + this.engine.HROT.edgeRange;
			break;

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

		case this.manager.alignedCheckerHROT:
			neighbourhood = "D";
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

		// add probabilistic flag if enabled
		if (this.engine.HROT.useRandom) {
			result += ",P";
			if (this.engine.HROT.useRandomSurvivals !== -1) {
				if (this.engine.HROT.useRandomSurvivals < -1) {
					result += "#";
				} else {
					result += this.engine.HROT.useRandomSurvivals;
				}
				if (this.engine.HROT.useRandomBirths !== -1) {
					if (this.engine.HROT.useRandomBirths < -1) {
						result += ",#";
					} else {
						result += "," + this.engine.HROT.useRandomBirths;
					}
					if (this.engine.HROT.useRandomImmunities !== -1) {
						if (this.engine.HROT.useRandomImmunities < -1) {
							result += ",#";
						} else {
							result += "," + this.engine.HROT.useRandomImmunities;
						}
					}
				}
			}
		}

		return result;
	};

	// create random LtL rule name
	/** @returns {string} */
	View.prototype.createRandomLTL = function() {
		var	/** @type {string} */ result = "",
			/** @type {number} */ neighbours = 0,
			/** @type {number} */ range = this.engine.HROT.yrange,
			/** @type {string} */ neighbourhood = "",
			/** @type {number} */ value = 0;

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
		case this.manager.cornerEdgeHROT:
			neighbourhood = "FC" + this.engine.HROT.cornerRange + "E" + this.engine.HROT.edgeRange;
			break;

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

		case this.manager.alignedCheckerHROT:
			neighbourhood = "D";
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
	/** @returns {string} */
	View.prototype.createRandomWolfram = function() {
		var	/** @type {string} */ result = "W",
			/** @type {number} */ value = 0;

		// pick an even number from 0 to 254
		value = ((this.randGen.random() * 127) | 0) * 2;
		result += String(value);

		return result;
	};

	// create random Life-like rule name
	/** @returns {string} */
	View.prototype.createRandomLifeLike = function(/** @type {boolean} */ noB0) {
		var	/** @type {string} */ result = "B",
			/** @type {number} */ i = 0,
			/** @type {number} */ valueB = 0,
			/** @type {number} */ valueS = 0,
			/** @type {number} */ neighbours = 8,
			/** @type {string} */ postfix = "",
			/** @type {Uint8Array} */ birthChance = null,
			/** @type {Uint8Array} */ survivalChance = null;

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
		} else {
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
				case this.manager.triangularBiohazard:
					neighbours = 9;
					postfix = this.manager.triangularBiohazardPostfix;
					break;
				case this.manager.triangularRadiation:
					neighbours = 3;
					postfix = this.manager.triangularRadiationPostfix;
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
		if (this.engine.multiNumStates > 2 && !this.engine.isSuper && !this.engine.isExtended) {
			result += "/" + this.engine.multiNumStates;
		}

		// add neighbourhood postfix
		result += postfix.toUpperCase();

		// return the rule name
		return result;
	};

	// create random Margolus rule name
	/** @returns {string} */
	View.prototype.createRandomMargolus = function(/** @type {boolean} */ isPCA) {
		var	/** @type {string} */ result = (isPCA ? this.manager.pcaRulePrefix.toUpperCase() + "," : "M"),
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ value = 0,
			/** @type {number} */ bit = 0,
			/** @type {boolean} */ first15 = false,
			/** @type {number} */ used = 0,
			/** @type {number} */ swap = 0,
			/** @type {Uint8Array} */ entries = null,
			/** @type {Uint8Array} */ candidates = null,
			/** @type {Uint8Array} */ aliveCounts = null,
			/** @type {Array<Uint8Array>} */ swapCandidates = [],
			/** @type {Uint8Array} */ bitCounts = this.engine.bitCounts16;

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
					if (value === 15) {
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
	View.prototype.randomPattern = function(/** @type {View} */ me, /** @type {boolean} */ fixedRule) {
		var	/** @type {string} */ patternText = "",
			/** @type {string} */ rleText = "",
			/** @type {boolean} */ result,
			/** @type {number} */ y = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ lastState = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ asciiA = String("A").charCodeAt(0),
			/** @type {number} */ asciiP = String("p").charCodeAt(0),
			/** @type {Array<string>} */ outputState = [],
			/** @type {string|null} */ aliasName = null,
			/** @type {number} */ maxState = 0,
			/** @type {number} */ rows = me.randomHeight,
			/** @type {number} */ columns = me.randomWidth,
			/** @type {number} */ fill = me.randomFillPercentage / 100,
			/** @type {boolean} */ isAlternating = false;

		// check if rule is alternating
		if (me.patternRuleName.indexOf("|") !== -1) {
			isAlternating = true;
		}

		// populate output states
		if (me.engine.multiNumStates <= 2 || me.randomize2Only) {
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
			if (this.engine.isPCA) {
				lastState = 0;

				// N
				if (this.randGen.random() <= fill) {
					lastState |= 1;
				}

				// S
				if (this.randGen.random() <= fill) {
					lastState |= 2;
				}

				// E
				if (this.randGen.random() <= fill) {
					lastState |= 4;
				}

				// W
				if (this.randGen.random() <= fill) {
					lastState |= 8;
				}
			} else {
				if (this.randGen.random() <= fill) {
					lastState = ((this.randGen.random() * (maxState - 1)) | 0) + 1;
				} else {
					lastState = 0;
				}
			}

			count = 1;
			for (x = 1; x < columns; x += 1) {
				if (this.engine.isPCA) {
					state = 0;

					// N
					if (this.randGen.random() <= fill) {
						state |= 1;
					}

					// S
					if (this.randGen.random() <= fill) {
						state |= 2;
					}

					// E
					if (this.randGen.random() <= fill) {
						state |= 4;
					}

					// W
					if (this.randGen.random() <= fill) {
						state |= 8;
					}
				} else {
					if (this.randGen.random() <= fill) {
						state = ((this.randGen.random() * (maxState - 1)) | 0) + 1;
					} else {
						state = 0;
					}
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
				me.patternRuleName += me.manager.properHistoryPostfix;
			}

			// check for [R]Super
			if (me.engine.isSuper) {
				me.patternRuleName += me.manager.properSuperPostfix;
			}

			// check for [R]Extended
			if (me.engine.isExtended) {
				me.patternRuleName += me.manager.properExtendedPostfix;
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
		patternText += "x = " + me.randomWidth + ", y = " + me.randomHeight + ", rule = ";
		patternText += (me.patternAliasName === "" ? me.patternRuleName : me.patternAliasName) + me.patternBoundedGridDef + "\n";
		patternText += rleText;
		patternText += me.engine.afterTitle;

		// check whether prompt required
		if (me.undoButton.locked || me.randomizeGuard || (me.editNum === 2 && me.editList[1].gen !== 0)) {
			// prompt not required because there was nothing to undo, or the only undo is to reset to gen 0
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
	View.prototype.newPattern = function(/** @type {View} */ me) {
		var	/** @type {string} */ patternText = "x = 1, y = 1, rule = ",
			/** @type {string|null} */ result = window.prompt("Create new pattern with rule", (me.patternAliasName === "" ? me.patternRuleName : me.patternAliasName) + me.patternBoundedGridDef);

		// check if the prompt was confirmed
		if (result !== null) {
			result = me.ruleIsValid(result);

			if (result !== "") {
				// add an empty pattern
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
			if (this.engine.isTriangular) {
				if (!this.engine.forceRectangles) {
					this.gridToggle.icon = [this.iconManager.icon("trianglegrid")];
				} else {
					this.gridToggle.icon = [this.iconManager.icon("trirectgrid")];
				}
			} else {
				this.gridToggle.icon = [this.iconManager.icon("grid")];
			}
		}
	};

	// mouse wheel
	View.prototype.wheel = function(/** @type {View} */ me, /** @type {WheelEvent} */ event) {
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
		var	/** @type {number} */ linearComplete = (this.targetPOI === 0 ? 0 : this.stepsPOI / this.targetPOI),

			// compute bezier completion
			/** @type {number} */ bezierComplete = this.waypointManager.bezierX(linearComplete, 0, 0, 1, 1),

			// get angle
			/** @type {number} */ startAngle = this.startAnglePOI,
			/** @type {number} */ endAngle = this.endAnglePOI,

			// get tilt
			/** @type {number} */ startTilt = this.startTiltPOI,
			/** @type {number} */ endTilt = this.endTiltPOI;

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

		// set the camera tilt
		this.engine.tilt = (startTilt + bezierComplete * (endTilt - startTilt));

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
			this.engine.tilt = this.endTiltPOI;
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

		// update tilt control if available
		if (this.tiltItem) {
			this.tiltItem.current = this.viewTiltRange([this.convertFromTilt(this.engine.tilt), this.engine.tilt], false, this);
		}
	};

	// create POIs from Labels
	View.prototype.createPOIsFromLabels = function() {
		var	/** @type {WaypointManager} */ wm = this.waypointManager,
			/** @type {number} */ nLabels = wm.numLabels(),
			/** @type {number} */ i = 0,
			/** @type {number} */ width = this.patternWidth,
			/** @type {number} */ height = this.patternHeight,
			/** @type {Waypoint} */ currentWaypoint = wm.createWaypoint(),
			/** @type {Label} */ currentLabel = null;

		for (i = 0; i < nLabels; i += 1) {
			currentLabel = wm.labelList[i];
			currentWaypoint.isPOI = true;
			currentWaypoint.x = -currentLabel.x + width / 2;
			currentWaypoint.xDefined = true;
			currentWaypoint.y = -currentLabel.y + height / 2;
			currentWaypoint.yDefined = true;
			currentWaypoint.zoom = currentLabel.zoom;
			currentWaypoint.zoomDefined = true;
			wm.add(currentWaypoint, this);
			if (i < nLabels - 1) {
				currentWaypoint = wm.createWaypoint();
			}
		}
	};

	// set camera from POI
	View.prototype.setCameraFromPOI = function(/** @type {View} */ me, /** @type {number} */ poiNumber) {
		// get the point of interest
		var	/** @type {Waypoint} */ poi = me.waypointManager.poiList[poiNumber];

		// save start point
		me.startXPOI = me.engine.width / 2 - me.engine.xOff;
		me.startYPOI = me.engine.height / 2 - me.engine.yOff;
		me.startZoomPOI = me.engine.zoom;
		me.startAnglePOI = me.engine.angle;
		me.startTiltPOI = me.engine.tilt;

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
		if (poi.tiltDefined) {
			me.endTiltPOI = poi.tilt;
		} else {
			me.endTiltPOI = me.startTiltPOI;
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
			me.genSpeed = Math.sqrt((poi.gps - ViewConstants.minGenSpeed) / (me.refreshRate - ViewConstants.minGenSpeed));
		}

		// set STEP
		if (poi.stepDefined) {
			me.gensPerStep = poi.step;
		}

		if (poi.gpsDefined || poi.stepDefined) {
			me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);
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
	View.prototype.changeZoom = function(/** @type {View} */ me, /** @type {number} */ newZoom, /** @type {boolean} */ integerOnly) {
		// compute tracked zoom
		var	/** @type {number} */ adjustedZoom = newZoom / me.engine.originZ;

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
			me.startTiltPOI = me.engine.tilt;

			// save end point
			me.endXPOI = me.startXPOI;
			me.endYPOI = me.startYPOI;
			me.endZoomPOI = adjustedZoom;
			me.endAnglePOI = me.startAnglePOI;
			me.endTiltPOI = me.startTiltPOI;

			// reset step number for transition
			me.stepsPOI = 0;
		}
	};

	// 1x speed pressed
	View.prototype.speed1Pressed = function(/** @type {View} */ me) {
		me.speedRange.current = me.viewSpeedRange([1, 1], true, me);
	};

	// undo button
	View.prototype.undoPressed = function(/** @type {View} */ me) {
		me.undo(me);
	};

	// redo button
	View.prototype.redoPressed = function(/** @type {View} */ me) {
		me.redo(me);
	};

	// cancel button
	View.prototype.cancelPressed = function(/** @type {View} */ me) {
		if (me.identify) {
			me.identifyPressed(me);
		}

		if (me.startFrom !== -1) {
			me.stopStartFrom(me, true, true);
		}
	};

	// back button
	View.prototype.backPressed = function(/** @type {View} */ me) {
		// check if any settings are displayed
		if (me.showDisplaySettings || me.showInfoSettings || me.showClipboardSettings || me.showPatternSettings || me.showPlaybackSettings || me.showThemeSelection || me.showActionsSettings) {
			// clear settings section
			me.showDisplaySettings = false;
			me.showInfoSettings = false;
			me.showPatternSettings = false;
			me.showClipboardSettings = false;
			me.showPlaybackSettings = false;
			me.showActionsSettings = false;
			me.showThemeSelection = false;
		} else {
			// close settings
			me.navToggle.current = [false];
		}
	};

	// clipboard settings button
	View.prototype.clipboardPressed = function(/** @type {View} */ me) {
		me.showClipboardSettings = true;
	};

	// pattern settings button
	View.prototype.patternPressed = function(/** @type {View} */ me) {
		me.showPatternSettings = true;
	};

	// display settings button
	View.prototype.displayPressed = function(/** @type {View} */ me) {
		me.showDisplaySettings = true;
	};

	// actions settings button
	View.prototype.actionsPressed = function(/** @type {View} */ me) {
		me.showActionsSettings = true;
	};

	// playback settings button
	View.prototype.playbackPressed = function(/** @type {View} */ me) {
		me.showPlaybackSettings = true;
	};

	// info settings button
	View.prototype.infoPressed = function(/** @type {View} */ me) {
		me.showInfoSettings = true;
	};

	// new button
	View.prototype.newPressed = function(/** @type {View} */ me) {
		me.newPattern(me);
	};

	// randomize pattern and rule
	View.prototype.randomizePressed = function(/** @type {View} */ me) {
		me.randomPattern(me, false);
	};

	// randomize pattern and keep current rule
	View.prototype.randomizePatternPressed = function(/** @type {View} */ me) {
		me.randomPattern(me, true);
	};

	// save button
	View.prototype.savePressed = function(/** @type {View} */ me) {
		me.saveCurrentRLE(me);
		if (me.isSelection) {
			me.menuManager.notification.notify("Selection saved", 15, 120, 15, true);
		} else {
			me.menuManager.notification.notify("Pattern saved", 15, 120, 15, true);
		}
	};

	// load button
	View.prototype.loadPressed = function(/** @type {View} */ me) {
		me.loadPattern(me);
	};

	// rule button
	View.prototype.rulePressed = function(/** @type {View} */ me) {
		me.changeRule(me);
	};

	// theme button
	View.prototype.themePressed = function(/** @type {View} */ me) {
		me.showThemeSelection = true;
	};

	// theme selection toggle
	/** @returns {Array<boolean>} */
	View.prototype.toggleTheme = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {number} */ theme = 0,
			/** @type {MenuItem} */ item = me.menuManager.activeItem();

		if (change) {
			if (newValue[0]) {
				// get the theme number from the control ID minus the first theme selection control ID
				theme = item.id - me.themeSelectionFirstID;

				// change quickly
				me.setNewTheme(ViewConstants.themeOrder[theme], 1, me);

				// close settings menu
				if (me.navToggle.current[0]) {
					me.navToggle.current = me.toggleSettings([false], true, me);
				}
			} else {
				// close settings menu
				if (me.navToggle.current[0]) {
					me.navToggle.current = me.toggleSettings([false], true, me);
				}
				newValue[0] = true;
			}
		}

		return newValue;
	};

	// identify close button
	View.prototype.identifyClosePressed = function(/** @type {View} */ me) {
		me.resultsDisplayed = false;
	};

	// identify save cell map button
	View.prototype.identifySavePressed = function(/** @type {View} */ me) {
		me.downloadCellPeriodMap(me);
	};

	// identify page up button
	View.prototype.identifyPageUpPressed = function(/** @type {View} */ me) {
		me.engine.cellPeriodTablePageUp();
	};

	// identify page down button
	View.prototype.identifyPageDownPressed = function(/** @type {View} */ me) {
		me.engine.cellPeriodTablePageDown();
	};

	// identify home
	View.prototype.identifyHomePressed = function(/** @type {View} */ me) {
		me.engine.cellPeriodTableHome();
	};

	// identify end
	View.prototype.identifyEndPressed = function(/** @type {View} */ me) {
		me.engine.cellPeriodTableEnd();
	};

	// display last identify results
	View.prototype.displayLastIdentifyResults = function(/** @type {View} */ me) {
		// check if there are results
		if (me.lastIdentifyType === "Empty" || me.lastIdentifyType === "none" || me.lastIdentifyType === "") {
			me.menuManager.notification.notify("No Identify Results", 15, 120, 15, false);
		} else {
			// close Help if open
			if (me.displayHelp !== 0) {
				me.displayHelp = 0;
				me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);
			}

			// close settings menu if open
			if (me.navToggle.current[0]) {
				me.navToggle.current = me.toggleSettings([false], true, me);
				me.menuManager.toggleRequired = true;
			}

			// show results
			me.engine.tableStartRow = 0;
			me.identifyStrictToggle.current = me.toggleCellPeriodMap(0, true, me);
			me.resultsDisplayed = true;
		}
	};

	// graph close button
	View.prototype.graphClosePressed = function(/** @type {View} */ me) {
		me.popGraph = false;
		me.graphButton.current = me.viewGraphToggle([me.popGraph], true, me);
	};

	// esc button
	View.prototype.escPressed = function(/** @type {View} */ me) {
		// hide the viewer
		hideViewer();
	};

	// close errors button
	View.prototype.closeErrorsPressed = function(/** @type {View} */ me) {
		// clear errors
		me.scriptErrors = [];
		me.displayErrors = 0;
		me.setMousePointer(/** @type {!number} */ (me.modeList.current));
	};

	// previous POI button
	View.prototype.prevPOIPressed = function(/** @type {View} */ me) {
		// go to previous POI
		me.currentPOI -= 1;
		if (me.currentPOI < 0) {
			me.currentPOI = me.waypointManager.numPOIs() - 1;
		}

		// set camera
		me.setCameraFromPOI(me, me.currentPOI);
	};

	// next POI button
	View.prototype.nextPOIPressed = function(/** @type {View} */ me) {
		// go to next POI
		me.currentPOI += 1;
		if (me.currentPOI >= me.waypointManager.numPOIs()) {
			me.currentPOI = 0;
		}

		// set camera
		me.setCameraFromPOI(me, me.currentPOI);
	};

	// next universe button
	View.prototype.nextUniversePressed = function(/** @type {View} */ me) {
		me.universe += 1;
		if (me.universe >= Controller.patterns.length) {
			me.universe = 0;
		}
		me.startViewer(Controller.patterns[me.universe].pattern, false);
	};

	// previous universe button
	View.prototype.prevUniversePressed = function(/** @type {View} */ me) {
		me.universe -= 1;
		if (me.universe < 0) {
			me.universe = Controller.patterns.length - 1;
		}
		me.startViewer(Controller.patterns[me.universe].pattern, false);
	};

	// shrink button
	View.prototype.shrinkPressed = function(/** @type {View} */ me) {
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
	View.prototype.sectionsPressed = function(/** @type {View} */ me) {
		me.showSections = true;
	};

	// topics button
	View.prototype.topicsPressed = function(/** @type {View} */ me) {
		// switch to welcome topic
		me.setHelpTopic(ViewConstants.welcomeTopic, me);
	};

	// clear paste
	View.prototype.clearPaste = function(/** @type {View} */ me, /** @type {boolean} */ ctrl) {
		var	/** @type {number} */ i = 0;

		// TBD isExtended

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
	View.prototype.clearOutside = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {BoundingBox} */ zoomBox = me.engine.zoomBox,
			/** @type {number} */ leftX = zoomBox.leftX,
			/** @type {number} */ rightX = zoomBox.rightX,
			/** @type {number} */ bottomY = zoomBox.bottomY,
			/** @type {number} */ topY = zoomBox.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {number} */ wasState6 = 0;

		if (!me.viewOnly) {
			// check for selection
			if (me.isSelection) {
				// adjust in case specified is different than actual size
				if (me.engine.boundedGridType !== -1) {
					xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
					yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
				}

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

				// ensure grid is accurate
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();
				leftX = zoomBox.leftX;
				bottomY = zoomBox.bottomY;
				rightX = zoomBox.rightX;
				topY = zoomBox.topY;

				// clear cells outside selection
				for (y = bottomY; y <= topY; y += 1) {
					for (x = leftX; x <= rightX; x += 1) {
						// check if cell is outside selection box
						if (!(y >= y1 && y <= y2 && x >= x1 && x <= x2)) {
							state = me.engine.getState(x, y, false);
							if (state !== 0) {
								wasState6 |= me.setStateWithUndo(x, y, 0, true, false);
							}
						}
					}
				}

				if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
					// update state 6 grid
					this.engine.populateState6MaskFromColGrid();
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
	View.prototype.clearSelection = function(/** @type {View} */ me, /** @type {boolean} */ ctrl) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		if (!me.viewOnly) {
			// check for selection
			if (me.isSelection) {
				// adjust in case specified is different than actual size
				if (me.engine.boundedGridType !== -1) {
					xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
					yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
				}

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

				// TBD isExtended
				if ((me.engine.isLifeHistory || me.engine.isSuper) && ctrl) {
					// clear [R]History or [R]Super states in selection
					for (y = y1; y <= y2; y += 1) {
						for (x = x1; x <= x2; x += 1) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (state > 1) {
								me.setStateWithUndo(x + xOff, y + yOff, state & 1, true, false);
							}
						}
					}
				} else {
					// clear cells in selection
					for (y = y1; y <= y2; y += 1) {
						for (x = x1; x <= x2; x += 1) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (state !== 0) {
								me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
							}
						}
					}
				}

				// update state 6 grid
				if (me.engine.isLifeHistory || me.engine.isSuper) {
					this.engine.populateState6MaskFromColGrid();
				}

				// check if shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();

				// mark nothing happened since selection
				me.afterSelectAction = false;

				// save edit
				if ((me.engine.isLifeHistory || me.engine.isSuper) && ctrl) {
					if (me.engine.isLifeHistory) {
						me.afterEdit("clear History cells in selection");
					} else {
						me.afterEdit("clear Super cells in selection");
					}
				} else {
					me.afterEdit("clear cells in selection");
				}
			}
		}
	};

	// integer zoom pressed
	View.prototype.integerZoomPressed = function(/** @type {View} */ me) {
		// set zoom to nearest integer
		me.changeZoom(me, me.engine.zoom * me.engine.originZ, true);
	};

	// fit selection pressed
	View.prototype.fitSelectionPressed = function(/** @type {View} */ me) {
		me.fitZoomDisplay(true, true, ViewConstants.fitZoomSelection);
	};

	// center pattern pressed
	View.prototype.centerPatternPressed = function(/** @type {View} */ me) {
		me.fitZoomDisplay(true, true, ViewConstants.fitZoomMiddle);
	};

	// clear selection
	View.prototype.doClearSelection = function(/** @type {View} */ me, /** @type {boolean} */ ctrl) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.clearPaste(me, ctrl);
			} else {
				me.clearSelection(me, ctrl);
			}
		}
	};

	// clear selection pressed
	View.prototype.clearSelectionPressed = function(/** @type {View} */ me) {
		me.doClearSelection(me, false);
	};

	// clear outside pressed
	View.prototype.clearOutsidePressed = function(/** @type {View} */ me) {
		me.clearOutside(me);
	};

	// clear [R]History or [R]Super pressed
	View.prototype.clearRHistoryPressed = function(/** @type {View} */ me) {
		me.doClearSelection(me, true);
	};

	// change cell state pressed
	View.prototype.changeCellStatePressed = function(/** @type {View} */ me) {
		// switch to draw mode
		if (me.modeList.current !== ViewConstants.modeDraw) {
			me.modeList.current = me.viewModeList(ViewConstants.modeDraw, true, me);
		}

		// enable pick replace
		me.pickReplace = true;
		me.pickToggle.current = me.togglePick([true], true, me);
	};

	// select all pressed
	View.prototype.processSelectAll = function(/** @type {boolean} */ markUndo) {
		var	/** @type {BoundingBox} */ selBox = this.selectionBox,
			/** @type {BoundingBox} */ zoomBox = this.engine.zoomBox,
			/** @type {number} */ xOff = (this.engine.width >> 1) - (this.patternWidth >> 1) + (this.xOffset << 1),
			/** @type {number} */ yOff = (this.engine.height >> 1) - (this.patternHeight >> 1) + (this.yOffset << 1),
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0;

		// check for empty population or not marking undo
		if (this.engine.population > 0 || !markUndo) {
			// update the pattern extent
			this.engine.shrinkNeeded = true;
			this.engine.doShrink();

			// adjust position if in bounded grid
			if (this.engine.boundedGridType !== -1) {
				xOff -= Math.floor((this.specifiedWidth - this.patternWidth) / 2);
				yOff -= Math.floor((this.specifiedHeight - this.patternHeight) / 2);
			}

			// for HROT patterns use alive states only
			if (!this.engine.isSuper && !this.engine.isExtended && !this.engine.isRuleTree && (this.engine.isPCA || (this.engine.isHROT && this.engine.multiNumStates === 2) || this.engine.multiNumStates > 2)) {
				this.engine.getAliveStatesBox(selBox);
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

			this.isSelection = true;
			this.afterSelectAction = false;
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
			if (markUndo) {
				this.afterEdit("select all (" + width + " x " + height + ")");
			}
		} else {
			this.menuManager.notification.notify("No live cells to Select", 15, 120, 15, false);
			if (this.isSelection) {
				this.removeSelection(this);
			}
		}
	};

	// select all pressed
	View.prototype.selectAllPressed = function(/** @type {View} */ me) {
		// select all and update undo records
		me.processSelectAll(true);
	};

	// process cut
	View.prototype.processCut = function(/** @type {View} */ me, /** @type {boolean} */ shift, /** @type {boolean} */ alt) {
		if (!me.viewOnly) {
			// check for sync
			if (!me.noCopy && me.copySyncExternal) {
				if (shift) {
					// copy reset position to external clipboard
					me.copyRLE(me);
				} else {
					// check for view only mode
					if (me.viewOnly) {
						// copy reset position to clipboard
						me.copyRLE(me);
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
	View.prototype.cutPressed = function(/** @type {View} */ me) {
		me.processCut(me, false, false);
	};

	// cut selection
	View.prototype.cutSelection = function(/** @type {View} */ me, /** @type {number} */ number, /** @type {boolean} */ evolveStep, /** @type {boolean} */ noSave) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ states = me.engine.multiNumStates,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {Uint8Array} */ buffer = null,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ wasState6 = 0;

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

			// adjust in case specified is different than actual size
			if (me.engine.boundedGridType !== -1) {
				xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
				yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
			}

			// allocate the buffer
			buffer = /** @type {!Uint8Array} */ (me.engine.allocator.allocate(Type.Uint8, width * height, "View.pasteBuffer" + number));

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
					wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					i += 1;
				}
			}

			if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
				this.engine.populateState6MaskFromColGrid();
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
	View.prototype.processCopy = function(/** @type {View} */ me, /** @type {boolean} */ shift, /** @type {boolean} */ alt) {
		// check for Help copy
		if (me.displayHelp !== 0) {
			Help.copying = true;
			Help.copyText = "";
			Help.drawHelpText(me);
			me.copyToClipboard(me, Help.copyText);
			Help.copying = false;
			Help.copyText = "";
		} else {
			// check for sync
			if (!me.noCopy && (me.copySyncExternal || !me.isSelection)) {
				if (shift) {
					// copy reset position to external clipboard
					me.copyRLE(me);
				} else {
					// check for view only mode
					if (me.viewOnly) {
						// copy reset position to clipboard
						me.copyRLE(me);
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

	// paste to selection pressed
	View.prototype.pasteToSelectionPressed = function(/** @type {View} */ me) {
		me.processPaste(me, true, false);
	};

	// copy with comments pressed
	View.prototype.copyWithCommentsPressed = function(/** @type {View} */ me) {
		me.processCopy(me, false, true);
	};

	// copy original pattern pressed
	View.prototype.copyOriginalPressed = function(/** @type {View} */ me) {
		me.processCopy(me, true, false);
	};

	// copy neighbourhood pressed
	View.prototype.copyNeighbourhoodPressed = function(/** @type {View} */ me) {
		me.copyNeighbourhood(me);
	};

	// copy position pressed
	View.prototype.copyPositionPressed = function(/** @type {View} */ me) {
		me.copyPosition(me, false);
	};

	// copy viewpressed
	View.prototype.copyViewPressed = function(/** @type {View} */ me) {
		me.copyPosition(me, true);
	};

	// open clipboard pressed
	View.prototype.openClipboardPressed = function(/** @type {View} */ me) {
		/*jshint -W119 */
		navigator.clipboard.readText().then(text => me.loadText(me, text));
	};

	// copy pressed
	View.prototype.copyPressed = function(/** @type {View} */ me) {
		me.processCopy(me, false, false);
	};

	// create weighted neighbourhood from selection and copy to clipboard
	View.prototype.copyWeighted = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {number} */ x1 = selBox.leftX,
			/** @type {number} */ y1 = selBox.bottomY,
			/** @type {number} */ x2 = selBox.rightX,
			/** @type {number} */ y2 = selBox.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ maxState = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {boolean} */ valid = true,
			/** @type {string} */ output = "",
			/** @type {Array<number>} */ cells = [];

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
				me.copyToClipboard(me, output);
				me.menuManager.notification.notify("Weighted R" + ((width - 1) >> 1) + " copied to clipboard", 15, 180, 15, true);
			}
		} else {
			me.menuManager.notification.notify("Weighted needs a selection", 15, 180, 15, true);
		}
	};

	// reverse a CoordCA neighbourhood string (for trianguluar rules)
	/** @returns {string} */
	View.prototype.reverseCoordCA = function(/** @type {string} */ rule) {
		var	/** @type {string} */ result = "",
			/** @type {string} */ hexDigits = this.manager.hexCharacters,
			/** @type {number} */ digit = 0,
			/** @type {number} */ newDigit = 0,
			/** @type {number} */ i = 0;

		// process each character in reverse
		for (i = rule.length - 1; i >= 0; i -= 1) {
			digit = hexDigits.indexOf(rule[i]);

			// reverse bits in character
			newDigit = ((digit & 1) << 3) | ((digit & 2) << 1) | ((digit & 4) >> 1) | ((digit & 8) >> 3);
			result += hexDigits[newDigit];
		}

		return result;
	};

	// create CoordCA neighbourhood from selection and copy to clipboard
	View.prototype.copyCoordCA = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {number} */ x1 = selBox.leftX,
			/** @type {number} */ y1 = selBox.bottomY,
			/** @type {number} */ x2 = selBox.rightX,
			/** @type {number} */ y2 = selBox.topY,
			/** @type {number} */ value = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ midX = 0,
			/** @type {number} */ midY = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {boolean} */ valid = true,
			/** @type {string} */ output = "";

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
						// check if neighbourhood needs to be inverted
						if (((x1 + xOff + y1 + yOff) & 1) === 0) {
							output = this.reverseCoordCA(output);
						}
						output += "L";
					}
				}

				// copy to external clipboard
				me.copyToClipboard(me, output);
				me.menuManager.notification.notify("CoordCA R" + ((width - 1) >> 1) + " copied to clipboard", 15, 180, 15, true);
			}
		} else {
			me.menuManager.notification.notify("CoordCA needs a selection", 15, 180, 15, true);
		}
	};

	// copy neighbourhood
	View.prototype.copyNeighbourhood = function(/** @type {View} */ me) {
		// for multi-state patterns create a weighted neighbourhood
		if (me.engine.multiNumStates > 2) {
			me.copyWeighted(me);
		} else {
			// for 2 state create a custom neighbourhood
			me.copyCoordCA(me);
		}
	};

	// copy selection
	View.prototype.copySelection = function(/** @type {View} */ me, /** @type {number} */ number) {
		var	/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {number} */ x1 = selBox.leftX,
			/** @type {number} */ y1 = selBox.bottomY,
			/** @type {number} */ x2 = selBox.rightX,
			/** @type {number} */ y2 = selBox.topY,
			/** @type {number} */ swap = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ states = me.engine.multiNumStates,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(me.engine.isNone || me.engine.isPCA || me.engine.isRuleTree || me.engine.isSuper || me.engine.isExtended)),
			/** @type {number} */ xOff = me.panX - me.xOffset,
			/** @type {number} */ yOff = me.panY - me.yOffset,
			/** @type {Uint8Array} */ buffer = null;

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

			// adjust if CXRLE Pos defined
			if (me.posDefined) {
				if (me.engine.boundedGridType !== -1) {
					xOff += me.posXOffset - x1;
					yOff += me.posYOffset - y1;
				} else {
					xOff += me.posXOffset * 2;
					yOff += me.posYOffset * 2;
				}
			}

			// allocate the buffer
			buffer = /** @type {!Uint8Array} */ (me.engine.allocator.allocate(Type.Uint8, width * height, "View.pasteBuffer" + number));

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
			me.afterSelectAction = true;
		}
	};

	// cancel paste
	View.prototype.cancelPaste = function(/** @type {View} */ me) {
		me.isPasting = false;
		me.menuManager.notification.clear(true, false);
	};

	// evolve pressed
	View.prototype.evolvePressed = function(/** @type {View} */ me, /** @type {boolean} */ shift) {
		// save paste mode
		var	/** @type {number} */ savedMode = /** @type {!number} */ (me.pasteModeList.current),
			/** @type {boolean} */ savedSync = me.copySyncExternal,
			/** @type {number} */ savedBuffer = me.currentPasteBuffer,
			/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ origX1 = box.leftX,
			/** @type {number} */ origX2 = box.rightX,
			/** @type {number} */ origY1 = box.bottomY,
			/** @type {number} */ origY2 = box.topY,
			/** @type {number} */ x1 = 0,
			/** @type {number} */ x2 = 0,
			/** @type {number} */ y1 = 0,
			/** @type {number} */ y2 = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ states = me.engine.multiNumStates,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {Uint8Array} */ buffer = null,
			/** @type {number} */ state = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ wasState6 = 0;

		// check for evolve outside
		if (shift) {
			if (me.isSelection) {
				// select internal paste buffer
				me.currentPasteBuffer = ViewConstants.numPasteBuffers;

				// process cut but mark advance outside
				me.copySyncExternal = false;
				me.cutSelection(me, me.currentPasteBuffer, true, false);
				me.copySyncExternal = savedSync;

				// step
				me.engine.nextGeneration(me.noHistory);
				me.engine.convertToPensTile();
				me.engine.saveSnapshotIfNeeded(me);
				me.afterEdit("");

				// process paste but mark advance outside
				me.pasteModeList.current = 1;  // UI COPY mode
				me.copySyncExternal = false;
				me.processPaste(me, true, true);

				// restore paste options
				me.copySyncExternal = savedSync;
				me.pasteModeList.current = savedMode;
				me.currentPasteBuffer = savedBuffer;
			}
		} else {
			// check if there is a selection
			if (me.isSelection) {
				// order original selection
				if (origX1 > origX2) {
					swap = origX2;
					origX2 = origX1;
					origX1 = swap;
				}
				if (origY1 > origY2) {
					swap = origY2;
					origY2 = origY1;
					origY1 = swap;
				}

				// select all cells without updating undo records
				me.processSelectAll(false);
				x1 = box.leftX;
				x2 = box.rightX;
				y1 = box.bottomY;
				y2 = box.topY;

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

				// adjust in case specified is different than actual size
				if (me.engine.boundedGridType !== -1) {
					xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
					yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
				}

				// copy selection into temporary buffer
				buffer = new Uint8Array(width * height);

				// copy selection to buffer and clear set cells
				wasState6 = 0;
				i = 0;
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						if (!(x >= origX1 && x <= origX2 && y >= origY1 && y <= origY2)) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (state > 0 && invertForGenerations) {
								state = states - state;
							}
							buffer[i] = state;
							wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
						}
						i += 1;
					}
				}

				if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
					this.engine.populateState6MaskFromColGrid();
				}

				// shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();
				me.afterEdit("advance selection");

				// step
				me.engine.nextGeneration(me.noHistory);
				me.engine.convertToPensTile();
				me.engine.saveSnapshotIfNeeded(me);
				me.afterEdit("");

				// determine if the pattern escaped the original selection box
				me.processSelectAll(false);
				if (box.leftX < origX1 || box.rightX > origX2 || box.bottomY < origY1 || box.topY > origY2) {
					// clear cells outside original selection
					wasState6 = 0;
					i = 0;
					for (y = box.bottomY; y <= box.topY; y += 1) {
						for (x = box.leftX; x <= box.rightX; x += 1) {
							if (!(x >= origX1 && x <= origX2 && y >= origY1 && y <= origY2)) {
								wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
							}
							i += 1;
						}
					}
					if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
						this.engine.populateState6MaskFromColGrid();
					}

					// shrink needed
					me.engine.shrinkNeeded = true;
					me.engine.doShrink();
				}

				// write the original cells outside the selection back
				wasState6 = 0;
				i = 0;
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						if (!(x >= origX1 && x <= origX2 && y >= origY1 && y <= origY2)) {
							wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, buffer[i], true, false);
						}
						i += 1;
					}
				}

				if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
					this.engine.populateState6MaskFromColGrid();
				}

				// shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();

				box.leftX = origX1;
				box.rightX = origX2;
				box.bottomY = origY1;
				box.topY = origY2;
				me.afterEdit("advance selection");
			}
		}
	};

	// perform paste
	View.prototype.performPaste = function(/** @type {View} */ me, /** @type {number} */ cellX, /** @type {number} */ cellY, /** @type {boolean} */ saveEdit) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ width = me.pasteWidth,
			/** @type {number} */ height = me.pasteHeight,
			/** @type {number} */ state = 0,
			/** @type {number} */ current = 0,
			/** @type {Uint8Array} */ buffer = me.pasteBuffer,
			/** @type {BoundingBox} */ midBox = me.middleBox,
			/** @type {number} */ origWidth = me.engine.width,
			/** @type {number} */ origHeight = me.engine.height,
			/** @type {number} */ wasState6 = 0;

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
			origWidth <<= 1;
		}
		while (origHeight !== me.engine.height) {
			cellY += origHeight >> 1;
			origHeight <<= 1;
		}

		// check the paste mode
		switch (this.getUIPasteMode()) {
		case ViewConstants.pasteModeOr:
			i = 0;
			for (y = 0; y < height; y += 1) {
				for (x = 0; x < width; x += 1) {
					state = buffer[i];
					if (this.engine.isPCA) {
						current = this.engine.getState(cellX + x, cellY + y, false);
						wasState6 |= me.setStateWithUndo(cellX + x, cellY + y, current | state, true, false);
					} else {
						if (state > 0) {
							wasState6 |= me.setStateWithUndo(cellX + x, cellY + y, state, true, false);
						}
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
					wasState6 |= me.setStateWithUndo(cellX + x, cellY + y, state, true, false);
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
					wasState6 |= me.setStateWithUndo(cellX + x, cellY + y, current ^ state, true, false);
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
					wasState6 |= me.setStateWithUndo(cellX + x, cellY + y, current & state, true, false);
					i += 1;
				}
			}
		}

		if ((me.engine.isLifeHistory || me.engine.isSuper || me.engine.isExtended) && wasState6) {
			this.engine.populateState6MaskFromColGrid();
		}

		// paste finished
		me.isPasting = false;

		// clear notification
		me.menuManager.notification.clear(true, false);

		// save edit
		if (saveEdit) {
			me.afterEdit("paste");
		}
	};

	// paste at offset from selection
	View.prototype.pasteOffset = function(/** @type {View} */ me, /** @type {number} */ dx, /** @type {number} */ dy) {
		var	/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {BoundingBox} */ selBox = me.selectionBox,
			/** @type {number} */ leftX = selBox.leftX,
			/** @type {number} */ bottomY = selBox.bottomY,
			/** @type {number} */ rightX = selBox.rightX,
			/** @type {number} */ topY = selBox.topY,
			/** @type {number} */ width = rightX - leftX + 1,
			/** @type {number} */ height = topY - bottomY + 1,
			/** @type {Uint8Array} */ buffer = null,
			/** @type {number} */ state = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ swap = 0,
			/** @type {string} */ direction = "",
			/** @type {number} */ bLeftX = 0,
			/** @type {number} */ bRightX = me.engine.width - 1,
			/** @type {number} */ bBottomY = 0,
			/** @type {number} */ bTopY = me.engine.height - 1,
			/** @type {number} */ wasState6 = 0;

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

				// adjust in case specified is different than actual size
				if (me.engine.boundedGridType !== -1) {
					xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
					yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
				}

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

				// grow grid if needed by checking first bottom left cell with offset
				if (me.engine.boundedGridType === -1) {
					me.cellOnGrid(leftX + xOff + dx, bottomY + yOff + dy);

					// update position in case grid grew
					xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
					yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
					selBox = me.selectionBox;
					leftX = selBox.leftX;
					bottomY = selBox.bottomY;
					rightX = selBox.rightX;
					topY = selBox.topY;

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

					// adjust in case specified is different than actual size
					if (me.engine.boundedGridType !== -1) {
						xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
						yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
					}

					// and then check top right cell with offset
					me.cellOnGrid(rightX + xOff + dx, topY + yOff + dy);

					// update position in case grid grew
					xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
					yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
					selBox = me.selectionBox;
					leftX = selBox.leftX;
					bottomY = selBox.bottomY;
					rightX = selBox.rightX;
					topY = selBox.topY;

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

					// adjust in case specified is different than actual size
					if (me.engine.boundedGridType !== -1) {
						xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
						yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
					}
				}

				// add border for HROT rules
				if (me.engine.isHROT) {
					if (me.engine.boundedGridType === -1) {
						bLeftX += me.engine.HROT.xrange * 2 + 1;
						bRightX -= me.engine.HROT.xrange * 2 + 1;
						bBottomY += me.engine.HROT.yrange * 2 + 1;
						bTopY -= me.engine.HROT.yrange * 2 + 1;
					} else {
						bLeftX += 1;
						bRightX -= 1;
						bBottomY += 1;
						bTopY -= 1;
					}
				}

				// check if the pattern can move
				if (leftX + xOff + dx >= bLeftX && rightX + xOff + dx <= bRightX && bottomY + yOff + dy >= bBottomY && topY + yOff + dy <= bTopY) {
					// cut pattern in selection to internal buffer
					me.pasteBuffers[ViewConstants.numPasteBuffers] = null;
					me.cutSelection(me, ViewConstants.numPasteBuffers, false, true);

					// add the offset
					xOff += dx;
					yOff += dy;

					// paste to the new location
					i = 0;
					buffer = me.pasteBuffers[ViewConstants.numPasteBuffers].buffer;
					for (y = 0; y < height; y += 1) {
						for (x = 0; x < width; x += 1) {
							state = buffer[i];
							wasState6 |= me.setStateWithUndo(leftX + x + xOff, bottomY + y + yOff, state, true, false);
							i += 1;
						}
					}
					me.pasteBuffers[ViewConstants.numPasteBuffers] = null;

					if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
						this.engine.populateState6MaskFromColGrid();
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

	// create state conversion map for pasting patterns from different rules
	View.prototype.createConversionMap = function(/** @type {Uint8Array} */ map, /** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ states = this.engine.multiNumStates,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended));

		// get the number of states in the loaded pattern
		if (states === -1) {
			states = 2;
		}

		if (this.engine.isLifeHistory) {
			states = 7;
		}

		// initialise map to identity
		for (i = 0; i < 256; i += 1) {
			map[i] = i;
		}

		// check for generations
		if (invertForGenerations) {
			for (i = 1; i < 256; i += 1) {
				// invert the state number
				state = states - i;

				// ensure it is in range
				if (state < 0) {
					state = 0;
				} else {
					if (state >= states) {
						state = states - 1;
					}
				}

				map[i] = state;
			}
		} else {
			// check for 2 state rule
			if (states === 2) {
				// [R]Super or [R]History: odd states dead, even states alive
				if (pattern.isHistory || pattern.isSuper) {
					for (i = 0; i < 256; i += 1) {
						map[i] = i & 1;
					}
				} else {
					// [R]Investigator: state 1 alive, everything else dead
					if (pattern.isExtended) {
						for (i = 2; i < 256; i += 1) {
							map[i] = 0;
						}
					} else {
						// 2-state HROT
						if (pattern.isHROT) {
							for (i = 0; i < 256; i+= 1) {
								map[i] = 0;
							}
							map[64] = 1;
						}
					}
				}
			} else {
				// check for [R]History
				if (this.engine.isLifeHistory) {
					// [R]Super: use mapping below
					if (pattern.isSuper) {
						// notrail OFF
						map[14] = 0;
						map[16] = 0;
						map[18] = 0;
						map[20] = 0;
						map[22] = 0;
						map[24] = 0;

						// withtrailON
						map[9] = 1;
						map[11] = 1;

						// notrailON
						map[13] = 1;
						map[15] = 1;
						map[17] = 1;
						map[19] = 1;
						map[21] = 1;
						map[23] = 1;
						map[25] = 1;

						// withtrailOFF
						map[10] = 2;
						map[12] = 2;

						// markedON
						map[7] = 3;

						// markedOFF
						map[8] = 4;

						// clear other states
						for (i = 26; i < 256; i += 1) {
							map[i] = 0;
						}
					} else {
						// [R]Investigator: change state 3 to state 6 and all other states >= 2 go to zero
						if (pattern.isExtended) {
							for (i = 2; i < 256; i += 1) {
								map[i] = 0;
							}
							map[3] = 6;
						}
					}
				} else {
					// check for [R]Super
					if (this.engine.isSuper) {
						// [R]Extended: change state 3 to state 6 and all other states >=2 go to zero
						if (pattern.isExtended) {
							for (i = 2; i < 256; i += 1) {
								map[i] = 0;
							}
							map[3] = 6;
						}
					} else {
						// check for [R]Investigator
						if (this.engine.isExtended) {
							// [R]Super and [R]History: change state 6 to state 3 and all other states >=2 go to zero
							if (pattern.isHistory || pattern.isSuper) {
								for (i = 2; i < 256; i += 1) {
									map[i] = 0;
								}
								map[6] = 3;
							}
						}
					}
				}
			}
		}

		// ensure states are in range
		for (i = 0; i < 256; i += 1) {
			if (map[i] >= states) {
				map[i] = 0;
			}
		}
	};

	// handle successful read of system clipboard during paste
	View.prototype.handleSuccessfulRead = function(/** @type {string} */ text, /** @type {boolean} */ shift, /** @type {boolean} */ evolveStep) {
		// create a pattern from the text
		var	/** @type {Pattern} */ pattern = this.manager.create("", text, this.engine.allocator, null, null, null, this),
			/** @type {Uint8Array} */ buffer = null,
			/** @type {Uint8Array} */ patternRow = null,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ count = 0,
			/** @type {Uint8Array} */ map = new Uint8Array(256);

		// check if the pattern decoded (regardless of whether the rule was valid)
		if (pattern.multiStateMap !== null) {
			// get the conversion map
			this.createConversionMap(map, pattern);

			// create the copy buffer
			width = pattern.width;
			height = pattern.height;
			buffer = /** @type {!Uint8Array} */ (this.engine.allocator.allocate(Type.Uint8, width * height, "View.pasteBuffer" + this.currentPasteBuffer));

			// read the states from the pattern
			for (y = 0; y < height; y += 1) {
				patternRow = pattern.multiStateMap[y];
				for (x = 0; x < width; x += 1) {
					state = patternRow[x];

					// convert the state using the map and save it in the paste buffer
					buffer[i] = map[state];

					// count number of non-zero cells for the clipboard tooltip
					if (state > 0) {
						count += 1;
					}
					i += 1;
				}
			}

			// copy to required buffer
			this.pasteBuffers[this.currentPasteBuffer] = {buffer: buffer, width: width, height: height, count: count};
			this.pasteBuffer = buffer;
			this.pasteWidth = width;
			this.pasteHeight = height;
			this.createClipboardTooltips();

			// now complete the paste
			this.completeProcessPaste(shift, evolveStep);
		} else {
			this.menuManager.notification.notify("Could not decode system clipboard", 15, 180, 15, true);
			console.log(this.manager.failureReason);
		}
	};

	// handle failed read of system clipboard during paste
	View.prototype.handleFailedRead = function(/** @type {boolean} */ shift, /** @type {boolean} */ evolveStep) {
		// use the internal clipboard instead
		this.completeProcessPaste(shift, evolveStep);
	};

	// async function to read the system clipboard
	async function readSystemClipboard(/** @type {View} */ me, /** @type {boolean} */ shift, /** @type {boolean} */ evolveStep) {
		// try to read the system clipboard
		try {
			const text = await navigator.clipboard.readText();

			// if it works then use the contents
			me.handleSuccessfulRead(text, shift, evolveStep);
		} catch(error) {

			// if it fails then use the internal clipboard
			me.handleFailedRead(shift, evolveStep);
		}
	};

	// attempt to read the system clipboard
	View.prototype.readSystemClipboard = function(/** @type {boolean} */ shift, /** @type {boolean} */ evolveStep) {
		readSystemClipboard(this, shift, evolveStep);
	};

	// process paste
	View.prototype.completeProcessPaste = function(/** @type {boolean} */ shift, /** @type {boolean} */ evolveStep) {
		var	/** @type {number} */ xOff = (this.engine.width >> 1) - (this.patternWidth >> 1) + (this.xOffset << 1),
			/** @type {number} */ yOff = (this.engine.height >> 1) - (this.patternHeight >> 1) + (this.yOffset << 1),
			/** @type {BoundingBox} */ selBox = this.selectionBox,
			/** @type {number} */ save = 0,
			/** @type {number} */ leftX = selBox.leftX,
			/** @type {number} */ bottomY = selBox.bottomY,
			/** @type {number} */ rightX = selBox.rightX,
			/** @type {number} */ topY = selBox.topY,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ savedLocation = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// check for copy buffer
		if (this.pasteBuffers[this.currentPasteBuffer] !== null) {
			// check for paste to selection
			if (shift) {
				// check for a selection
				if (this.isSelection) {
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
					if (this.pasteWidth > width || this.pasteHeight > height) {
						this.menuManager.notification.notify("Paste does not fit in selection", 15, 180, 15, true);
					} else {
						// paste top left to always fit in selection box
						savedLocation = this.pastePosition;
						this.pastePosition = ViewConstants.pastePositionNW;
						for (y = bottomY; y <= bottomY + height - this.pasteHeight; y += this.pasteHeight) {
							for (x = leftX; x <= leftX + width - this.pasteWidth; x += this.pasteWidth) {
								this.performPaste(this, x + xOff, y + yOff, false);
							}
						}
						this.pastePosition = savedLocation;
						if (this.autoShrink) {
							this.autoShrinkSelection(this);
						}
						if (evolveStep) {
							this.afterEdit("advance outside");
						} else {
							this.afterEdit("paste to selection");
						}
					}
				} else {
					this.menuManager.notification.notify("Paste to Selection needs a selection", 15, 180, 15, true);
				}
			} else {
				this.pasteSelection(this, this.currentPasteBuffer);
				this.menuManager.notification.notify("Now click to paste", 15, 180, 15, true);
			}
		}
	};

	// process paste
	View.prototype.processPaste = function(/** @type {View} */ me, /** @type {boolean} */ shift, /** @type {boolean} */ evolveStep) {
		if (!me.viewOnly) {
			// check system clipboard for a pattern
			if (me.copySyncExternal) {
				me.readSystemClipboard(shift, evolveStep);
			} else {
				me.completeProcessPaste(shift, evolveStep);
			}

		}
	};

	// paste from enter key
	View.prototype.pasteFromEnter = function(/** @type {View} */ me) {
		me.performPaste(me, me.cellX, me.cellY, true);
	};

	// paste pressed
	View.prototype.pastePressed = function(/** @type {View} */ me) {
		me.processPaste(me, false, false);
	};

	// paste selection
	View.prototype.pasteSelection = function(/** @type {View} */ me, /** @type {number} */ number) {
		// get the required paste
		if (number >= 0 && number < me.pasteBuffers.length) {
			if (me.pasteBuffers[number] !== null) {
				me.isPasting = true;
				me.pasteBuffer = me.pasteBuffers[number].buffer;
				me.pasteWidth = me.pasteBuffers[number].width;
				me.pasteHeight = me.pasteBuffers[number].height;

				// switch to select mode
				if (me.modeList.current !== ViewConstants.modeSelect) {
					me.modeList.current = me.viewModeList(ViewConstants.modeSelect, true, me);
				}
			} else {
				me.isPasting = false;
				me.menuManager.notification.notify("Clipboard empty", 15, 180, 15, true);
			}
		}
	};

	// random paste
	View.prototype.randomPaste = function(/** @type {View} */ me, /** @type {boolean} */ twoStateOnly) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ numStates = me.engine.multiNumStates;

		// check for 2 state patterns
		if (numStates === -1) {
			numStates = 2;
		}

		// randomize cells
		if (me.engine.isPCA) {
			for (i = 0; i < me.pasteBuffer.length; i += 1) {
				state = 0;

				// N
				if (me.randGen.random() * 100 <= me.randomDensity) {
					state |= 1;
				}

				// E
				if (me.randGen.random() * 100 <= me.randomDensity) {
					state |= 2;
				}

				// S
				if (me.randGen.random() * 100 <= me.randomDensity) {
					state |= 4;
				}

				// W
				if (me.randGen.random() * 100 <= me.randomDensity) {
					state |= 8;
				}

				me.pasteBuffer[i] = state;
			}
		} else {
			for (i = 0; i < me.pasteBuffer.length; i += 1) {
				if (me.randGen.random() * 100 <= me.randomDensity) {
					if (numStates === 2 || twoStateOnly) {
						state = me.drawState;
					} else {
						state = ((me.randGen.random() * (numStates - 1)) | 0) + 1;
					}
				} else {
					state = 0;
				}

				me.pasteBuffer[i] = state;
			}
		}
	};

	// random selection
	View.prototype.randomSelection = function(/** @type {View} */ me, /** @type {boolean} */ twoStateOnly) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {number} */ numStates = me.engine.multiNumStates,
			/** @type {number} */ wasState6 = 0;

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

			// adjust in case specified is different than actual size
			if (me.engine.boundedGridType !== -1) {
				xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
				yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
			}

			// draw random cells
			if (me.engine.isPCA) {
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						state = 0;

						// N
						if (me.randGen.random() * 100 <= me.randomDensity) {
							state |= 1;
						}

						// E
						if (me.randGen.random() * 100 <= me.randomDensity) {
							state |= 2;
						}

						// S
						if (me.randGen.random() * 100 <= me.randomDensity) {
							state |= 4;
						}

						// W
						if (me.randGen.random() * 100 <= me.randomDensity) {
							state |= 8;
						}

						wasState6 = me.setStateWithUndo(x + xOff, y + yOff, state, true, false);
					}
				}
			} else {
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						if (me.randGen.random() * 100 <= me.randomDensity) {
							if (numStates === 2 || twoStateOnly) {
								state = me.drawState;
							} else {
								state = ((me.randGen.random() * (numStates - 1)) | 0) + 1;
							}
						} else {
							state = 0;
						}
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, state, true, false);
					}
				}
			}

			if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
				this.engine.populateState6MaskFromColGrid();
			}

			// check if shrink needed
			me.engine.shrinkNeeded = true;
			me.engine.doShrink();

			// save edit
			me.afterEdit("random " + me.randomDensity + "%");
		}
	};

	// random fill
	View.prototype.randomFill = function(/** @type {View} */ me, /** @type {boolean} */ twoStateOnly) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.randomPaste(me, twoStateOnly);
			} else {
				me.randomSelection(me, twoStateOnly);
			}
		}
	};

	// random pressed
	View.prototype.randomPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			me.randomFill(me, false);
		}
	};

	// random 2-state pressed
	View.prototype.random2Pressed = function(/** @type {View} */ me) {
		me.randomFill(me, true);
	};

	// flip X paste
	View.prototype.flipXPaste = function(/** @type {View} */ me) {
		var	/** @type {number} */ w = me.pasteWidth,
			/** @type {number} */ h = me.pasteHeight,
			/** @type {number} */ w2 = w >> 1,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ state = 0;

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
	View.prototype.flipXSelection = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ swap = 0,
			/** @type {Uint8Array} */ row = null,
			/** @type {number} */ state = 0,
			/** @type {number} */ states = me.engine.multiNumStates,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {number} */ wasState6 = 0;

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

			// adjust in case specified is different than actual size
			if (me.engine.boundedGridType !== -1) {
				xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
				yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
			}

			// allocate the row
			row = /** @type {!Uint8Array} */ (me.engine.allocator.allocate(Type.Uint8, (x2 - x1 + 1), "View.flipRow"));

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
						me.setStateWithUndo(x + xOff, y + yOff, (state & 5) | ((state & 2) << 2) | ((state & 8) >> 2), true, false);
					}
				} else {
					for (x = x1; x <= x2; x += 1) {
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, row[x2 - x], true, false);
					}
				}
			}

			if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
				this.engine.populateState6MaskFromColGrid();
			}

			// check if shrink needed
			me.engine.shrinkNeeded = true;
			me.engine.doShrink();

			// save edit
			me.afterEdit("flip horizontally");
		}
	};

	// flip Y paste
	View.prototype.flipYPaste = function(/** @type {View} */ me) {
		var	/** @type {number} */ w = me.pasteWidth,
			/** @type {number} */ h = me.pasteHeight,
			/** @type {number} */ h2 = h >> 1,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ state = 0;

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
	View.prototype.flipYSelection = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ swap = 0,
			/** @type {Uint8Array} */ column = null,
			/** @type {number} */ state = 0,
			/** @type {number} */ states = me.engine.multiNumStates,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {number} */ wasState6 = 0;

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

			// adjust in case specified is different than actual size
			if (me.engine.boundedGridType !== -1) {
				xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
				yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
			}

			// allocate the row
			column = /** @type {!Uint8Array} */ (me.engine.allocator.allocate(Type.Uint8, (y2 - y1 + 1), "View.flipColumn"));

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
						me.setStateWithUndo(x + xOff, y + yOff, (state & 10) | ((state & 1) << 2) | ((state & 4) >> 2), true, false);
					}
				} else {
					for (y = y1; y <= y2; y += 1) {
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, column[y2 - y], true, false);
					}
				}
			}

			if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
				this.engine.populateState6MaskFromColGrid();
			}

			// check if shrink needed
			me.engine.shrinkNeeded = true;
			me.engine.doShrink();

			// save edit
			me.afterEdit("flip vertically");
		}
	};

	// rotate paste
	View.prototype.rotatePaste = function(/** @type {View} */ me, /** @type {boolean} */ clockwise) {
		var	/** @type {number} */ w = me.pasteWidth,
			/** @type {number} */ h = me.pasteHeight,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ value = 0,
			/** @type {Uint8Array} */ newBuffer = /** @type {!Uint8Array} */ (me.engine.allocator.allocate(Type.Uint8, w * h, "View.pasteBuffer"));

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
	View.prototype.rotateSelection = function(/** @type {View} */ me, /** @type {boolean} */ clockwise, /** @type {string} */ comment) {
		me.rotateSelection90(me, clockwise, comment);

		/* TBD
		if (me.engine.isHex) {
			me.rotateSelection60(me, clockwise, comment);
		} else {
			if (me.engine.isTriangular) {
				// me.rotateSelection120(me, clockwise, comment);
			} else {
				me.rotateSelection90(me, clockwise, comment);
			}
		}
		*/
	};

	// rotate hex selection
	//View.prototype.rotateSelection60 = function(/** @type {View} */ me, /** @type {boolean} */ clockwise, /** @type {string} */ comment) {
		//var	/** @type {BoundingBox} */ box = me.selectionBox,
			///** @type {number} */ x1 = box.leftX,
			///** @type {number} */ x2 = box.rightX,
			///** @type {number} */ y1 = box.bottomY,
			///** @type {number} */ y2 = box.topY,
			///** @type {number} */ x = 0,
			///** @type {number} */ y = 0,
			///** @type {number} */ swap = 0,
			///** @type {Int16Array} */ cells = null,
			///** @type {number} */ state = 0,
			///** @type {number} */ i = 0,
			///** @type {number} */ j = 0,
			///** @type {number} */ cx = 0,
			///** @type {number} */ cy = 0,
			///** @type {number} */ w = 0,
			///** @type {number} */ h = 0,
			///** @type {number} */ newLeftX = 0,
			///** @type {number} */ newBottomY = 0,
			///** @type {number} */ newRightX = 0,
			///** @type {number} */ newTopY = 0,
			///** @type {number} */ newX = 0,
			///** @type {number} */ newY = 0,
			///** @type {number} */ saveLeftX = 0,
			///** @type {number} */ saveBottomY = 0,
			///** @type {number} */ saveRightX = 0,
			///** @type {number} */ saveTopY = 0,
			///** @type {number} */ states = me.engine.multiNumStates,
			///** @type {boolean} */ rotateFits = true,
			///** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			///** @type {number} */ boxOffset = (me.engine.isMargolus ? -1 : 0),
			///** @type {number} */ leftX = Math.round((me.engine.width - me.engine.boundedGridWidth) / 2) + boxOffset,
			///** @type {number} */ bottomY = Math.round((me.engine.height - me.engine.boundedGridHeight) / 2) + boxOffset,
			///** @type {number} */ rightX = leftX + me.engine.boundedGridWidth - 1,
			///** @type {number} */ topY = bottomY + me.engine.boundedGridHeight - 1,
			///** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			///** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			///** @type {number} */ wasState6 = 0;

		//// check for selection
		//if (me.isSelection) {
			//if (x1 > x2) {
				//swap = x2;
				//x2 = x1;
				//x1 = swap;
			//}
			//if (y1 > y2) {
				//swap = y2;
				//y2 = y1;
				//y1 = swap;
			//}

			//// compute width and height of selection
			//w = (x2 - x1 + 1);
			//h = (y2 - y1 + 1);

			//// compute center of rotation
			//cx = x1 + ((w - 1) >> 1);
			//cy = y1 + ((h - 1) >> 1);

			//// compute new x and y
			//newLeftX = cx + y1 - cy;
			//newBottomY = cy + x1 - cx;
			//newRightX = cx + y2 - cy;
			//newTopY = cy + x2 - cx;

			//// transform selection
			//saveLeftX = box.leftX;
			//saveBottomY = box.bottomY;
			//saveRightX = box.rightX;
			//saveTopY = box.topY;
			//box.leftX = newLeftX;
			//box.bottomY = newBottomY;
			//box.rightX = newRightX;
			//box.topY = newTopY;
			//if (box.leftX > box.rightX) {
				//swap = box.leftX;
				//box.leftX = box.rightX;
				//box.rightX = swap;
			//}
			//if (box.bottomY > box.topY) {
				//swap = box.bottomY;
				//box.bottomY = box.topY;
				//box.topY = swap;
			//}

			//// check if rotation fits in bounded grid if specified
			//if (me.engine.boundedGridType !== -1) {
				//if (box.leftX + xOff < leftX || box.rightX + xOff > rightX || box.bottomY + yOff < bottomY || box.topY + yOff > topY) {
					//me.menuManager.notification.notify("Rotation does not fit in bounded grid", 15, 180, 15, true);
					//rotateFits = false;
				//}
			//} else {
				//// check if rotation has grown the grid and was clipped
				//if (me.checkSelectionSize(me)) {
					//me.menuManager.notification.notify("Rotation does not fit on grid", 15, 180, 15, true);
					//rotateFits = false;
				//} else {
					//// recompute offset in case grid grew
					//xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
					//yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
				//}
			//}

			//// if rotation does not fit then restore original selection box
			//if (!rotateFits) {
				//box.leftX = saveLeftX;
				//box.bottomY = saveBottomY;
				//box.rightX = saveRightX;
				//box.topY = saveTopY;
			//} else {
				//// allocate the cells
				//cells = /** @type {!Int16Array} */ (me.engine.allocator.allocate(Type.Int16, 3 * w * h, "View.rotateCells"));

				//// read each cell in the selection and rotate coordinates
				//cx = w >> 1;
				//cy = h >> 1;

				//for (y = 0; y < h; y += 1) {
					//for (x = 0; x < w; x += 1) {
						//state = me.engine.getState(x + xOff + x1, y + yOff + y1, false);
						//if (invertForGenerations) {
							//if (state > 0) {
								//state = states - state;
							//}
						//}
						//newX = x - cx;
						//newY = y - cy;
						//if (!clockwise) {
							//for (j = 0; j < 4; j += 1) {
								//swap = newX;
								//newX = newX - newY;
								//newY = swap;
							//}
						//}
						//cells[i] = newX - newY + x1 + cx;
						//cells[i + 1] = newX + y1 + cy;
						//cells[i + 2] = state;
						//i += 3;
					//}
				//}

				//// recompute offsets in case grid changed
				//xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
				//yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

				//// write the cells to their new positions
				//i = 0;
				//while (i < cells.length) {
					//x = cells[i];
					//y = cells[i + 1];
					//state = cells[i + 2];
					//wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, state, true, false);
					//i += 3;
				//}

				//// clear outside intersection between new selection and old
				//for (x = x1; x < box.leftX; x += 1) {
					//for (y = y1; y <= y2; y += 1) {
						//wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					//}
				//}
				//for (x = box.rightX + 1; x <= x2; x += 1) {
					//for (y = y1; y <= y2; y += 1) {
						//wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					//}
				//}
				//for (y = y1; y < box.bottomY; y += 1) {
					//for (x = x1; x <= x2; x += 1) {
						//wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					//}
				//}
				//for (y = box.topY + 1; y <= y2; y += 1) {
					//for (x = x1; x <= x2; x += 1) {
						//wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					//}
				//}

				//if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
					//this.engine.populateState6MaskFromColGrid();
				//}

				//// check if shrink needed
				//me.engine.shrinkNeeded = true;
				//me.engine.doShrink();

				//// save edit
				//me.afterEdit(comment);
			//}
		//}
	//};

	// rotate selection
	View.prototype.rotateSelection90 = function(/** @type {View} */ me, /** @type {boolean} */ clockwise, /** @type {string} */ comment) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ swap = 0,
			/** @type {Int16Array} */ cells = null,
			/** @type {number} */ state = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @type {number} */ w = 0,
			/** @type {number} */ h = 0,
			/** @type {number} */ newLeftX = 0,
			/** @type {number} */ newBottomY = 0,
			/** @type {number} */ newRightX = 0,
			/** @type {number} */ newTopY = 0,
			/** @type {number} */ newXInc = 0,
			/** @type {number} */ newYInc = 0,
			/** @type {number} */ firstNewY = 0,
			/** @type {number} */ newX = 0,
			/** @type {number} */ newY = 0,
			/** @type {number} */ saveLeftX = 0,
			/** @type {number} */ saveBottomY = 0,
			/** @type {number} */ saveRightX = 0,
			/** @type {number} */ saveTopY = 0,
			/** @type {number} */ states = me.engine.multiNumStates,
			/** @type {boolean} */ rotateFits = true,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper || this.engine.isExtended)),
			/** @type {number} */ boxOffset = (me.engine.isMargolus ? -1 : 0),
			/** @type {number} */ leftX = Math.round((me.engine.width - me.engine.boundedGridWidth) / 2) + boxOffset,
			/** @type {number} */ bottomY = Math.round((me.engine.height - me.engine.boundedGridHeight) / 2) + boxOffset,
			/** @type {number} */ rightX = leftX + me.engine.boundedGridWidth - 1,
			/** @type {number} */ topY = bottomY + me.engine.boundedGridHeight - 1,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {number} */ wasState6 = 0;

		// check for selection
		if (me.isSelection) {
			// adjust in case specified is different than actual size
			if (me.engine.boundedGridType !== -1) {
				xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
				yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
			}

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

					// adjust in case specified is different than actual size
					if (me.engine.boundedGridType !== -1) {
						xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
						yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
					}

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
				cells = /** @type {!Int16Array} */ (me.engine.allocator.allocate(Type.Int16, 3 * (x2 - x1 + 1) * (y2 - y1 + 1), "View.rotateCells"));

				// read each cell in the selection and rotate coordinates
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

				// recompute offsets in case grid changed
				xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
				yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

				// adjust in case specified is different than actual size
				if (me.engine.boundedGridType !== -1) {
					xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
					yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
				}

				// write the cells to their new positions
				i = 0;
				while (i < cells.length) {
					x = cells[i];
					y = cells[i + 1];
					state = cells[i + 2];
					wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, state, true, false);
					i += 3;
				}

				// clear outside intersection between new selection and old
				for (x = x1; x < box.leftX; x += 1) {
					for (y = y1; y <= y2; y += 1) {
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					}
				}
				for (x = box.rightX + 1; x <= x2; x += 1) {
					for (y = y1; y <= y2; y += 1) {
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					}
				}
				for (y = y1; y < box.bottomY; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					}
				}
				for (y = box.topY + 1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, 0, true, false);
					}
				}

				if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
					this.engine.populateState6MaskFromColGrid();
				}

				// check if shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();

				// save edit
				me.afterEdit(comment);
			}
		}
	};

	// cancel seleciton pressed
	View.prototype.cancelSelectionPressed = function(/** @type {View} */ me) {
		me.removeSelection(me);
	};

	// nudge left pressed
	View.prototype.nudgeLeftPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, -1, 0);
		}
	};

	// nudge right pressed
	View.prototype.nudgeRightPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, 1, 0);
		}
	};

	// nudge up pressed
	View.prototype.nudgeUpPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, 0, -1);
		}
	};

	// nudge down pressed
	View.prototype.nudgeDownPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, 0, 1);
		}
	};

	// advance outside pressed
	View.prototype.advanceOutsidePressed = function(/** @type {View} */ me) {
		me.evolvePressed(me, true);
	};

	// advance selection pressed
	View.prototype.advanceSelectionPressed = function(/** @type {View} */ me) {
		me.evolvePressed(me, false);
	};

	// flip X pressed
	View.prototype.flipXPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.flipXPaste(me);
			} else {
				me.flipXSelection(me);
			}
		}
	};

	// flip Y pressed
	View.prototype.flipYPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.flipYPaste(me);
			} else {
				me.flipYSelection(me);
			}
		}
	};

	// rotate CW pressed
	View.prototype.rotateCWPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.rotatePaste(me, true);
			} else {
				me.rotateSelection(me, true, "rotate clockwise");
			}
		}
	};

	// rotate CCW pressed
	View.prototype.rotateCCWPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.rotatePaste(me, false);
			} else {
				me.rotateSelection(me, false, "rotate counter-clockwise");
			}
		}
	};

	// invert paste
	View.prototype.invertPaste = function(/** @type {View} */ me) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ numStates = me.engine.multiNumStates;

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
	View.prototype.invertSelection = function(/** @type {View} */ me) {
		var	/** @type {BoundingBox} */ box = me.selectionBox,
			/** @type {number} */ x1 = box.leftX,
			/** @type {number} */ x2 = box.rightX,
			/** @type {number} */ y1 = box.bottomY,
			/** @type {number} */ y2 = box.topY,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			/** @type {number} */ numStates = me.engine.multiNumStates,
			/** @type {number} */ wasState6 = 0;

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

				// adjust in case specified is different than actual size
				if (me.engine.boundedGridType !== -1) {
					xOff += Math.round((me.patternWidth - me.specifiedWidth) / 2);
					yOff += Math.round((me.patternHeight - me.specifiedHeight) / 2);
				}

				// invert cells in selection
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						state = me.engine.getState(x + xOff, y + yOff, false);
						if (!(me.engine.isSuper || me.engine.isExtended || me.engine.isPCA || me.engine.isRuleTree) && numStates > 2 && state > 0) {
							state = numStates - state;
						}
						wasState6 |= me.setStateWithUndo(x + xOff, y + yOff, numStates - state - 1, true, false);
					}
				}

				if ((me.engine.isLifeHistory || me.engine.isSuper) && wasState6) {
					this.engine.populateState6MaskFromColGrid();
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
	View.prototype.invertSelectionPressed = function(/** @type {View} */ me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.invertPaste(me);
			} else {
				me.invertSelection(me);
			}
		}
	};

	// reverse direction button
	View.prototype.directionPressed = function(/** @type {View} */ me) {
		var	/** @type {boolean} */ flag = false;

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
	View.prototype.fitPressed = function(/** @type {View} */ me) {
		// fit zoom
		me.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);

		// flag manual change made if paused
		if (!me.generationOn) {
			me.manualChange = true;
		}
	};

	// copy rule button clicked
	View.prototype.copyAsMAPPressed = function(/** @type {View} */ me) {
		var	/** @type {string} */ ruleText = "";

		//if (me.engine.isRuleTree && me.engine.multiNumStates === 2 && !(me.engine.ruleTableOutput && me.engine.ruleTableNeighbourhood === PatternConstants.ruleTableOneD)) {
		if (me.engine.isRuleTree && me.engine.multiNumStates === 2) {
			ruleText = me.engine.ruleLoaderToMAP();
			me.copyToClipboard(me, ruleText);
		}
	};

	// copy rule button clicked
	View.prototype.copyRulePressed = function(/** @type {View} */ me) {
		var	/** @type {string} */ ruleText = me.patternRuleName;

		if (me.engine.isRuleTree) {
			// check the rule cache
			ruleText = RuleTreeCache.getDefinition(ruleText);
			if (ruleText === "") {
				// if cache was empty the rule might have been inline
				ruleText = me.manager.ruleLoaderDefinition;
			}
		}
		me.copyToClipboard(me, ruleText);
	};

	// identify button action
	View.prototype.identifyAction = function(/** @type {View} */ me) {
		// close Help or Errors if open
		if (me.displayHelp !== 0 || me.displayErrors !== 0) {
			me.displayHelp = 0;
			me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);
			me.displayErrors = 0;
		}

		// check if anything is alive
		if (me.engine.population === 0) {
			me.menuManager.notification.notify("No live cells to Identify", 15, 120, 15, false);
			me.identify = false;
			me.resultsDisplayed = false;
		} else {
			if (me.identify) {
				me.identify = false;
				me.menuManager.notification.notify("Identify cancelled", 15, 120, 15, false);

				// create undo point
				me.afterEdit("");
			} else {
				me.identify = true;

				// hide previous results
				me.resultsDisplayed = false;
				me.engine.tableStartRow = 0;

				// start identification
				me.menuManager.notification.notify("Identifying...", 15, 216000, 15, false);

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

		// set results to summary
		me.identifyStrictToggle.current = me.toggleCellPeriodMap(0, true, me);
	};

	// save image button pressed
	View.prototype.saveImagePressed = function(/** @type {View} */ me) {
		me.screenShotScheduled = 1;
	};

	// save graph image button pressed
	View.prototype.saveGraphPressed = function(/** @type {View} */ me) {
		me.screenShotScheduled = 2;
	};

	// save a black and white screenshot
	View.prototype.saveBWImagePressed = function(/** @type {View} */ me) {
		me.screenShotScheduled = 3;
	};

	// go to generation button pressed
	View.prototype.goToGenPressed = function(/** @type {View} */ me) {
		// prompt for generation
		var	/** @type {string|null} */ result = window.prompt("Enter generation", String(me.engine.counter)),
			/** @type {number} */ number = 0,
			/** @type {boolean} */ timing = false;

		// check one was entered
		me.startFromTiming = -1;
		if (result !== null) {
			// check for timing mode
			if ((result.substring(result.length - 1)).toLowerCase() === "b") {
				result = result.substring(0, result.length - 1);
				timing = true;
			}

			// check for relative generation
			if (result.substring(0, 1) === "+") {
				number = /** @type {!number} */ (me.engine.counter);
				number += parseInt(result.substring(1), 10);
			} else {
				if (result.substring(0, 1) === "-") {
					number = /** @type {!number} */ (me.engine.counter);
					number -= parseInt(result.substring(1), 10);
				} else {
					number = parseInt(result, 10);
				}
			}

			if (number >= 0 && number <= ViewConstants.maxStartFromGeneration) {
				if (number !== me.engine.counter) {
					// check for zero population
					if (me.lifeEnded()) {
						me.menuManager.notification.notify("No live cells", 15, 360, 15, false);
					} else {
						// move to specified generation
						me.startFrom = number;
						me.navToggle.current = me.toggleSettings([false], true, me);
						me.menuManager.toggleRequired = true;
						if (me.genNotifications) {
							me.menuManager.notification.notify("Going to generation " + number, 15, 10000, 15, false);
						}
						me.menuManager.notification.clear(true, false);

						// if the required generation is earlier then reset
						if (number < me.engine.counter) {
							me.engine.restoreSavedGrid(me, false);
							me.setUndoGen(me.engine.counter);
						}

						// setup timing if requested
						if (timing) {
							me.startFromTiming = performance.now();
						}

						// calculate number of generations to move
						me.startFromGens = number - me.engine.counter;
					}
				}
			} else {
				me.menuManager.notification.notify("Invalid generation specified", 15, 240, 15, true);
			}
		}
	};

	// identify button pressed
	View.prototype.identifyPressed = function(/** @type {View} */ me) {
		me.identifyAction(me);
	};

	// grid toggle
	/** @returns {Array<boolean>} */
	View.prototype.toggleGrid = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.engine.displayGrid = newValue[0];
		}

		return [me.engine.displayGrid];
	};

	// lines toggle
	/** @returns {Array<boolean>} */
	View.prototype.toggleLines = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.popGraphLines = newValue[0];
		}

		return [me.popGraphLines];
	};

	// pause while drawing toggle
	/** @returns {Array<boolean>} */
	View.prototype.togglePausePlayback = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.pauseWhileDrawing = newValue[0];
		}
		return [me.pauseWhileDrawing];
	};

	// show lag toggle
	/** @returns {Array<boolean>} */
	View.prototype.toggleShowLag = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.perfWarning = newValue[0];
		}

		return [me.perfWarning];
	};

	// throttle toggle
	/** @returns {Array<boolean>} */
	View.prototype.toggleThrottle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.canBailOut = newValue[0];
		}

		return [me.canBailOut];
	};

	// settings menu toggle
	/** @returns {Array<boolean>} */
	View.prototype.toggleSettings = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			// close help if settings opened
			if ((me.displayHelp !== 0 || me.displayErrors !== 0) && newValue[0]) {
				me.displayHelp = 0;
				me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);
				me.displayErrors = 0;
			}

			// if settings switched off and there were errors then display them
			if (!newValue[0] && me.scriptErrors.length > 0) {
				me.displayErrors = 1;
			}

			// close theme selection buttons if settings closed
			if (!newValue[0]) {
				me.backPressed(me);
			}

			// hide notification if menu opening
			if (newValue[0]) {
				// hide any notifications
				me.menuManager.notification.clear(false, false);
				me.menuManager.notification.clear(true, false);
			}
		}
		return newValue;
	};

	// smart drawing toggle
	/** @return {Array<boolean>} */
	View.prototype.toggleSmart = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.smartDrawing = newValue[0];
		}

		return [me.smartDrawing];
	};

	// states toggle
	/** @return {Array<boolean>} */
	View.prototype.toggleStates = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.showStates = newValue[0];
		}

		return [me.showStates];
	};

	// cell period map display
	/** @return {number} */
	View.prototype.toggleCellPeriodMap = function(/** @type {number} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.periodMapDisplayed = newValue;
		}

		return me.periodMapDisplayed;
	};

	// pick toggle
	/** @return {Array<boolean>} */
	View.prototype.togglePick = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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
	/** @return {Array<boolean>} */
	View.prototype.toggleAutoFit = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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
	/** @return {Array<boolean>} */
	View.prototype.toggleLoop = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
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
	/** @return {Array<boolean>} */
	View.prototype.toggleAutostart = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			if (me.autoStart) {
				me.autoStartDisabled = !newValue[0];
			}
		}

		return [me.autoStartDisabled];
	};

	// stop indicator toggle
	/** @return {Array<boolean>} */
	View.prototype.toggleStop = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			if (me.stopGeneration !== -1) {
				me.stopDisabled = !newValue[0];
			}
		}

		return [me.stopDisabled];
	};

	// waypoint/track indictor toggle
	/** @return {Array<boolean>} */
	View.prototype.toggleWP = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		var	/** @type {Array<boolean>} */ result = [false];

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

						// update twice without interpolation
						me.waypointManager.update(me, me.elapsedTime, me.engine.counter, false);
						me.waypointManager.update(me, me.elapsedTime, me.engine.counter, false);
					}

					// check for loop
					if (me.loopGeneration !== -1) {
						// set loop to waypoints mode
						me.loopDisabled = me.waypointsDisabled;
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
	/** @return {Array<boolean>} */
	View.prototype.toggleHelp = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			if (newValue[0]) {
				me.displayHelp = 1;
			} else {
				me.displayHelp = 0;
			}
			if (me.displayHelp) {
				// close settings menu if open
				if (me.navToggle.current[0]) {
					me.navToggle.current = me.toggleSettings([false], true, me);
				}

				// hide any notifications
				me.menuManager.notification.clear(false, false);
				me.menuManager.notification.clear(true, false);
			} else {
				// reset to welcome topic on close
				me.setHelpTopic(ViewConstants.welcomeTopic, me);
				me.displayHelp = 0;
			}
		}

		me.setMousePointer(/** @type {!number} */ (me.modeList.current));

		return [me.displayHelp !== 0];
	};

	// save view
	View.prototype.saveViewPressed = function(/** @type {View} */ me) {
		me.saveCamera(me);
	};

	// restore view
	View.prototype.restoreViewPressed = function(/** @type {View} */ me) {
		me.resetSavedCamera(me);
	};

	// show last identify results
	View.prototype.lastIdentifyPressed = function(/** @type {View} */ me) {
		me.displayLastIdentifyResults(me);
	};

	// snap angle to nearest 45 degrees
	View.prototype.snapToNearest45Pressed = function(/** @type {View} */ me) {
		var	/** @type {number} */ value = me.angleItem.current[0];

		value = Math.floor((value + 45 / 2) / 45) * 45;

		// wrap if required
		if (value >= 360) {
			value = 0;
		}

		// update UI
		me.angleItem.current = me.viewAngleRange([value, value], true, me);
	};

	// stop all viewers
	View.prototype.stopAllPressed = function(/** @type {View} */ me) {
		Controller.stopAllViewers();
	};

	// stop all viewers
	View.prototype.stopOthersPressed = function(/** @type {View} */ me) {
		Controller.stopOtherViewers(me);
	};

	// reset all viewers
	View.prototype.resetAllPressed = function(/** @type {View} */ me) {
		Controller.resetAllViewers();
	};

	// clear drawing state cells
	View.prototype.clearDrawingCellsPressed = function(/** @type {View} */ me) {
		me.clearCells(me, false, false);
	};

	// relative/absolute generation display toggle
	/** @return {Array<boolean>} */
	View.prototype.viewRelativeToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.genRelative = newValue[0];
		}

		return [me.genRelative];
	};

	// quality rendering display toggle
	/** @return {Array<boolean>} */
	View.prototype.viewQualityToggle = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.engine.pretty = newValue[0];
			me.engine.initPretty();
		}

		return [me.engine.pretty];
	};

	// stats toggle
	/** @return {Array<boolean>} */
	View.prototype.viewStats = function(/** @type {Array<boolean>} */ newValue, /** @type {boolean} */ change, /** @type {View} */ me) {
		if (change) {
			me.statsOn = newValue[0];
		}

		// ensure update happens
		me.menuManager.setAutoUpdate(true);

		return [me.statsOn];
	};

	// scroll errors up
	View.prototype.scrollErrorsUp = function(/** @type {View} */ me, /** @type {number} */ amount) {
		// scroll errors up
		if (me.displayErrors > 1) {
			me.displayErrors -= amount;
			if (me.displayErrors < 1)  {
				me.displayErrors = 1;
			}
		}
	};

	// scroll errors down
	View.prototype.scrollErrorsDown = function(/** @type {View} */ me, /** @type {number} */ amount) {
		if (me.displayErrors < me.scriptErrors.length - me.numHelpPerPage + 1) {
			me.displayErrors += amount;
			if (me.displayErrors > me.scriptErrors.length - me.numHelpPerPage + 1) {
				me.displayErrors = me.scriptErrors.length - me.numHelpPerPage + 1;
			}
		}
	};

	// scroll help up
	View.prototype.scrollHelpUp = function(/** @type {View} */ me, /** @type {number} */ amount) {
		// scroll help up
		if (me.displayHelp > 1) {
			me.displayHelp -= amount;
			if (me.displayHelp < 1)  {
				me.displayHelp = 1;
			}
		}
	};

	// scroll help down
	View.prototype.scrollHelpDown = function(/** @type {View} */ me, /** @type {number} */ amount) {
		if (me.displayHelp < me.numHelpLines - me.numHelpPerPage) {
			me.displayHelp += amount;
			if (me.displayHelp > me.numHelpLines - me.numHelpPerPage) {
				me.displayHelp = me.numHelpLines - me.numHelpPerPage;
			}
		}
	};

	// move to previous help section
	View.prototype.previousHelpSection = function(/** @type {View} */ me) {
		// find help section before current line
		var	/** @type {number} */ i = me.helpSections.length - 1,
			/** @type {boolean} */ found = false;

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
	View.prototype.nextHelpSection = function(/** @type {View} */ me) {
		// find help section after current line
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false;

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
	View.prototype.runForwardTo = function(/** @type {number} */ targetGen) {
		// for PCA clear the next generation
		if (this.engine.isPCA) {
			if (this.engine.counter < targetGen) {
				if ((this.engine.counter & 1) === 1) {
					this.engine.colourGrid.whole.fill(0);
				} else {
					this.engine.nextColourGrid.whole.fill(0);
				}
			}
		}

		// compute each generation up to the target
		while (this.engine.counter < targetGen) {
			this.engine.nextGeneration(false);
			this.engine.convertToPensTile();

			// save population data
			this.engine.savePopulationData();

			this.engine.saveSnapshotIfNeeded(this);
			this.pasteRLEList();
		}

		// restore the elapsed time
		this.elapsedTime = this.elapsedTimes[targetGen];
		this.fixedPointCounter = targetGen * this.refreshRate;
	};

	// run to given generation (used to step back)
	View.prototype.runTo = function(/** @type {number} */ targetGen) {
		var	/** @type {number} */ fading = this.historyStates + (this.engine.multiNumStates > 0 ? this.engine.multiNumStates : 0);

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
				this.fixedPointCounter = targetGen * this.refreshRate;

				// don't actually step back if pattern is dead at the requested generation
				if (this.diedGeneration !== -1 && targetGen > this.diedGeneration + fading) {
					this.engine.counter = targetGen;
				} else {
					// run to target generation
					this.engine.runTo(targetGen, this.graphDisabled, this);
				}

				// restore the elapsed time again
				this.elapsedTime = this.elapsedTimes[targetGen];
				this.fixedPointCounter = targetGen * this.refreshRate;

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
					this.engine.restoreSavedGrid(this, false);

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
		element.style.border = "none";
		element.style.outline = "none";
		element.style.boxShadow = "none";
		element.style.background = "transparent";
		element.style.position = "fixed";
		element.style.left = "-100px";
		element.style.top = "0px";
	};

	//* @returns {string} */
	async function getClipText() {
		return Controller.clipText;
	}

	// copy string to clipboard
	View.prototype.copyToClipboard = function(/** @type {View} */ me, /** @type {string} */ contents) {
		var	/** @type {Element} */ copyElement = document.getElementById("ViewerCopy"),
			/** @type {ClipboardItem} */ clipboardItem = null;

		// save the contents
		Controller.clipText = contents;

		// copy the text to the system clipboard
		// check if ClipboardItem is available
		if (window.ClipboardItem) {
			// attempt to create the clipboard item
			try {
				clipboardItem = new ClipboardItem({
					'text/plain': getClipText().then(() => {
						return new Promise(async (resolve) => {
							resolve(new Blob([contents], {type: "text/plain"}))
						})
					}),
				});
			} catch(err) {
			}
		}

		if (clipboardItem) {
			// write to the clipboard
			navigator.clipboard.write([clipboardItem])
		} else {
			// just write text (Firefox)
			navigator.clipboard.writeText(contents);
		}

		// display copy notification
		me.menuManager.notification.notify("Copied to external clipboard", 15, 180, 15, true);

		// check if a copy text box exists
		if (copyElement) {
			copyElement.innerHTML = contents;
		}
	};

	// convert a theme colour object to an RGB string or colour name
	/** @returns {string} */
	View.prototype.asColourString = function(/** @type {Colour} */ colourRGB) {
		var	colourList = ColourManager.colourList,
			/** @type {Array<string>} */ keys = Object.keys(colourList),
			/** @type {number} */ redValue = colourRGB.red,
			/** @type {number} */ greenValue = colourRGB.green,
			/** @type {number} */ blueValue = colourRGB.blue,
			/** @type {string} */ result = "",
			/** @type {boolean} */ found = false,
			triple = null,
			/** @type {number} */ i = 0;

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
	/** @returns {boolean} */
	View.prototype.areSameColour = function(/** @type {Colour} */ first, /** @type {Colour} */ second) {
		return ((first.red === second.red) && (first.green === second.green) && (first.blue === second.blue));
	};

	// add the current position to the clipboard as script commands
	View.prototype.copyPosition = function(/** @type {View} */ me, /** @type {boolean} */ full) {
		// comment prefix
		var	/** @type {string} */ commentPrefix = "#C ",

			// start with script start command
			/** @type {string} */ string = commentPrefix + Keywords.scriptStartWord + " ",

			// compute the x and y coordinates
			/** @type {number} */ xVal = -((me.engine.width / 2 - me.engine.xOff - me.engine.originX) | 0),
			/** @type {number} */ yVal = -((me.engine.height / 2 - me.engine.yOff - me.engine.originY) | 0),
			/** @type {string} */ xValStr = String(xVal),
			/** @type {string} */ yValStr = String(yVal),

			// get the zoom
			/** @type {number} */ zoom = me.engine.zoom,
			/** @type {string} */ zoomStr,

			// get the angle
			/** @type {string} */ angleStr = String(me.engine.angle | 0),

			// get the tile
			/** @type {string} */ tiltStr = String(me.engine.tilt | 0),

			// get the theme
			/** @type {Theme} */ theme = me.engine.themes[me.engine.colourTheme];

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

		// camera tilt
		if (me.engine.tilt !== 0) {
			string += Keywords.tiltWord + " " + tiltStr + " ";
		}

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
		me.copyToClipboard(me, string);
	};

	// save the current rle to the source document node
	View.prototype.saveCurrentRLE = function(/** @type {View} */ me) {
		// don't use alias names since it makes it less compatible with other CA simulators
		me.element.innerHTML = me.engine.asRLE(me, me.engine, true, me.engine.multiNumStates, me.engine.multiNumStates, [], false);
		me.element.value = me.element.innerHTML;
	};

	// replace the current rle with the given text
	View.prototype.loadText = function(/** @type {View} */ me, /** @type {string} */ text) {
		var	/** @type {boolean} */ result = false;

		// check whether prompt required
		if (me.undoButton.locked || me.randomizeGuard) {
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
	View.prototype.copyRLE = function(/** @type {View} */ me) {
		// copy the source pattern to the clipboard
		if (DocConfig.multi) {
			me.copyToClipboard(me, Controller.patterns[me.universe].pattern);
		} else {
			me.copyToClipboard(me, cleanPattern(me.element));
		}
	};

	// select and copy current rle
	View.prototype.copyCurrentRLE = function(/** @type {View} */ me, /** @type {boolean} */ addComments) {
		// copy the current pattern to the clipboard
		me.copyToClipboard(me, me.engine.asRLE(me, me.engine, addComments, me.engine.multiNumStates, me.engine.multiNumStates, [], false));
	};

	// key down
	View.prototype.keyDown = function(/** @type {View} */ me, /** @type {KeyboardEvent} */ event) {
		// get the key code
		var	/** @type {number} */ keyCode = event.charCode || event.keyCode,

			// flag if key processed
			/** @type {boolean} */ processed = false;

		// ignore keys in compute history mode
		if (me.computeHistory) {
			// process the key in history mode
			processed = KeyProcessor.processKeyHistory(me, keyCode, event);
		} else {
			if (me.identify) {
				// process the key in identify mode
				processed = KeyProcessor.processKeyIdentify(me, keyCode, event);
			} else {
				// check for go to generation
				if (me.startFrom !== -1) {
					processed = KeyProcessor.processKeyGoTo(me, keyCode, event);
				} else {
					// check for overview
					if (Controller.overview) {
						processed = KeyProcessor.processKeyOverview(me, keyCode, event);
					} else {
						// process the key
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
			event.stopPropagation();
		}
	};

	// update selection controls position based on window height
	View.prototype.updateSelectionControlsPosition = function() {
		if (this.engine.isLifeHistory || this.engine.isSuper) {
			this.changeCellStateButton.setPosition(Menu.southEast, -85, -130);
			this.invertSelectionButton.setPosition(Menu.southEast, -130, -130);
			if (this.engine.isLifeHistory) {
				this.randomButton.setPosition(Menu.southEast, -175, -130);
				this.randomButton.toolTip = "random fill [Shift 5]";
				this.randomItem.setPosition(Menu.southEast, -280, -130);
			} else {
				this.randomButton.setPosition(Menu.southEast, -220, -130);
				this.randomButton.toolTip = "random multi-state fill [Shift 5]";
				this.random2Button.setPosition(Menu.southEast, -175, -130);
				this.randomItem.setPosition(Menu.southEast, -325, -130);
			}
		} else {
			if (this.engine.multiNumStates <= 2) {
				this.changeCellStateButton.setPosition(Menu.southEast, -40, -130);
				this.invertSelectionButton.setPosition(Menu.southEast, -85, -130);
				this.randomButton.setPosition(Menu.southEast, -130, -130);
				this.randomButton.toolTip = "random fill [Shift 5]";
				this.randomItem.setPosition(Menu.southEast, -235, -130);
			} else {
				this.changeCellStateButton.setPosition(Menu.southEast, -40, -130);
				this.invertSelectionButton.setPosition(Menu.southEast, -85, -130);
				if (this.engine.isPCA) {
					this.randomButton.setPosition(Menu.southEast, -130, -130);
					this.randomButton.toolTip = "random multi-state fill [Shift 5]";
					this.randomItem.setPosition(Menu.southEast, -235, -130);
				} else {
					this.randomButton.setPosition(Menu.southEast, -175, -130);
					this.randomButton.toolTip = "random multi-state fill [Shift 5]";
					this.random2Button.setPosition(Menu.southEast, -130, -130);
					this.randomItem.setPosition(Menu.southEast, -280, -130);
				}
			}
		}
	};

	// update help topic buttons position based on window height
	View.prototype.updateTopicButtonsPosition = function() {
		var	/** @type {number} */ y = 0,
			/** @type {number} */ inc = 50,
			/** @type {boolean} */ showThemes = !(this.engine.isNone || this.engine.isSuper || this.engine.isExtended|| this.engine.isRuleTree);

		if (this.displayHeight < ViewConstants.minMenuHeight) {
			y = 50;
			this.helpKeysButton.setPosition(Menu.northWest, 10, y);
			this.helpScriptsButton.setPosition(Menu.north, 0, y);
			this.helpInfoButton.setPosition(Menu.northEast, -160, y);
			y += inc;
			if (showThemes) {
				this.helpThemesButton.setPosition(Menu.northWest, 10, y);
				this.helpColoursButton.setPosition(Menu.north, 0, y);
				this.helpAliasesButton.setPosition(Menu.northEast, -160, y);
				y += inc;
				if (this.waypointManager.numAnnotations() > 0) {
					this.helpMemoryButton.setPosition(Menu.northWest, 10, 150);
					this.helpAnnotationsButton.setPosition(Menu.northEast, -160, 150);
				} else {
					this.helpMemoryButton.setPosition(Menu.north, 0, 150);
				}
			} else {
				this.helpColoursButton.setPosition(Menu.northWest, 10, y);
				this.helpAliasesButton.setPosition(Menu.north, 0, y);
				this.helpMemoryButton.setPosition(Menu.northEast, -160, y);
				y += inc;
				if (this.waypointManager.numAnnotations() > 0) {
					this.helpAnnotationsButton.setPosition(Menu.north, 0, y);
				}
			}
		} else {
			if (this.waypointManager.numAnnotations() > 0) {
				y = -175;
			} else {
				y = -150;
			}
			this.helpKeysButton.setPosition(Menu.middle, 0, y);
			y += inc;
			this.helpScriptsButton.setPosition(Menu.middle, 0, y);
			y += inc;
			this.helpInfoButton.setPosition(Menu.middle, 0, y);
			y += inc;
			if (showThemes) {
				this.helpThemesButton.setPosition(Menu.middle, 0, y);
				y += inc;
			}
			this.helpColoursButton.setPosition(Menu.middle, 0, y);
			y += inc;
			this.helpAliasesButton.setPosition(Menu.middle, 0, y);
			y += inc;
			this.helpMemoryButton.setPosition(Menu.middle, 0, y);
			y += inc;
			this.helpAnnotationsButton.setPosition(Menu.middle, 0, y);
		}
	};

	// set menu colours
	View.prototype.setMenuColours = function() {
		var	/** @type {string} */ fgCol = "white",
			/** @type {string} */ bgCol = "black",
			/** @type {string} */ highlightCol = "rgb(0,240,32)",
			/** @type {string} */ selectedCol = "blue",
			/** @type {string} */ lockedCol = "grey",
			/** @type {string} */ borderCol = "white",
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

		// check for custom grid
		element = this.customThemeValue[ViewConstants.customThemeGrid];
		if (element !== -1) {
			this.iconManager.recolour = true;
			if (this.engine.littleEndian) {
				this.iconManager.recolourGrid = (255 << 24) | (element & 255) << 16 | (((element >> 8) & 255) << 8) | (element >> 16);
			} else {
				this.iconManager.recolourGrid = ((element >> 16) << 24) | (((element >> 8) & 255) << 16) | ((element & 255) << 8) | 255;
			}
		} else {
			// set default menu colour (will colour icons correctly)
			this.iconManager.recolour = true;
			element = (112 << 16) | (112 << 8) | 112;
			if (this.engine.littleEndian) {
				this.iconManager.recolourGrid = (255 << 24) | (element & 255) << 16 | (((element >> 8) & 255) << 8) | (element >> 16);
			} else {
				this.iconManager.recolourGrid = ((element >> 16) << 24) | (((element >> 8) & 255) << 16) | ((element & 255) << 8) | 255;
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

		// use the UI background colour as the shadow colour
		if (this.engine.littleEndian) {
			this.iconManager.shadowCol = (255 << 24) | (element & 255) << 16 | (((element >> 8) & 255) << 8) | (element >> 16);
		} else {
			this.iconManager.shadowCol = ((element >> 16) << 24) | (((element >> 8) & 255) << 16) | ((element & 255) << 8) | 255;
		}

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
		this.menuManager.setColours(fgCol, bgCol, highlightCol, selectedCol, lockedCol, borderCol, this.helpFontColour);

		// set the escape button background
		this.escButton.bgCol = "red";
	};

	// create menus
	View.prototype.createMenus = function() {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ lastX = 0;

		// View menu

		// create the view menu
		this.viewMenu = this.menuManager.createMenu(this.viewAnimate, this.viewStart, this);

		// add callback for background drag
		this.viewMenu.dragCallback = this.viewDrag;

		// add callback for wakeup when GUI locked
		this.viewMenu.wakeCallback = this.viewWakeUp;

		// add callback for pinch on touch devices
		this.menuManager.pinchCallback = this.viewPinch;

		// identify banner label
		this.identifyBannerLabel = this.viewMenu.addLabelItem(Menu.north, 0, 52, 480, 48, "Banner");
		this.identifyBannerLabel.setFont("32px Arial");

		// create identify results labels
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
		this.autostartIndicator.toolTip = ["autostart [" + this.altKeyText + " O]"];

		// stop indicator
		this.stopIndicator = this.viewMenu.addListItem(this.toggleStop, Menu.northEast, -210, 20, 38, 20, ["STOP"], [false], Menu.multi);
		this.stopIndicator.setFont(ViewConstants.smallMenuFont);
		this.stopIndicator.toolTip = ["stop [" + this.altKeyText + " P]"];

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

		// done button
		this.doneButton = this.viewMenu.addButtonItem(this.donePressed, Menu.northEast, -110, 40, 60, 40, "OK");
		this.doneButton.toolTip = "confirm setting disabled and hide warning";

		// help button
		this.helpToggle = this.viewMenu.addListItem(this.toggleHelp, Menu.northEast, -40, 0, 40, 40, ["Help"], [false], Menu.multi);
		this.helpToggle.toolTip = ["toggle help display [H]"];
		this.helpToggle.setFont("16px Arial");

		// help show topics button
		this.topicsButton = this.viewMenu.addButtonItem(this.topicsPressed, Menu.northEast, -40, 50, 40, 40, "^");
		this.topicsButton.toolTip = "show help topics [Backspace]";

		// help sections button
		this.sectionsButton = this.viewMenu.addButtonItem(this.sectionsPressed, Menu.northEast, -40, 100, 40, 40, "<");
		this.sectionsButton.toolTip = "show help sections [Ins]";

		// help individual topic buttons
		this.helpKeysButton = this.viewMenu.addButtonItem(this.keysTopicPressed, Menu.north, 0, 50, 150, 40, "Keys");
		this.helpKeysButton.toolTip = "show keyboard shortcuts [K]";

		this.helpScriptsButton = this.viewMenu.addButtonItem(this.scriptsTopicPressed, Menu.north, 0, 100, 150, 40, "Scripts");
		this.helpScriptsButton.toolTip = "show script commands [S]";

		this.helpInfoButton = this.viewMenu.addButtonItem(this.infoTopicPressed, Menu.north, 0, 150, 150, 40, "Info");
		this.helpInfoButton.toolTip = "show pattern and engine information [I]";

		this.helpThemesButton = this.viewMenu.addButtonItem(this.themesTopicPressed, Menu.north, 0, 200, 150, 40, "Themes");
		this.helpThemesButton.toolTip = "show colour Themes [T]";

		this.helpColoursButton = this.viewMenu.addButtonItem(this.coloursTopicPressed, Menu.north, 0, 250, 150, 40, "Colours");
		this.helpColoursButton.toolTip = "show colour names [C]";

		this.helpAliasesButton = this.viewMenu.addButtonItem(this.aliasesTopicPressed, Menu.north, 0, 300, 150, 40, "Aliases");
		this.helpAliasesButton.toolTip = "show rule aliases [A]";

		this.helpMemoryButton = this.viewMenu.addButtonItem(this.memoryTopicPressed, Menu.north, 0, 350, 150, 40, "Memory");
		this.helpMemoryButton.toolTip = "show memory usage [Y]";

		this.helpAnnotationsButton = this.viewMenu.addButtonItem(this.annotationsTopicPressed, Menu.north, 0, 350, 150, 40, "Annotations");
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
		this.selSizeLabel = this.viewMenu.addLabelItem(Menu.southWest, 210, -70, 130, 30, "");
		this.selSizeLabel.textAlign = Menu.left;
		this.selSizeLabel.setFont(ViewConstants.statsFont);
		this.selSizeLabel.toolTip = "selection size";

		// add the cursor position labels
		this.xyLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -70, 210, 30, "");
		this.xyLabel.textAlign = Menu.left;
		this.xyLabel.setFont(ViewConstants.statsFont);
		this.xyLabel.toolTip = "cell state at cursor position";

		// add the generation label
		this.genToggle = this.viewMenu.addListItem(this.viewStats, Menu.southWest, 0, -40, 100, 40, ["T 0"], [this.statsOn], Menu.multi);
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
		this.layersItem = this.viewMenu.addRangeItem(this.viewLayersRange, Menu.east, -84, 0, 40, 292, ViewConstants.maxLayers, ViewConstants.minLayers, 1, true, "Layers ", "", 0);
		this.layersItem.toolTip = "number of layers [Q / A]";

		// add the depth range
		this.depthItem = this.viewMenu.addRangeItem(this.viewDepthRange, Menu.east, -40, 0, 40, 292, 1, 0, 0.1, true, "Depth ", "", 2);
		this.depthItem.toolTip = "depth between layers [P / L]";

		// add the tilt range
		this.tiltItem = this.viewMenu.addRangeItem(this.viewTiltRange, Menu.west, 0, 0, 40, 292, 0, 1, 0.5, true, "Tilt ", "", 1);
		this.tiltItem.toolTip = "camera tilt [' / /]";

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
		this.hexCellButton = this.viewMenu.addListItem(this.viewHexCellToggle, Menu.middle, -100, -100, 180, 40, ["Use Rectangles"], [this.engine.forceRectangles], Menu.multi);
		this.hexCellButton.toolTip = ["toggle hexagonal cells [?]"];

		// cell borders toggle button
		this.bordersButton = this.viewMenu.addListItem(this.viewBordersToggle, Menu.middle, 100, -100, 180, 40, ["Cell Borders"], [this.engine.cellBorders], Menu.multi);
		this.bordersButton.toolTip = ["toggle cell borders [" + this.altKeyText + " B]"];

		// major gridlines toggle button
		this.majorButton = this.viewMenu.addListItem(this.viewMajorToggle, Menu.middle, -100, -50, 180, 40, ["Major GridLines"], [this.engine.gridLineMajorEnabled], Menu.multi);
		this.majorButton.toolTip = ["toggle major gridlines [Shift X]"];

		// stars toggle button
		this.starsButton = this.viewMenu.addListItem(this.viewStarsToggle, Menu.middle, 100, -50, 180, 40, ["Starfield"], [this.starsOn], Menu.multi);
		this.starsButton.toolTip = ["toggle starfield display [S]"];

		// label toggle button
		this.labelButton = this.viewMenu.addListItem(this.viewLabelToggle, Menu.middle, -100, 0, 180, 40, ["Annotations"], [this.showLabels], Menu.multi);
		this.labelButton.toolTip = ["toggle annotations [" + this.altKeyText + " L]"];

		// rainbow button
		this.rainbowButton = this.viewMenu.addListItem(this.viewRainbowToggle, Menu.middle, 100, 0, 180, 40, ["Rainbow"], [this.engine.rainbow], Menu.multi);
		this.rainbowButton.toolTip = ["toggle rainbow mode [" + this.altKeyText + " W]"]; 

		// autogrid toggle button
		this.autoGridButton = this.viewMenu.addListItem(this.viewAutoGridToggle, Menu.middle, -100, 50, 180, 40, ["Auto GridLines"], [this.autoGrid], Menu.multi);
		this.autoGridButton.toolTip = ["automatically turn on gridlines for Draw and Select and off for Pan [" + this.controlKeyText + " G]"]; 

		// alt grid toggle button
		this.altGridButton = this.viewMenu.addListItem(this.viewAltGridToggle, Menu.middle, 100, 50, 180, 40, ["Alt GridLines"], [this.engine.altGrid], Menu.multi);
		this.altGridButton.toolTip = ["toggle alternating gridlines [" + this.altKeyText + " D]"]; 

		// integer zoom button
		this.integerZoomButton = this.viewMenu.addButtonItem(this.integerZoomPressed, Menu.middle, -100, 100, 180, 40, "Integer Zoom");
		this.integerZoomButton.toolTip = "set zoom to nearest integer [Shift 1]";

		// quality rendering toggle button
		this.qualityToggle = this.viewMenu.addListItem(this.viewQualityToggle, Menu.middle, 100, 100, 180, 40, ["Render Quality"], [this.engine.pretty], Menu.multi);
		this.qualityToggle.toolTip = ["toggle anti-aliased cell display [" + this.controlKeyText + " Q]"];

		// go to generation button
		this.goToGenButton = this.viewMenu.addButtonItem(this.goToGenPressed, Menu.middle, -100, -50, 180, 40, "Go To Gen");
		this.goToGenButton.toolTip = "go to specified generation [Shift N]";

		// historyfit toggle button
		this.historyFitButton = this.viewMenu.addListItem(this.viewHistoryFitToggle, Menu.middle, 100, -50, 180, 40, ["AutoFit History"], [this.historyFit], Menu.multi);
		this.historyFitButton.toolTip = ["toggle AutoFit History [Shift H]"];

		// add the throttle toggle button
		this.throttleToggle = this.viewMenu.addListItem(this.toggleThrottle, Menu.middle, -100, 0, 180, 40, ["Throttle"], [this.canBailOut], Menu.multi);
		this.throttleToggle.toolTip = ["toggle playback throttling [" + this.altKeyText + " T]"];

		// add the show lag toggle button
		this.showLagToggle = this.viewMenu.addListItem(this.toggleShowLag, Menu.middle, 100, 0, 180, 40, ["Perf. Warning"], [this.perfWarning], Menu.multi);
		this.showLagToggle.toolTip = ["toggle performance warning display [Shift W]"];

		// kill gliders toggle button
		this.killButton = this.viewMenu.addListItem(this.viewKillToggle, Menu.middle, -100, 50, 180, 40, ["Kill Gliders"], [this.engine.clearGliders], Menu.multi);
		this.killButton.toolTip = ["toggle kill escaping gliders [" + this.controlKeyText + " L]"];

		// autohide toggle button
		this.autoHideButton = this.viewMenu.addListItem(this.viewAutoHideToggle, Menu.middle, 100, 50, 180, 40, ["AutoHide UI"], [this.hideGUI], Menu.multi);
		this.autoHideButton.toolTip = ["toggle hide UI on playback [" + this.altKeyText + " U]"]; 

		// rule button
		this.ruleButton = this.viewMenu.addButtonItem(this.rulePressed, Menu.middle, -100, -100, 180, 40, "Change Rule");
		this.ruleButton.toolTip = "change rule [" + this.altKeyText + " R]";

		// new button
		this.newButton = this.viewMenu.addButtonItem(this.newPressed, Menu.middle, 100, -100, 180, 40, "New Pattern");
		this.newButton.toolTip = "new pattern [" + this.altKeyText + " N]";

		// load button
		this.loadButton = this.viewMenu.addButtonItem(this.loadPressed, Menu.middle, -100, -50, 180, 40, "Load Pattern");
		this.loadButton.toolTip = "load last saved pattern [" + this.controlKeyText + " O]";

		// save button
		this.saveButton = this.viewMenu.addButtonItem(this.savePressed, Menu.middle, 100, -50, 180, 40, "Save Pattern");
		this.saveButton.toolTip = "save pattern [" + this.controlKeyText + " S]";

		// randomize button
		this.randomizeButton = this.viewMenu.addButtonItem(this.randomizePressed, Menu.middle, -100, 0, 180, 40, "Rand All");
		this.randomizeButton.toolTip = "randomize pattern and rule [" + this.altKeyText + " Z]";

		// randomize button
		this.randomizePatternButton = this.viewMenu.addButtonItem(this.randomizePatternPressed, Menu.middle, 100, 0, 180, 40, "Rand Pattern");
		this.randomizePatternButton.toolTip = "randomize pattern and keep rule [" + this.controlKeyText + " " + this.altKeyText + " Z]";

		// identify button
		this.identifyButton = this.viewMenu.addButtonItem(this.identifyPressed, Menu.middle, -100, 50, 180, 40, "Identify");
		this.identifyButton.toolTip = "identify oscillator or spaceship period [F6]";

		// last identify results
		this.lastIdentifyResultsButton = this.viewMenu.addButtonItem(this.lastIdentifyPressed, Menu.middle, 100, 50, 180, 40, "Last Identify");
		this.lastIdentifyResultsButton.toolTip = "show last identify results [Shift F6]";

		// image button
		this.saveImageButton = this.viewMenu.addButtonItem(this.saveImagePressed, Menu.middle, -100, 100, 180, 40, "Save Image");
		this.saveImageButton.toolTip = "save image [O]";

		// save graph button
		this.saveGraphButton = this.viewMenu.addButtonItem(this.saveGraphPressed, Menu.middle, 100, 100, 180, 40, "Save Graph");
		this.saveGraphButton.toolTip = "save population graph image [Shift O]";

		// open clipboard button
		this.openClipboardButton = this.viewMenu.addButtonItem(this.openClipboardPressed, Menu.middle, -100, -100, 180, 40, "Open Clipboard");
		this.openClipboardButton.toolTip = "open clipboard as pattern [" + this.controlKeyText + " Shift O]";

		// copy original pattern button
		this.copyOriginalButton = this.viewMenu.addButtonItem(this.copyOriginalPressed, Menu.middle, 100, -100, 180, 40, "Copy Original");
		this.copyOriginalButton.toolTip = "copy original pattern [" + this.controlKeyText + " Shift C]";

		// copy rule button
		this.copyRuleButton = this.viewMenu.addButtonItem(this.copyRulePressed, Menu.middle, -100, -50, 180, 40, "Copy Rule");
		this.copyRuleButton.toolTip = "copy rule definition [" + this.controlKeyText + " J]";

		// copy as MAP button
		this.copyAsMAPButton = this.viewMenu.addButtonItem(this.copyAsMAPPressed, Menu.middle, 100, -50, 180, 40, "Copy as MAP");
		this.copyAsMAPButton.toolTip = "copy rule definition as MAP [" + this.altKeyText + " M]";

		// copy neighbourhood button
		this.copyNeighbourhoodButton = this.viewMenu.addButtonItem(this.copyNeighbourhoodPressed, Menu.middle, -100, 0, 180, 40, "Copy Nhood");
		this.copyNeighbourhoodButton.toolTip = "copy CoordCA neighbourhood definition [" + this.controlKeyText + " B]";

		// copy with comments button
		this.copyWithCommentsButton = this.viewMenu.addButtonItem(this.copyWithCommentsPressed, Menu.middle, 100, 0, 180, 40, "Copy All");
		this.copyWithCommentsButton.toolTip = "copy current pattern with comments [" + this.controlKeyText + " " + this.altKeyText + " C]";

		// copy position button
		this.copyPositionButton = this.viewMenu.addButtonItem(this.copyPositionPressed, Menu.middle, -100, 50, 180, 40, "Copy Position");
		this.copyPositionButton.toolTip = "copy camera position [K]";

		// copy view button
		this.copyViewButton = this.viewMenu.addButtonItem(this.copyViewPressed, Menu.middle, 100, 50, 180, 40, "Copy View");
		this.copyViewButton.toolTip = "copy camera position and view [Shift K]";

		// paste to selection button
		this.pasteToSelectionButton = this.viewMenu.addButtonItem(this.pasteToSelectionPressed, Menu.middle, -100, 100, 180, 40, "Paste To Seln");
		this.pasteToSelectionButton.toolTip = "paste to selection [" + this.controlKeyText + " Shift V]";

		// copy sync extern toggle
		this.copySyncToggle = this.viewMenu.addListItem(this.viewCopySyncList, Menu.middle, 100, 100, 180, 40, ["External Sync"], [this.copySyncExternal], Menu.multi);
		this.copySyncToggle.toolTip = ["sync cut and copy with external clipboard [" + this.altKeyText + " S]"];

		// previous universe button
		this.prevUniverseButton = this.viewMenu.addButtonItem(this.prevUniversePressed, Menu.south, -135, -150, 120, 40, "Prev");
		this.prevUniverseButton.toolTip = "go to previous pattern [Page Up]";

		// next universe button
		this.nextUniverseButton = this.viewMenu.addButtonItem(this.nextUniversePressed, Menu.south, 135, -150, 120, 40, "Next");
		this.nextUniverseButton.toolTip = "go to next pattern [Page Down]";

		// multiverse button
		this.multiverseButton = this.viewMenu.addButtonItem(this.multiversePressed, Menu.south, 0, -150, 120, 40, "Patterns");
		this.multiverseButton.toolTip = "show all patterns [Home]";

		// esc button
		this.escButton = this.viewMenu.addButtonItem(this.escPressed, Menu.southEast, -40, -85, 40, 40, "X");
		this.escButton.toolTip = "close window";
		this.escButton.setFont("24px Arial");
		this.escButton.bgCol = "red";

		// clear errors button
		this.closeErrorsButton = this.viewMenu.addButtonItem(this.closeErrorsPressed, Menu.southEast, -40, -85, 40, 40, "X");
		this.closeErrorsButton.toolTip = "close errors [Esc]";

		// previous POI button
		this.prevPOIButton = this.viewMenu.addButtonItem(this.prevPOIPressed, Menu.west, 10, 0, 40, 40, "<");
		this.prevPOIButton.toolTip = "go to previous POI [Shift J]";

		// next POI button
		this.nextPOIButton = this.viewMenu.addButtonItem(this.nextPOIPressed, Menu.east, -50, 0, 40, 40, ">");
		this.nextPOIButton.toolTip = "go to next POI [J]";

		// opacity range
		this.opacityItem = this.viewMenu.addRangeItem(this.viewOpacityRange, Menu.north, 0, 45, 172, 40, 0, 1, this.popGraphOpacity, true, "Opacity ", "%", 0);
		this.opacityItem.toolTip = "graph opacity [7 / 9]";

		// identify close button
		this.identifyCloseButton = this.viewMenu.addButtonItem(this.identifyClosePressed, Menu.northEast, -40, 45, 40, 40, "X");
		this.identifyCloseButton.toolTip = "close results [Esc]";

		// identify strict toggle
		this.identifyStrictToggle = this.viewMenu.addListItem(this.toggleCellPeriodMap, Menu.northEast, -40, 45, 40, 120, ["Res", "Tbl", "Map"], this.periodMapDisplayed, Menu.single);
		this.identifyStrictToggle.toolTip = ["show Identify results [Shift F6]", "toggle cell period table [E]", "toggle cell period map [D]"];
		this.identifyStrictToggle.setFont("15px Arial");
		this.identifyStrictToggle.textOrientation = Menu.horizontal;

		// identify save cell period map
		this.identifySaveCellMapButton = this.viewMenu.addButtonItem(this.identifySavePressed, Menu.northEast, -40, 45, 40, 40, "");
		this.identifySaveCellMapButton.toolTip = "download cell period map [Shift D]";
		this.identifySaveCellMapButton.icon = this.iconManager.icon("download");

		// identify page up button
		this.identifyPageUpButton = this.viewMenu.addButtonItem(this.identifyPageUpPressed, Menu.northEast, -40, 45, 40, 40, "");
		this.identifyPageUpButton.icon = this.iconManager.icon("nudgeup");
		this.identifyPageUpButton.toolTip = "scroll table up [PgUp]";

		// identify page down button
		this.identifyPageDownButton = this.viewMenu.addButtonItem(this.identifyPageDownPressed, Menu.northEast, -40, 45, 40, 40, "");
		this.identifyPageDownButton.icon = this.iconManager.icon("nudgedown");
		this.identifyPageDownButton.toolTip = "scroll table down [PgDown]";

		// graph close button
		this.graphCloseButton = this.viewMenu.addButtonItem(this.graphClosePressed, Menu.northEast, -40, 45, 40, 40, "X");
		this.graphCloseButton.toolTip = "close graph [Y]";

		// points/lines toggle
		this.linesToggle = this.viewMenu.addListItem(this.toggleLines, Menu.northEast, -85, 45, 40, 40, [""], [false], Menu.multi);
		this.linesToggle.icon = [this.iconManager.icon("lines")];
		this.linesToggle.toolTip = ["toggle graph lines/points [Shift Y]"];

		// graph data list
		this.graphDataToggle = this.viewMenu.addListItem(this.viewGraphList, Menu.northEast, -210, 45, 120, 40, ["Pop", "Bth", "Dth"], [this.graphShowPopulation, this.graphShowBirths, this.graphShowDeaths], Menu.multi);
		this.graphDataToggle.toolTip = ["toggle population [Shift F3]", "toggle births [Shift F4]", "toggle deaths [Shift F5]"];
		this.graphDataToggle.setFont("15px Arial");

		// pick toggle
		this.pickToggle = this.viewMenu.addListItem(this.togglePick, Menu.northWest, 0, 45, 40, 40, [""], [this.pickMode], Menu.multi);
		this.pickToggle.icon = [this.iconManager.icon("pick")];
		this.pickToggle.toolTip = ["pick state [F3]"];

		// states toggle
		this.statesToggle = this.viewMenu.addListItem(this.toggleStates, Menu.northWest, 45, 45, 40, 40, [""], [this.showStates], Menu.multi);
		this.statesToggle.icon = [this.iconManager.icon("states")];
		this.statesToggle.toolTip = ["toggle states display [" + this.controlKeyText + " D]"];

		// pause playback while drawing toggle
		this.pausePlaybackToggle = this.viewMenu.addListItem(this.togglePausePlayback, Menu.northWest, 90, 45, 40, 40, [""], [this.pauseWhileDrawing], Menu.multi);
		this.pausePlaybackToggle.icon = [this.iconManager.icon("drawpause")];
		this.pausePlaybackToggle.toolTip = ["toggle pause playback while drawing [" + this.controlKeyText + " P]"];

		// smart drawing toggle
		this.smartToggle = this.viewMenu.addListItem(this.toggleSmart, Menu.northWest, 135, 45, 40, 40, [""], [this.smartDrawing], Menu.multi);
		this.smartToggle.icon = [this.iconManager.icon("smart")];
		this.smartToggle.toolTip = ["toggle smart drawing [Shift F2]"];

		// add menu toggle button
		this.navToggle = this.viewMenu.addListItem(this.toggleSettings, Menu.southEast, -40, -40, 40, 40, [""], [false], Menu.multi);
		this.navToggle.icon = [this.iconManager.icon("menu")];
		this.navToggle.toolTip = ["toggle settings menu [M]"];

		// add the pattern button
		this.patternButton = this.viewMenu.addButtonItem(this.patternPressed, Menu.middle, -100, -75, 150, 40, "Pattern");
		this.patternButton.toolTip = "pattern actions";

		// add the clipboard button
		this.clipboardButton = this.viewMenu.addButtonItem(this.clipboardPressed, Menu.middle, 100, -75, 150, 40, "Clipboard");
		this.clipboardButton.toolTip = "clipboard actions";

		// add the colour theme button
		this.themeButton = this.viewMenu.addButtonItem(this.themePressed, Menu.middle, -100, 75, 150, 40, "Theme");
		this.themeButton.toolTip = "choose colour theme";

		// graph toggle button
		this.graphButton = this.viewMenu.addListItem(this.viewGraphToggle, Menu.middle, 100, 75, 150, 40, ["Graph"], [this.popGraph], Menu.multi);
		this.graphButton.toolTip = ["toggle population graph display [Y]"];

		// add the display button
		this.displayButton = this.viewMenu.addButtonItem(this.displayPressed, Menu.middle, -100, -25,  150, 40, "Display");
		this.displayButton.toolTip = "display settings";

		// add the playback button
		this.playbackButton = this.viewMenu.addButtonItem(this.playbackPressed, Menu.middle, 100, -25, 150, 40, "Playback");
		this.playbackButton.toolTip = "playback settings and actions";

		// add the general button
		this.actionsButton = this.viewMenu.addButtonItem(this.actionsPressed, Menu.middle, -100, 25,  150, 40, "General");
		this.actionsButton.toolTip = "general actions";

		// fit selection button
		this.fitSelectionButton = this.viewMenu.addButtonItem(this.fitSelectionPressed, Menu.middle, -100, -50, 180, 40, "Fit Selection");
		this.fitSelectionButton.toolTip = "fit selection to display [" + this.controlKeyText + " F]";

		// center pattern button
		this.centerPatternButton = this.viewMenu.addButtonItem(this.centerPatternPressed, Menu.middle, 100, -50, 180, 40, "Center Pattern");
		this.centerPatternButton.toolTip = "center pattern [" + this.controlKeyText + " M]";

		// clear drawing state cells button
		this.clearDrawingStateButton = this.viewMenu.addButtonItem(this.clearDrawingCellsPressed, Menu.middle, -100, 0, 180, 40, "Clear Drawing");
		this.clearDrawingStateButton.toolTip = "clear drawing state cells [" + this.controlKeyText + " " + this.altKeyText + " K]";

		// snap angle to nearest 45 degrees
		this.snapToNearest45Button = this.viewMenu.addButtonItem(this.snapToNearest45Pressed, Menu.middle, 100, 0, 180, 40, "Snap Angle");
		this.snapToNearest45Button.toolTip = "snap angle to nearest 45 degrees [" + this.altKeyText + " /]";

		// save view
		this.saveViewButton = this.viewMenu.addButtonItem(this.saveViewPressed, Menu.middle, -100, 50, 180, 40, "Save View");
		this.saveViewButton.toolTip = "save current view [Shift V]";

		// restore view
		this.restoreViewButton = this.viewMenu.addButtonItem(this.restoreViewPressed, Menu.middle, 100, 50, 180, 40, "Restore View");
		this.restoreViewButton.toolTip = "restore saved view [V]";

		// add the advanced button
		this.infoButton = this.viewMenu.addButtonItem(this.infoPressed, Menu.middle, 100, 25, 150, 40, "Advanced");
		this.infoButton.toolTip = "advanced settings and actions";

		// fps button
		this.fpsButton = this.viewMenu.addListItem(this.viewFpsToggle, Menu.middle, -100, -100, 180, 40, ["Frame Times"], [this.menuManager.showTiming], Menu.multi);
		this.fpsButton.toolTip = ["toggle timing display [T]"];

		// timing detail button
		this.timingDetailButton = this.viewMenu.addListItem(this.viewTimingDetailToggle, Menu.middle, 100, -100, 180, 40, ["Timing Details"], [this.menuManager.showExtendedTiming], Menu.multi);
		this.timingDetailButton.toolTip = ["toggle timing details [Shift T]"];

		// relative toggle button
		this.relativeToggle = this.viewMenu.addListItem(this.viewRelativeToggle, Menu.middle, -100, -50, 180, 40, ["Relative Gen"], [this.genRelative], Menu.multi);
		this.relativeToggle.toolTip = ["toggle absolute/relative generation display [Shift G]"];

		// reset all viewers button
		this.resetAllButton = this.viewMenu.addButtonItem(this.resetAllPressed, Menu.middle, 100, -50, 180, 40, "Reset All");
		this.resetAllButton.toolTip = "reset all Viewers [Shift R]";

		// stop all viewers button
		this.stopAllButton = this.viewMenu.addButtonItem(this.stopAllPressed, Menu.middle, -100, 0, 180, 40, "Stop All");
		this.stopAllButton.toolTip = "stop all Viewers [Shift Z]";

		// stop other viewers button
		this.stopOthersButton = this.viewMenu.addButtonItem(this.stopOthersPressed, Menu.middle, 100, 0, 180, 40, "Stop Others");
		this.stopOthersButton.toolTip = "stop other Viewers [Z]";

		// infobar toggle button
		this.infoBarButton = this.viewMenu.addListItem(this.viewInfoBarToggle, Menu.middle, -100, 50, 180, 40, ["Info Bar"], [this.infoBarEnabled], Menu.multi);
		this.infoBarButton.toolTip = ["toggle Information Bar [Shift I]"];

		// fast lookup toggle button
		this.fastLookupButton = this.viewMenu.addListItem(this.viewFastLookupToggle, Menu.middle, 100, 50, 180, 40, ["Fast Lookup"], [this.engine.ruleLoaderLookupEnabled], Menu.multi);
		this.fastLookupButton.toolTip = ["toggle fast lookup [F7]"];

		// state number toggle button
		this.stateNumberButton = this.viewMenu.addListItem(this.viewStateNumberToggle, Menu.middle, -100, 100, 180, 40, ["State Number"], [this.stateNumberDisplayed], Menu.multi);
		this.stateNumberButton.toolTip = ["toggle state number display [F8]"];

		// y coordinate direction button
		this.yDirectionButton = this.viewMenu.addListItem(this.viewYDirectionToggle, Menu.middle, 100, 100, 180, 40, ["Y Direction"], [this.yUp], Menu.multi);
		this.yDirectionButton.toolTip = ["toggle y coordinate direction [F9]"];

		// add the back button
		this.backButton = this.viewMenu.addButtonItem(this.backPressed, Menu.south, 0, -100, 120, 40, "Back");
		this.backButton.toolTip = "back to previous menu [Backspace]";

		// add the cancel button
		this.cancelButton = this.viewMenu.addButtonItem(this.cancelPressed, Menu.south, 0, -100, 120, 40, "Cancel");
		this.cancelButton.toolTip = "cancel operation [Esc]";
		this.cancelButton.overrideLocked = true;

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
			this.themeSelections[i] = this.viewMenu.addListItem(this.toggleTheme, Menu.north, x * 140 - 210, y, 120, 40, [this.themeName(j)], [false], Menu.multi);
			this.themeSelections[i].toolTip = ["select " + this.themeName(j) + " theme"];
			this.themeSelections[i].setFont("20px Arial");
		}

		// save the first theme selection button ID so the ID can be used to get the Theme number
		this.themeSelectionFirstID = this.themeSelections[0].id;

		// add the theme category labels
		this.themeDefaultLabel = this.viewMenu.addLabelItem(Menu.north, -210, 60, 120, 40, "Default");
		this.themeClassicLabel = this.viewMenu.addLabelItem(Menu.north, -70, 60, 120, 40, "Classic");
		this.themeProgramLabel = this.viewMenu.addLabelItem(Menu.north, 70, 60, 120, 40, "Program");
		this.themeDebugLabel = this.viewMenu.addLabelItem(Menu.north, 210, 60, 120, 40, "Basic");

		// 1x speed button
		this.speed1Button = this.viewMenu.addButtonItem(this.speed1Pressed, Menu.southEast, -405, -40, 40, 40, "1x");
		this.speed1Button.toolTip = "set 1x playback speed [0]";

		// add the speed range
		this.speedRange = this.viewMenu.addRangeItem(this.viewSpeedRange, Menu.southEast, -360, -40, 105, 40, 0, 2, 1, true, "", "", -1);
		this.speedRange.toolTip = "playback speed [+ / -]";

		// add the actual step label
		this.stepLabel = this.viewMenu.addLabelItem(Menu.southEast, -284, -30, 27, 20, "0");
		this.stepLabel.setFont(ViewConstants.statsFont);
		this.stepLabel.deleted = true;

		// add the undo button
		this.undoButton = this.viewMenu.addButtonItem(this.undoPressed, Menu.southEast, -495, -40, 40, 40, "");
		this.undoButton.icon = this.iconManager.icon("undo");
		this.undoButton.toolTip = "undo [" + this.controlKeyText + " Z]";

		// add the redo button
		this.redoButton = this.viewMenu.addButtonItem(this.redoPressed, Menu.southEast, -450, -40, 40, 40, "");
		this.redoButton.icon = this.iconManager.icon("redo");
		this.redoButton.toolTip = "redo [" + this.controlKeyText + " Y]";

		// add the icon toggle
		this.iconToggle = this.viewMenu.addListItem(this.viewIconList, Menu.northEast, -130, 0, 40, 40, ["Icon"], [this.useIcons], Menu.multi);
		this.iconToggle.toolTip = ["toggle icons [" + this.altKeyText + " I]"];
		this.iconToggle.setFont("15px Arial");

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
		this.stateColsList.setDrawIconCallback(this.renderStateIcons);

		// add spacer to left of states slider
		this.statesSpacer = this.viewMenu.addButtonItem(null, Menu.northWest, 175, 45, 5, 40, "");
		this.statesSpacer.bgAlpha = 0;
		this.statesSpacer.locked = true;
		this.statesSpacer.border = 0;

		// add slider for states
		this.statesSlider = this.viewMenu.addRangeItem(this.viewStatesRange, Menu.northWest, 180, 45, 130, 40, 0, 1, 0, true, "", "", -1);
		this.statesSlider.toolTip = "select drawing states range";

		// select all button
		this.selectAllButton = this.viewMenu.addButtonItem(this.selectAllPressed, Menu.northWest, 0, 45, 40, 40, "All");
		this.selectAllButton.icon = this.iconManager.icon("select");
		this.selectAllButton.toolTip = "select all cells [" + this.controlKeyText + " A]";
		this.selectAllButton.setFont("16px Arial");

		// auto-shrink toggle
		this.autoShrinkToggle = this.viewMenu.addListItem(this.viewAutoShrinkList, Menu.northWest, 45, 45, 40, 40, ["Auto"], [this.autoShrink], Menu.multi);
		this.autoShrinkToggle.icon = [this.iconManager.icon("autoshrink")];
		this.autoShrinkToggle.toolTip = ["toggle auto shrink selection [" + this.altKeyText + " A]"];
		this.autoShrinkToggle.setFont("16px Arial");

		// add the auto-shrink button
		this.autoShrinkButton = this.viewMenu.addButtonItem(this.shrinkSelectionPressed, Menu.northWest, 90, 45, 40, 40, "");
		this.autoShrinkButton.icon = this.iconManager.icon("shrink");
		this.autoShrinkButton.toolTip = "shrink selection [Shift A]";

		// library button
		this.libraryToggle = this.viewMenu.addListItem(null, Menu.northWest, 135, 45, 40, 40, [""], [false], Menu.multi);
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
		this.cutButton = this.viewMenu.addButtonItem(this.cutPressed, Menu.northWest, 180, 45, 40, 40, "");
		this.cutButton.icon = this.iconManager.icon("cut");
		this.cutButton.toolTip = "cut [" + this.controlKeyText + " X]";

		// add the copy button
		this.copyButton = this.viewMenu.addButtonItem(this.copyPressed, Menu.northWest, 225, 45, 40, 40, "");
		this.copyButton.icon = this.iconManager.icon("copy");
		this.copyButton.toolTip = "copy [" + this.controlKeyText + " C]";

		// add the paste button
		this.pasteButton = this.viewMenu.addButtonItem(this.pastePressed, Menu.northWest, 270, 45, 40, 40, "");
		this.pasteButton.icon = this.iconManager.icon("paste");
		this.pasteButton.toolTip = "paste [" + this.controlKeyText + " V]";

		// add the cancel selection button
		this.cancelSelectionButton = this.viewMenu.addButtonItem(this.cancelSelectionPressed, Menu.southEast, -40, -220, 40, 40, "");
		this.cancelSelectionButton.icon = this.iconManager.icon("cancelsel");
		this.cancelSelectionButton.toolTip = "cancel selection [" + this.controlKeyText + " K]";

		// add the nudge left button
		this.nudgeLeftButton = this.viewMenu.addButtonItem(this.nudgeLeftPressed, Menu.southEast, -265, -175, 40, 40, "");
		this.nudgeLeftButton.icon = this.iconManager.icon("nudgeleft");
		this.nudgeLeftButton.toolTip = "nudge left [" + this.altKeyText + " Left]";

		// add the nudge right button
		this.nudgeRightButton = this.viewMenu.addButtonItem(this.nudgeRightPressed, Menu.southEast, -220, -175, 40, 40, "");
		this.nudgeRightButton.icon = this.iconManager.icon("nudgeright");
		this.nudgeRightButton.toolTip = "nudge right [" + this.altKeyText + " Right]";

		// add the nudge up button
		this.nudgeUpButton = this.viewMenu.addButtonItem(this.nudgeUpPressed, Menu.southEast, -175, -175, 40, 40, "");
		this.nudgeUpButton.icon = this.iconManager.icon("nudgeup");
		this.nudgeUpButton.toolTip = "nudge up [" + this.altKeyText + " Up]";

		// add the nudge down button
		this.nudgeDownButton = this.viewMenu.addButtonItem(this.nudgeDownPressed, Menu.southEast, -130, -175, 40, 40, "");
		this.nudgeDownButton.icon = this.iconManager.icon("nudgedown");
		this.nudgeDownButton.toolTip = "nudge down [" + this.altKeyText + " Down]";

		// add the advance selection button
		this.advanceSelectionButton = this.viewMenu.addButtonItem(this.advanceSelectionPressed, Menu.southEast, -85, -175, 40, 40, "+Sel");
		this.advanceSelectionButton.icon = this.iconManager.icon("advanceselection");
		this.advanceSelectionButton.toolTip = "advance selection [" + this.controlKeyText + " Space]";
		this.advanceSelectionButton.setFont("15px Arial");

		// add the advance outside button
		this.advanceOutsideButton = this.viewMenu.addButtonItem(this.advanceOutsidePressed, Menu.southEast, -40, -175, 40, 40, "+Out");
		this.advanceOutsideButton.icon = this.iconManager.icon("advanceoutside");
		this.advanceOutsideButton.toolTip = "advance outside [Shift Space]";
		this.advanceOutsideButton.setFont("15px Arial");

		// add the flip X button
		this.flipXButton = this.viewMenu.addButtonItem(this.flipXPressed, Menu.southEast, -265, -85, 40, 40, "");
		this.flipXButton.icon = this.iconManager.icon("flipx");
		this.flipXButton.toolTip = "flip horizontally [" + this.altKeyText + " X]";

		// add the flip Y button
		this.flipYButton = this.viewMenu.addButtonItem(this.flipYPressed, Menu.southEast, -220, -85, 40, 40, "");
		this.flipYButton.icon = this.iconManager.icon("flipy");
		this.flipYButton.toolTip = "flip vertically [" + this.altKeyText + " Y]";

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
		this.clearRHistoryButton.toolTip = "clear History cells [" + this.controlKeyText + " Del]";
		this.clearRHistoryButton.setFont("16px Arial");

		// add the change cell state button
		this.changeCellStateButton = this.viewMenu.addButtonItem(this.changeCellStatePressed, Menu.southEast, -40, -130, 40, 40, "");
		this.changeCellStateButton.icon = this.iconManager.icon("changestate");
		this.changeCellStateButton.toolTip = "change cells to drawing state [" + this.altKeyText + " K]";

		// add the invert selection button
		this.invertSelectionButton = this.viewMenu.addButtonItem(this.invertSelectionPressed, Menu.southEast, -85, -130, 40, 40, "");
		this.invertSelectionButton.icon = this.iconManager.icon("invertselection");
		this.invertSelectionButton.toolTip = "invert cells in selection [" + this.controlKeyText + " I]";

		// add the random button
		this.randomButton = this.viewMenu.addButtonItem(this.randomPressed, Menu.southEast, -130, -130, 40, 40, "");
		this.randomButton.icon = this.iconManager.icon("random");
		this.randomButton.toolTip = "random fill [Shift 5]";

		// add the random 2-state button
		this.random2Button = this.viewMenu.addButtonItem(this.random2Pressed, Menu.southEast, -175, -130, 40, 40, "2");
		this.random2Button.icon = this.iconManager.icon("random");
		this.random2Button.toolTip = "random 2-state fill [" + this.controlKeyText + " Shift 5]";

		// add the random density slider
		this.randomItem = this.viewMenu.addRangeItem(this.viewRandomRange, Menu.southEast, -275, -130, 100, 40, 1, 100, this.randomDensity, true, "", "%", 0);
		this.randomItem.toolTip = "random fill density";

		// add the paste position slider
		this.pastePositionItem = this.viewMenu.addRangeItem(this.viewPastePositionRange, Menu.northEast, -265, 45, 100, 40, 0, ViewConstants.numPastePositions - 1, this.pastePosition, true, "", "", -1);
		this.pastePositionItem.toolTip = "paste location [Shift L]";
		this.pastePositionItem.setFont("16px Arial");

		// reverse direction button
		this.directionButton = this.viewMenu.addButtonItem(this.directionPressed, Menu.southEast, -250, -40, 40, 40, "");
		this.directionButton.icon = this.iconManager.icon("uturn");
		this.directionButton.toolTip = "reverse playback direction [U]";

		// add items to the library toggle
		this.libraryToggle.addItemsToToggleMenu([this.clipboardList], []);

		// add items to the main toggle menu
		this.navToggle.addItemsToToggleMenu([this.themeSectionLabel, this.layersItem, this.depthItem, this.angleItem, this.tiltItem, this.backButton, this.themeButton,
			this.patternButton, this.clipboardButton, this.infoButton, this.displayButton, this.playbackButton, this.throttleToggle, this.showLagToggle, this.shrinkButton,
			this.escButton, this.autoHideButton, this.autoGridButton, this.altGridButton, this.integerZoomButton, this.centerPatternButton, this.hexCellButton, this.bordersButton,
			this.labelButton, this.killButton, this.graphButton, this.fpsButton, this.clearDrawingStateButton, this.timingDetailButton, this.infoBarButton, this.starsButton,
			this.resetAllButton, this.stopAllButton, this.stopOthersButton, this.snapToNearest45Button, this.historyFitButton, this.majorButton, this.prevUniverseButton,
			this.nextUniverseButton, this.multiverseButton, this.actionsButton, this.saveViewButton, this.restoreViewButton, this.lastIdentifyResultsButton], []);

		// add statistics items to the toggle
		this.genToggle.addItemsToToggleMenu([this.popLabel, this.popValue, this.birthsLabel, this.birthsValue, this.deathsLabel, this.deathsValue, this.genLabel, this.genValueLabel, this.timeLabel, this.elapsedTimeLabel, this.ruleLabel], []);

		// add help items to the toggle
		this.helpToggle.addItemsToToggleMenu([this.helpSectionList, this.topicsButton, this.sectionsButton], []);
	};

	// attached the viewer to a canvas element
	View.prototype.attachToCanvas = function(/** @type {HTMLCanvasElement} */ canvasItem) {
		var	/** @type {boolean} */ result = false,
			/** @type {View} */ me = this,
			/** @type {number} */ viewerWidth = 0,
			/** @type {number} */ viewerHeight = 0;

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
			this.mainContext = /** @type {!CanvasRenderingContext2D} */ (this.mainCanvas.getContext("2d", {alpha: false, "willReadFrequently": true}));
			this.mainContext.globalAlpha = 1;
			this.mainContext.fillStyle = "black";
			this.mainContext.imageSmoothingEnabled = false;
			this.mainContext.imageSmoothingQuality = "high";
			this.mainContext.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

			// set the font alignment
			this.mainContext.textAlign = "left";
			this.mainContext.textBaseline = "middle";

			// set the width and height from the canvas
			this.displayWidth = this.mainCanvas.width;
			this.displayHeight = this.mainCanvas.height;

			// initialise life engine
			this.engine = new Life(this.mainContext, this.displayWidth, this.displayHeight, this.defaultGridWidth, this.defaultGridHeight, this.manager, this);
			this.engine.initEngine(this.mainContext, this.displayWidth, this.displayHeight);

			// create the elapsed times buffer
			this.elapsedTimes = /** @type {!Float32Array} */ (this.engine.allocator.allocate(Type.Float32, ViewConstants.numElapsedTimes, "View.elapsedTimes"));

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

			// register mouse wheel event
			registerEvent(this.mainCanvas, "wheel", function(/** @type {WheelEvent} */ event) {me.wheel(me, event);}, false);

			// enable notifications
			this.menuManager.notification.enabled = true;

			// load view menu
			this.menuManager.activeMenu(this.viewMenu);

			// register keyboard input
			if (this.isInPopup) {
				registerEvent(Controller.popupWindow.wrappedElement, "keydown", function(/** @type {KeyboardEvent} */ event) {me.keyDown(me, event);}, false);
				Controller.popupWindow.menuManager = this.menuManager;
			} else {
				registerEvent(this.mainCanvas, "keydown", function(/** @type {KeyboardEvent} */ event) {me.keyDown(me, event);}, false);
			}

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
	/** @returns {string} */
	View.prototype.themeName = function(/** @type {number} */ themeNumber) {
		var	/** @type {Array<Theme>} */ themes = this.engine.themes,
			/** @type {string} */ result = "";

		// ensure number is integer
		themeNumber = themeNumber | 0;

		// check if it is in range
		if (themeNumber < themes.length) {
			result = themes[themeNumber].name;
		}

		return result;
	};

	// get a theme number from theme name
	/** @returns {number} */
	View.prototype.themeFromName = function(/** @type {string} */ themeName) {
		var	/** @type {boolean} */ found = false,
			/** @type {Array<Theme>} */ themes = this.engine.themes,
			/** @type {number} */ i = 0;

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
	View.prototype.validateWaypoints = function(/** @type {Array} */ scriptErrors) {
		// fill in waypoint zero
		var	/** @type {Waypoint} */ currentWaypoint = this.waypointManager.firstWaypoint();

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

		// tilt
		if (!currentWaypoint.tiltDefined) {
			currentWaypoint.tilt = this.engine.tilt;
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
		this.waypointManager.prepare(scriptErrors, this);
	};

	// fit message to popup title bar
	/** @returns {string} */
	View.prototype.fitTitle = function(/** @type {string} */ message) {
		var	/** @type {string} */ result = message,

			// rendering context
			/** @type {CanvasRenderingContext2D} */ ctx = this.mainContext,

			// width of title bar
			/** @type {number} */ titleWidth = 500,

			// length of message in characters
			/** @type {number} */ length = message.length,

			// width in pixels
			/** @type {number} */ pxWidth = 0,

			// index
			/** @type {number} */ i = length,

			// font size
			/** @type {number} */ itemFontSize = 18;

		// scale font
		itemFontSize = (itemFontSize * this.viewMenu.yScale) | 0;

		// set the variable font
		ctx.font = itemFontSize + "px " + ViewConstants.variableFontFamily;

		// check if the message fits
		pxWidth = ctx.measureText(message).width;
		if (pxWidth > titleWidth) {
			// shorten the text until it fits
			i -= 1;
			pxWidth = ctx.measureText(message.substring(0, i) + "...").width;
			while (pxWidth > titleWidth) {
				i -= 1;
				pxWidth = ctx.measureText(message.substring(0, i) + "...").width;
			}

			// set the message to the shorter version
			result = result.substring(0, i) + "...";
		}

		// return the message
		return result;
	};

	// read script
	View.prototype.readScript = function(/** @type {string} */ scriptString, /** @type {number} */ numStates) {
		ScriptParser.parseScript(this, scriptString, numStates);
	};

	// reset any view controls that scripts can overwrite
	View.prototype.resetScriptControls = function() {
		// reset show play duration
		this.showPlayDuration = false;

		// clear disable snow
		this.snowDisabled = false;

		// disable icons
		this.useIcons = false;

		// reset rainbow mode
		this.engine.rainbow = false;
		this.defaultRainbow = false;

		// reset start from
		this.startFrom = -1;

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
		this.menuManager.noGUI = false;
		this.noGUIDefined = false;

		// clear hide source mode
		this.noSource = false;

		// clear no pattern source copy
		this.noCopy = false;

		// clear custom random seed
		this.randomSeedCustom = false;

		// clear randomize pattern
		this.randomizePattern = false;
		this.randomize2Only = false;

		// clear origin
		this.engine.originX = 0;
		this.engine.originY = 0;
		this.engine.originZ = 1;

		// clear autoidentify
		this.autoIdentify = false;

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
		this.customHelpColour = null;
		this.helpFontColour = ViewConstants.helpFontColour;

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
			if (256 - this.engine.multiNumStates > 63) {
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
	View.prototype.gotFocus = function(/** @type {View} */ me) {
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
					me.copyRLE(me);
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

		// set text alignment
		this.mainContext.textBaseline = "middle";

		// resize arrays
		this.engine.resizeDisplay(this.displayWidth, this.displayHeight);

		// resize the cell period map if available
		if (!(this.lastIdentifyType === "Empty" || this.lastIdentifyType === "none" || this.lastIdentifyType === "") && (this.engine.popSubPeriod !== null)) {
			this.engine.createCellPeriodMap(this.identifyBannerLabel, this);
		}

		// if AutoFit is enabled then fit zoom
		if (this.autoFit) {
			this.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
		}
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
		var	/** @type {number} */ states = this.engine.multiNumStates,
			/** @type {number} */ i = 0,
			/** @type {number} */ state = 0,
			/** @type {string} */ message = "";

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
				message += " [" + this.controlKeyText + " " + state + "]";
			}
			this.stateList.toolTip[i] = message;
			this.stateColsList.lower[i] = "";
			this.stateColsList.toolTip[i] = message;
			this.stateColsList.current[i] = false;
		}

		// update the selected state
		state = this.drawState;
		if (state > 0) {
			if (!(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper|| this.engine.isExtended)) {
				state = this.engine.multiNumStates - state;
			}
		}
		this.stateList.current = state - this.startState;
	};

	// setup state list for drawing
	View.prototype.setupStateList = function() {
		var	/** @type {number} */ states = this.engine.multiNumStates,
			/** @type {number} */ xScale = this.viewMenu.xScale;

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
			this.stateList.toolTip = ["dead [" + this.controlKeyText + " 0]", "alive [" + this.controlKeyText + " 1]", "history [" + this.controlKeyText + " 2]", "mark 1 [" + this.controlKeyText + " 3]", "mark off [" + this.controlKeyText + " 4]", "mark 2 [" + this.controlKeyText + " 5]", "kill [" + this.controlKeyText + " 6]"];
			this.stateList.current = this.drawState;

			// add LifeHistory state colours for editor
			this.stateColsList.lower = ["", "", "", "", "", "", ""];
			this.stateColsList.setWidth(280);
			this.stateColsList.toolTip = ["dead [" + this.controlKeyText + " 0]", "alive [" + this.controlKeyText + " 1]", "history [" + this.controlKeyText + " 2]", "mark 1 [" + this.controlKeyText + " 3]", "mark off [" + this.controlKeyText + " 4]", "mark 2 [" + this.controlKeyText + " 5]", "kill [" + this.controlKeyText + " 6]"];
			this.stateColsList.bgAlpha = 1;
			this.stateColsList.current = [false, false, false, false, false, false, false];
		} else {
			// check for 2 state
			if (states <= 2) {
				// add states for editor
				this.stateList.lower = ["0", "1"];
				this.stateList.setWidth(80);
				this.stateList.toolTip = ["dead [" + this.controlKeyText + " 0]", "alive [" + this.controlKeyText + " 1]"];
				this.stateList.current = this.drawState;

				// add state colours for editor
				this.stateColsList.lower = ["", ""];
				this.stateColsList.setWidth(80);
				this.stateColsList.toolTip = ["dead [" + this.controlKeyText + " 0]", "alive [" + this.controlKeyText + " 1]"];
				this.stateColsList.bgAlpha = 1;
				this.stateColsList.current = [false, false];
			} else {
				if (this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper|| this.engine.isExtended) {
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
	View.prototype.setColourTheme = function(/** @type {number} */ themeRequested) {
		var	/** @type {number} */ customIndex = this.engine.numThemes;

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
					if (this.engine.multiNumStates > 2 && !(this.engine.isSuper|| this.engine.isExtended || this.engine.isPCA || this.engine.isRuleTree)) {
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

		// set the theme
		this.setNewTheme(themeRequested, 1, this);
	};

	// scale popup window
	View.prototype.scalePopup = function() {
		var	/** @type {number} */ scale = 1,
			/** @type {number} */ windowWidth = window.innerWidth,
			/** @type {number} */ windowHeight = window.innerHeight,
			/** @type {number} */ displayWidth = this.displayWidth,
			/** @type {number} */ displayHeight = this.displayHeight + 80;

		// update the device pixel ratio
		this.devicePixelRatio = (window.devicePixelRatio ? window.devicePixelRatio : 1);

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
		this.clearHelpCache();

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
		this.engine.isExtended = false;
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
	View.prototype.startViewer = function(/** @type {string} */ patternString, /** @type {boolean} */ ignoreThumbnail) {
		var	/** @type {number} */ savedW = 0,
			/** @type {number} */ savedH = 0,
			/** @type {Pattern} */ pattern = null,
			/** @type {Pattern} */ temp = null;

		// read settings
		this.yUp = this.loadBooleanSetting(ViewConstants.ySettingName);

		// reset playback speed
		this.genSpeed = 60;
		this.gensPerStep = 1;
		this.speedRange.current = this.viewSpeedRange([1, 1], true, this);

		// hide labels
		this.xyLabel.deleted = true;
		this.selSizeLabel.deleted = true;

		// clear rule table B0 flag
		this.manager.ruleTableB0 = false;
		this.engine.ruleTableB0 = false;

		// clear just died flag
		this.justDied = false;

		// reset HROT range
		this.engine.HROT.yrange = 1;

		// attempt to load the pattern
		this.origDisplayWidth = this.displayWidth;
		this.origDisplayHeight = this.displayHeight;
		pattern = this.manager.create("", patternString, this.engine.allocator, this.completeStart, this.completeStartFailed, [ignoreThumbnail], this);
		this.lastFailReason = this.manager.failureReason;

		// if the pattern loaded synchronously (i.e. did not need a rule definition from the repository) then complete the setup
		// (otherwise it will happen once the async load is complete)
		if (!this.manager.loadingFromRepository) {
			this.completeStart(pattern, [ignoreThumbnail], this);
		} else {
			// create a dummy pattern so view processing completes otherwise window isn't correctly setup
			savedW = this.manager.specifiedWidth;
			savedH = this.manager.specifiedHeight;

			temp = this.manager.create("", "x=1,y=1,rule=Life\n!", this.engine.allocator, this.completeStart, this.completeStart, [ignoreThumbnail], this);
			this.completeStart(temp, [ignoreThumbnail], this);

			this.manager.specifiedWidth = savedW;
			this.manager.specifiedHeight = savedH;

			// restore original width and height so when pattern loads with new rule we don't scale the window again
			this.displayWidth = this.origDisplayWidth;
			this.displayHeight = this.origDisplayHeight;

			// notify rule is loading
			this.menuManager.notification.clear(false, true);
			this.menuManager.notification.notify("Loading rule...", 15, 10000, 15, true);
		}
	};

	// complete pattern start process after lookup failure
	View.prototype.completeStartFailed = function(/** @type {Pattern} */ pattern, /** @type {Array} */ args, /** @type {View} */ me) {
		// add the pattern comments to the args
		args[args.length] = pattern.title;
		args[args.length] = pattern.numStates;
		me.manager.failureReason = me.lastFailReason;
		me.manager.executable = true;
		me.completeStart(null, args, me);
	};

	// check for Chrome bug
	View.prototype.checkForChromeBug = function() {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ chromeVersion = 0,
			uad = null,
			/** @type {boolean} */ found = false,
			/** @type {string} */ confirmed = "n";

		// check for Chrome
		// @ts-ignore
		if (navigator.userAgentData) {
			// @ts-ignore
			uad = navigator.userAgentData;
			if (uad.platform === "Windows") {
				if (uad.brands) {
					for (i = 0; i < uad.brands.length; i += 1) {
						if (uad.brands[i].brand === "Google Chrome" || uad.brands[i].brand === "Brave Browser") {
							found = true;
							chromeVersion = Number(uad.brands[i].version);
						}
					}
				}
			}
		}

		if (found) {
			if (chromeVersion >= 103 && chromeVersion < 107) {
				// check for user confirmation
				confirmed = localStorage.getItem(ViewConstants.doneKey);
				if (confirmed !== "y") {
					this.menuManager.notification.notify("If there are no cells displayed click on Help", 15, 300, 15, false);
					this.chromeBug = true;
				} else {
					this.chromeBug = false;
				}
			}
		}
	};

	// complete pattern start process
	View.prototype.completeStart = function(/** @type {Pattern} */ pattern, /** @type {Array} */ args, /** @type {View} */ me) {
		var	/** @type {number} */ numberValue = 0,
			/** @type {number} */ savedX = 0,
			/** @type {number} */ savedY = 0,
			/** @type {boolean} */ savedThumbnail = false,
			/** @type {boolean} */ resizeRequired = false,
			/** @type {number} */ neededWidth = 0,
			/** @type {number} */ neededHeight = 0,
			/** @type {number} */ borderSize = 0,
			/** @type {number} */ i = 0,
			/** @type {boolean} */ ignoreThumbnail = args[0],
			/** @type {number} */ stateCount = 0,
			/** @type {number} */ numStatesForRule = 0,
			/** @type {string} */ name = "",
			/** @type {boolean} */ growX = false,
			/** @type {boolean} */ growY = false,
			/** @type {boolean} */ gridGrew = false,
			/** @type {number} */ xOffset = 0,
			/** @type {number} */ yOffset = 0,
			/** @type {number} */ idBottom = 0,
			/** @type {number} */ idLeft = 0,
			/** @type {number} */ idCurrent = 0,
			/** @type {string} */ comments = "";

		// zero population
		me.engine.population = 0;

		// reset starfield colour
		if (me.starField) {
			me.starField.starColour = new Colour(255, 255, 255);
		}

		// disable HROT non-deterministic mode
		me.engine.HROT.useRandom = false;

		// reset graph data elements
		me.graphDataToggle.current = me.viewGraphList([true, true, true], true, me);

		// turn off pretty rendering
		me.engine.pretty = false;

		// set died generation
		me.diedGeneration = -1;

		// mark bailout possible
		me.throttleToggle.current = me.toggleThrottle([true], true, me);

		// hide theme selection buttons
		me.showThemeSelection = false;

		// hide info settings
		me.showInfoSettings = false;

		// hide display settings
		me.showDisplaySettings = false;

		// hide actions settings
		me.showActionsSettings = false;

		// hide playback settings
		me.showPlaybackSettings = false;

		// hide pattern settings
		me.showPatternSettings = false;

		// hide clipboard settings
		me.showClipboardSettings = false;

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
		for (i = 0; i < ViewConstants.numPasteBuffers; i += 1) {
			me.pasteBuffers[i] = null;
		}

		// clear internal paste
		me.pasteBuffers[ViewConstants.numPasteBuffers] = null;

		me.currentPasteBuffer = 0;
		me.canPaste = false;
		me.pasteBuffer = null;
		me.isPasting = false;
		me.pasteWidth = 0;
		me.pasteHeight = 0;
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
		me.maxPasteGen = -1;
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

		// clear icons
		me.engine.ruleTableIcons = null;

		// check for illegal states in RuleTable
		if (pattern && (pattern.ruleTableOutput !== null || pattern.ruleTreeStates !== -1)) {
			if (pattern.ruleTableOutput == null) {
				if (pattern.maxStateRead >= pattern.ruleTreeStates) {
					me.manager.failureReason = "Illegal state in pattern for @TREE";
					pattern = null;
				}
			} else {
				if (pattern.maxStateRead >= pattern.ruleTableStates) {
					me.manager.failureReason = "Illegal state in pattern for @TABLE";
					pattern = null;
				}
			}
		}

		// check for failed RuleTable
		if (pattern && (me.manager.ruleTableB0 && pattern && (pattern.gridType === -1 || (pattern.gridType !== -1 && (pattern.gridWidth === 0 || pattern.gridHeight === 0))))) {
			if (pattern.ruleTableOutput === null) {
				me.manager.failureReason = "@TREE B0 only valid with finite grid";
			} else {
				me.manager.failureReason = "@TABLE B0 only valid with finite grid";
			}
			pattern = null;
		}

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

			// if the size is not specified then set it to the actual size
			if (me.specifiedWidth === -999999) {
				me.specifiedWidth = me.patternWidth;
			}

			if (me.specifiedHeight === -999999) {
				me.specifiedHeight = me.patternHeight;
			}

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

			// check if the rule is an Extended rule
			me.engine.isExtended = pattern.isExtended;

			// set toggle button caption
			// TBD isExtended
			me.clearRHistoryButton.toolTip = "clear History cells [" + this.controlKeyText + " Del]";
			if (me.engine.isSuper) {
				me.clearRHistoryButton.toolTip = "clear Super cells [" + this.controlKeyText + " Del]";
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
			me.engine.isRuleTree = false;
			me.engine.ruleTableB0 = false;

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
				me.engine.ruleTableB0 = me.manager.ruleTableB0;
				me.engine.isRuleTree = true;
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
				me.engine.ruleTableB0 = me.manager.ruleTableB0;
				me.engine.isRuleTree = true;
			}

			// check if the rule is HROT
			me.engine.isHROT = pattern.isHROT;
			if (pattern.isHROT) {
				me.engine.HROT.births = pattern.birthHROT;
				me.engine.HROT.survivals = pattern.survivalHROT;
				me.engine.HROT.scount = pattern.multiNumStates;
				me.engine.HROT.useRandom = pattern.probabilisticHROT;
				me.engine.HROT.useRandomBirths = pattern.probabilisticBirths;
				me.engine.HROT.useRandomSurvivals = pattern.probabilisticSurvivals;
				me.engine.HROT.useRandomImmunities = pattern.probabilisticImmunities;
				me.engine.HROT.setTypeAndRange(pattern.neighborhoodHROT, pattern.rangeHROT, pattern.customNeighbourhood, pattern.customNeighbourCount, pattern.isTriangular, pattern.weightedNeighbourhood, pattern.weightedStates, pattern.cornerRange, pattern.edgeRange);
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

			// decode icons (this must happen after the neighbourhood is read above since icons are not available on hex and triangular grids)
			if (pattern.isPCA) {
				me.engine.createPCAIcons(pattern);
				me.engine.ruleTableIcons = pattern.ruleTableIcons;
			} else {
				// process icons if loaded
				if (pattern.ruleTableIcons) {
					me.engine.processIcons(pattern.ruleTableIcons);
				} else {
					// no icons available
					me.engine.iconsAvailable = false;
				}
			}

			// read the bounded grid details
			me.engine.boundedGridType = pattern.gridType;
			me.engine.boundedGridWidth = pattern.gridWidth;
			me.engine.boundedGridHeight = pattern.gridHeight;
			me.engine.boundedGridHorizontalShift = pattern.gridHorizontalShift;
			me.engine.boundedGridVerticalShift = pattern.gridVerticalShift;
			me.engine.boundedGridHorizontalTwist = pattern.gridHorizontalTwist;
			me.engine.boundedGridVerticalTwist = pattern.gridVerticalTwist;
			me.engine.boundedGridSphereAxisTopLeft = pattern.gridSphereAxisTopLeft;

			// copy states used and state count
			numberValue = me.engine.multiNumStates === -1 ? 2 : me.engine.multiNumStates;
			if (me.engine.isLifeHistory) {
				numberValue = 7;
			}
			me.patternStateCount = new Uint32Array(numberValue);

			for (i = 0; i < numberValue; i += 1) {
				me.patternStateCount[i] = me.manager.stateCount[i];
			}
		} else {
			me.clearPatternData();
		}

		// enable Fast Lookup if available for the loaded rule
		if (me.engine.ruleLoaderLookupAvailable()) {
			me.engine.ruleLoaderLookupEnabled = true;
		} else {
			me.engine.ruleLoaderLookupEnabled = false;
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

		// set the default tilt
		me.engine.tilt = 0;

		// set the default zoom
		me.engine.zoom = 6;

		// reset the grid size
		me.engine.resetGridSize(me.defaultGridWidth, me.defaultGridHeight);

		// clear the grid
		me.engine.clearGrids(false);

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
		me.customThemeValue.fill(-1);
		me.customLabelColour = ViewConstants.labelFontColour;
		me.customArrowColour = ViewConstants.arrowColour;
		me.customPolygonColour = ViewConstants.polyColour;

		// switch off thumbnail mode if on
		if (me.thumbnail) {
			if (me.randomizeGuard) {
				// random pattern being created so restore original size (thumbnail will be created later)
				me.displayHeight = me.thumbOrigWidth;
				me.displayWidth = me.thumbOrigWidth;
				me.engine.zoom = this.thumbOrigZoom;
				me.displayHelp = this.thumbOrigHelpPosition;
			} else {
				me.switchOffThumbnail();
			}
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
		me.speedRange.deleted = false;
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
		me.directionButton.deleted = false;
		me.speed1Button.deleted = false;

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
		me.helpToggle.current = me.toggleHelp([me.displayHelp !== 0], true, me);

		// reset boundary colour
		me.customBoundaryColour = [96, 96, 96];
		if (me.engine.littleEndian) {
			me.engine.boundaryColour = 0xff606060;
		} else {
			me.engine.boundaryColour = 0x606060ff;
		}
		me.engine.boundaryColourString = "rgb(" + me.customBoundaryColour[0] + "," + me.customBoundaryColour[1] + "," + me.customBoundaryColour[2] + ")";

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

		// reset selected cells colour
		me.customSelectedCellsColour = [255, 128, 0];
		me.engine.selectedCellsColour = "rgb(255,128,0)";

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

		// set standard step and GPS used
		me.standardStep = true;
		me.standardGPS = true;

		// clear last waypoint message
		me.lastWaypointMessage = "";

		// get the comments from the pattern
		if (pattern) {
			if (pattern.title) {
				comments = pattern.title;
			}
		} else {
			if (args.length > 1) {
				comments = args[1];
			}
			me.setMenuColours();
		}

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
			me.displayWidth = (document.body.clientWidth & ~7) - 8;
			me.displayHeight = window.innerHeight - 130;
			if (me.displayWidth < ViewConstants.minViewerWidth) {
				me.displayWidth = ViewConstants.minViewerWidth;
			}
			if (me.displayHeight < ViewConstants.minViewerHeight) {
				me.displayHeight = ViewConstants.minViewerHeight;
			}
			resizeRequired = true;
		}

		// read any script in the title
		if (comments !== "") {
			// decode any script commands
			if (pattern) {
				if (pattern.multiNumStates === -1) {
					numberValue = pattern.numStates;
				} else {
					numberValue = pattern.multiNumStates;
				}
			} else {
				numberValue = args[2];
			}

			if (me.engine.isLifeHistory) {
				numberValue = 7;
			}

			if (me.engine.isPCA) {
				numberValue = 16;
			}

			if (me.engine.isSuper) {
				numberValue = 26;
			}

			if (me.engine.isExtended) {
				numberValue = 21;
			}

			me.readScript(comments, numberValue);

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
			if (me.engine.multiNumStates > 2 || me.engine.isHROT || me.engine.isPCA || me.engine.isLifeHistory || me.engine.isSuper || me.engine.isExtended || me.engine.isRuleTree) {
				me.engine.rainbow = false;
			}
		}

		// remove history states if pattern is not executable or rule does not support them
		if (!me.executable || me.engine.isRuleTree || me.engine.isSuper|| me.engine.isExtended) {
			me.historyStates = 0;
		}

		// initialise random number generators from seed
		me.randGen.init(me.randomSeed);
		if (me.engine.isHROT) {
			me.engine.HROT.setRandomSeed(me.randomSeed);
		}

		// check if popup width has changed
		if (me.isInPopup) {
			me.origDisplayWidth = me.displayWidth;
			me.origDisplayHeight = me.displayHeight;
			me.scalePopup();
		}

		// if pattern is too big and has no paste commands then generate error
		if (pattern && pattern.tooBig && me.pasteList.length === 0) {
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
		borderSize = me.getSafeBorderSize();

		if (pattern && ((pattern.width > (me.engine.maxGridSize - borderSize - (Math.abs(me.xOffset + me.posXOffset) * 2)) || (pattern.height > (me.engine.maxGridSize - borderSize - Math.abs(me.xOffset - me.posXOffset) * 2))))) {
			// check if pattern would fit in the middle
			if (!((pattern.width > me.engine.maxGridSize - borderSize) || (pattern.height > me.engine.maxGridSize - borderSize))) {
				me.failureReason = "Pattern too big at specified location";
			} else {
				me.failureReason = "Pattern too big";
			}
			pattern.tooBig = true;
			me.executable = false;
		}

		// check bounded grid size (script command may have increased maximum allowed size)
		if (pattern && (pattern.gridType !== -1)) {
			borderSize = me.getSafeBorderSize();

			if (pattern.gridWidth > me.engine.maxGridSize - borderSize || pattern.gridHeight > me.engine.maxGridSize - borderSize) {
				// make invalid
				me.failureReason = "Bounded grid too big";
				me.executable = false;
				me.engine.boundedGridType = -1;
			}
		}

		// disable Fast Lookup if pattern invalid
		if (!me.executable) {
			me.engine.ruleLoaderLookupEnabled = false;
			me.engine.ruleLoaderStep = -1;
		}

		// update the life rule
		me.engine.updateLifeRule(me);

		// create RuleLoader lookup if available and pattern is valid
		if (me.engine.ruleLoaderLookupAvailable() && me.engine.ruleLoaderLookupEnabled) {
			me.createRuleLoaderLookup();
		}

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
		if (pattern) {
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
		}

		// check if the grid is smaller than the pattern and/or bounded grid plus the border
		borderSize = me.getSafeBorderSize();

		// add CXRLE Pos if defined
		if (me.posDefined) {
			me.xOffset += me.posXOffset;
			me.yOffset += me.posYOffset;
		}

		// grow the grid if the pattern is too big to fit
		growX = (me.engine.width < me.engine.maxGridSize) && ((neededWidth + borderSize + Math.abs(me.xOffset) * 2) >= me.engine.width);
		growY = (me.engine.height < me.engine.maxGridSize) && ((neededHeight + borderSize + Math.abs(me.yOffset) * 2) >= me.engine.height);

		while (growX || growY) {
			// mark that grid needs to grow
			gridGrew = true;

			// clear offsets
			xOffset = 0;
			yOffset = 0;

			// update the default x and y
			if (growX) {
				xOffset = me.engine.width >> 1;
				me.engine.width *= 2;
				me.defaultX += me.engine.width >> 2;
			}
			if (growY) {
				yOffset = me.engine.height >> 1;
				me.engine.height *= 2;
				me.defaultY += me.engine.height >> 2;
			}

			// update the saved x and y
			if (growX) {
				me.savedX += me.engine.width >> 2;
			}
			if (growY) {
				me.savedY += me.engine.height >> 2;
			}

			// check for hex mode
			if (me.engine.isHex) {
				if (growY) {
					me.defaultX -= me.engine.height >> 3;
					me.savedX -= me.engine.height >> 3;
				}
			}

			// adjust camera
			me.engine.xOff += xOffset;
			me.engine.yOff += yOffset;
			if (me.engine.isHex) {
				me.engine.xOff -= (yOffset / 2 | 0);
			}

			// update bounding boxes
			me.engine.zoomBox.leftX += xOffset;
			me.engine.zoomBox.rightX += xOffset;
			me.engine.zoomBox.topY += yOffset;
			me.engine.zoomBox.bottomY += yOffset;

			me.engine.HROTBox.leftX += xOffset;
			me.engine.HROTBox.rightX += xOffset;
			me.engine.HROTBox.topY += yOffset;
			me.engine.HROTBox.bottomY += yOffset;

			me.engine.initialBox.leftX += xOffset;
			me.engine.initialBox.rightX += xOffset;
			me.engine.initialBox.topY += yOffset;
			me.engine.initialBox.bottomY += yOffset;

			me.engine.historyBox.leftX += xOffset;
			me.engine.historyBox.rightX += xOffset;
			me.engine.historyBox.topY += yOffset;
			me.engine.historyBox.bottomY += yOffset;

			// update identify positions
			if (me.engine.oscLength > 0) {
				for (i = 0; i < me.engine.oscLength; i += 1) {
					idCurrent = me.engine.boxList[(i << 1) + 1];
					idLeft = (idCurrent >> 16) + xOffset;
					idBottom = (idCurrent & 65535) + yOffset;
					me.engine.boxList[(i << 1) + 1] = (idLeft << 16) | idBottom;
				}
			}

			// see if the grid needs to grow further
			growX = (me.engine.width < me.engine.maxGridSize) && ((neededWidth + borderSize + Math.abs(me.xOffset) * 2) >= me.engine.width);
			growY = (me.engine.height < me.engine.maxGridSize) && ((neededHeight + borderSize + Math.abs(me.yOffset) * 2) >= me.engine.height);
		}

		if (gridGrew) {
			// allocate the grid without copying contents since it is empty
			me.engine.growGrid(false, false, false);
		}

		// resize the HROT buffer to the current width and height
		if (pattern && pattern.isHROT) {
			me.engine.HROT.resize(me.engine.width, me.engine.height);
		}

		// compute pan X and Y for the pattern on the grid
		if (pattern) {
			me.computePanXY(me.patternWidth, me.patternHeight, me.specifiedWidth, me.specifiedHeight);
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
		if (pattern && !pattern.tooBig) {
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

		// add the neighbourhood
		me.ruleLabel.toolTip += "\n" + me.getNeighbourhoodName();

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
		me.lastIdentifyStrict = "none";
		me.lastIdentifyMod = "none";
		me.identify = false;
		me.identifyButton.current = [me.identify];
		me.engine.initSearch(me.identify);

		// update performance warning
		me.showLagToggle.current = me.toggleShowLag([me.perfWarning], true, me);

		// copy custom background colour if specified to custom colour 0 if not specified
		if (me.engine.isRuleTree || me.engine.isNone) {
			if (me.customThemeValue[ViewConstants.customThemeBackground] !== -1) {
				if (me.customColours === null) {
					me.customColours = /** @type {!Int32Array} */ (me.engine.allocator.allocate(Type.Int32, 256, "View.customColours"));
					me.customColours.fill(-1);
					me.customColours[0] = me.customThemeValue[ViewConstants.customThemeBackground];
					me.customThemeValue[ViewConstants.customThemeBackground] = -1;
					me.customThemeValue[ViewConstants.customThemeAlive] = -1;
				} else {
					if (me.customColours[0] === -1) {
						me.customColours[0] = me.customThemeValue[ViewConstants.customThemeBackground];
					}
				}
			}
		}

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

		// set the cell borders control
		me.bordersButton.current = [me.engine.cellBorders];

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
		me.fixedPointCounter = 0;

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
					for (i = 0; i < me.customColours.length; i += 1) {
						me.colourList[i] = me.customColours[i];
					}
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

			// check if pattern is an [R]History pattern
			if (me.engine.isLifeHistory) {
				// check if there are state 2 cells
				if (me.manager.stateCount[2]) {
					// copy state 2 to the colour grid
					me.engine.copyState2(pattern, me.panX, me.panY);
				}
			}

			// reset population
			me.engine.resetPopulationBox(me.engine.grid16, me.engine.colourGrid);

			// count non-zero states (excluding dead cells)
			stateCount = 0;
			numStatesForRule = me.engine.multiNumStates;
			if (me.engine.isLifeHistory) {
				numStatesForRule = 7;
			} else {
				if (numStatesForRule === -1) {
					numStatesForRule = 2;
				}
			}

			for (i = 1; i < numStatesForRule; i += 1) {
				stateCount += me.patternStateCount[i];
			}

			// display message if pattern is too big or has no alive cells
			if (pattern && me.engine.population === 0 && !me.isPasteEvery) {
				if (stateCount === 0) {
					if (!me.engine.isNone) {
						if (pattern.tooBig) {
							me.menuManager.notification.notify("Pattern too big!", 15, ViewConstants.errorDuration, 15, false);
						} else {
							if (me.failureReason === "") {
								me.menuManager.notification.notify("New pattern", 15, 300, 15, false);
							}
						}
					}
				}
			}

			if (me.failureReason !== "") {
				me.menuManager.notification.notify("Invalid pattern!", 15, 300, 15, false);
			}

			// set the bounded grid tiles if specified
			if (me.engine.boundedGridType !== -1) {
				me.engine.setBoundedTiles();
			}

			// save state for reset
			me.engine.saveGrid(me.noHistory, me);
			me.engine.restoreSavedGrid(me, me.noHistory);
		}

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
			me.hexCellButton.toolTip = ["toggle triangular cells [?]"];
		} else {
			me.hexCellButton.toolTip = ["toggle hexagonal cells [?]"];
			if (me.engine.isHex) {
				me.hexCellButton.current = [me.engine.forceRectangles];
			} else {
				me.hexCellButton.current = [true];
			}
		}

		// set reverse direction button if reversible Margolus or PCA rule loaded
		if ((me.engine.isMargolus || me.engine.isPCA) && me.engine.margolusReverseLookup1 !== null) {
			me.directionButton.locked = false;
		} else {
			me.directionButton.locked = true;
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

		// set the Fast Lookup UI control
		if (!me.engine.isRuleTree) {
			me.engine.ruleLoaderLookupEnabled = false;
		}
		me.fastLookupButton.current = [me.engine.ruleLoaderLookupEnabled];

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
		} else {
			me.prevPOIButton.deleted = true;
			me.nextPOIButton.deleted = true;
		}

		// set the major gridlines UI control
		if (me.engine.isHex || me.engine.isTriangular) {
			me.engine.gridLineMajorEnabled = false;

		}
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

		// set the default tilt
		me.defaultTilt = me.engine.tilt;
		me.tiltItem.current = [me.convertFromTilt(me.defaultTilt), me.defaultTilt];

		// set the default theme
		me.defaultTheme = me.engine.colourTheme;
		me.setNewTheme(me.defaultTheme, me.engine.colourChangeSteps, me);

		// set the generation speed and step
		me.defaultGPS = me.genSpeed;
		me.defaultStep = me.gensPerStep;
		if (me.gensPerStep === 1 && me.genSpeed === 60) {
			me.speedRange.current = me.viewSpeedRange([1, 1], true, me);
		} else {
			me.speedRange.current = me.viewSpeedRange([me.speedIndex(), 1], true, me);
		}

		// set the layers
		me.defaultLayers = me.engine.layers;
		me.layersItem.current = [me.defaultLayers, me.defaultLayers];

		// set the layer depth
		me.defaultDepth = me.engine.layerDepth;
		numberValue = Math.sqrt(me.defaultDepth);
		me.depthItem.current = me.viewDepthRange([numberValue, numberValue], true, me);

		// check whether autostart required
		if (me.autoStart && !me.autoStartDisabled) {
			me.generationOn = true;
			me.playList.current = ViewConstants.modePlay;
		} else {
			me.generationOn = false;
			me.playList.current = ViewConstants.modePause;
		}

		// check whether autoidentify required
		if (me.autoIdentify) {
			me.identifyPressed(me);
		}

		// set the pause button
		me.setPauseIcon(me.generationOn);

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
			me.engine.isExtended = false;
			me.updateTopicButtonsPosition();
		}

		// check whether to disable drawing and selection
		if (me.viewOnly || me.engine.isNone) {
			me.modeList.itemLocked[ViewConstants.modeDraw] = true;
			me.modeList.itemLocked[ViewConstants.modeSelect] = true;
		}

		// disable playback if view only
		if (me.viewOnly) {
			// delete the playback controls
			me.playList.deleted = true;

			// delete the progress bar
			me.progressBar.deleted = true;

			// delete speed range
			me.speedRange.deleted = true;

			// delete the undo and redo buttons
			me.undoButton.deleted = true;
			me.redoButton.deleted = true;

			// delete the reverse button
			me.directionButton.deleted = true;

			// delete the speed 1x button
			me.speed1Button.deleted = true;

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
				me.reasonLabel.preText = " " + Keywords.viewOnlyWord;
				me.reasonLabel.fgCol = me.menuManager.fgCol;
				me.reasonLabel.setPosition(Menu.southWest, me.genToggle.relWidth, -40);
				if (me.thumbnail) {
					me.reasonLabel.setWidth(me.thumbOrigWidth - (40 + me.genToggle.relWidth));
				} else {
					me.reasonLabel.setWidth(me.displayWidth - (40 + me.genToggle.relWidth));
				}
				me.genToggle.deleted = false;
			} else {
				me.reasonLabel.preText = me.failureReason;
				me.reasonLabel.fgCol = me.errorsFontColour;
				me.reasonLabel.setPosition(Menu.southWest, 0, -40);
				if (me.thumbnail) {
					me.reasonLabel.setWidth(me.thumbOrigWidth - 40);
				} else {
					me.reasonLabel.setWidth(me.displayWidth - 40);
				}
				me.genToggle.deleted = true;
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
					me.titleElement.nodeValue = ViewConstants.externalViewerTitle;
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
			if (!Controller.overview) {
				me.menuManager.notification.notify(name, 15, 120, 15, true);
			}
			me.prevUniverseButton.deleted = false;
			me.nextUniverseButton.deleted = false;
			me.multiverseButton.deleted = false;
		} else {
			me.prevUniverseButton.deleted = true;
			me.nextUniverseButton.deleted = true;
			me.multiverseButton.deleted = true;
		}

		// save initial undo state
		me.afterEdit("");

		// check if complete update needed
		if (me.needsComplete) {
			completeUpdate(me);
		}

		// check if snow needed
		if (!me.snowDisabled && (me.engine.zoom === 8 || me.engine.zoom === 0.125) && me.numScriptCommands > 0 && (me.numScriptCommands & 3) === 0 && (me.rleList.length & 5) === 1) {
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
			if (me.randomizeGuard) {
				me.randomizeGuard = false;
			} else {
				me.randomizeGuard = true;
				me.randomPattern(me, true);
				me.randomizeGuard = false;
			}
		}

		// notify if start from is defined
		if (me.startFrom !== -1) {
			if (me.genNotifications) {
				if (me.engine.population === 0) {
					me.menuManager.notification.notify("No live cells", 15, 360, 15, false);
					me.startFrom = -1;
				} else {
					me.menuManager.notification.notify("Going to generation " + me.startFrom, 15, 10000, 15, false);
				}
			}
			me.menuManager.notification.clear(true, false);
		}

		// turn theme on if pattern error
		if (!pattern) {
			var savedNone = me.engine.isNone;
			me.engine.isNone = false;
			me.engine.colourChange = 1;
			me.engine.createColours();
			me.engine.isNone = savedNone;
		}

		// clear cell period display toggle
		me.identifyStrictToggle.current = me.toggleCellPeriodMap(0, true, me);

		// disable population graph if rule is 'none'
		if (me.engine.isNone) {
			me.graphDisabled = true;
			me.popGraph = false;
		}

		// set the graph UI control
		me.graphButton.locked = me.graphDisabled;
		me.graphButton.current = [me.popGraph];

		// set the y direction UI control
		me.yDirectionButton.current = [me.yUp];

		// set the icons control
		me.iconToggle.current = me.viewIconList([me.useIcons], true, me);

		// check for chrome bug
		me.checkForChromeBug();
	};

	// start a viewer
	function startView(/** @type {string} */ patternString, /** @type {HTMLCanvasElement} */ canvasItem, /** @type {number} */ maxWidth, /** @type {boolean} */ isInPopup, element) {
		var	/** @type {number} */ i = 0,

			// get the parent of the canvas
			/** @type {HTMLDivElement} */ parentItem = /** @type {!HTMLDivElement} */ (canvasItem.parentNode),

			// view
			/** @type {View} */ newView = null;

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

			// wrap it in a popup window if hidden
			if (parentItem.style.display === "none") {
				Controller.popupWindow = new PopupWindow(parentItem, newView);
			}

			// attach it to the canvas
			newView.attachToCanvas(canvasItem);

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
		var	a = document.getElementsByTagName('meta'),
			/** @type {number} */ b = 0,
			/** @type {number} */ i = 0,
			/** @type {HTMLMetaElement} */ metaItem = null,
			/** @type {string} */ content = "",
			/** @type {Array<string>} */ tokens = null,
			/** @type {string} */ value = "";

		// check if a LifeViewer tag exists
		for (b = 0; b < a.length; b += 1) {
			metaItem = /** @type {!HTMLMetaElement} */ (a[b]);

			// check if it is a LifeViewer meta tag
			if (metaItem.name === DocConfig.tagName) {
				// set the defaults
				DocConfig.hide = false;
				DocConfig.limitWidth = false;

				// read the content
				content = metaItem.content;

				// split into tokens
				tokens = content.match(/\S+/g);
				if (tokens && tokens.length >= 2 && tokens.length <= 7) {
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
								if (tokens[i][0] === "." || tokens[i][0] === "?") {
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
		var	parentItem = element.parentNode,
			/** @type {boolean} */ found = false;

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
		var	/** @type {Array} */ externalViewer = Controller.standaloneViewer(),

			// get the parent node of the Canvas
			/** @type {Element} */ parentItem = externalViewer[0].parentNode,

			// get the associated View
			/** @type {View} */ view = externalViewer[1],

			// get the popup window
			/** @type {PopupWindow } */ popup = externalViewer[2];

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
	function hideCallback(/** @type {PointerEvent} */ event) {
		hideViewer();

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();

		return false;
	}

	// replace HTML entities
	/** @returns {string} */
	function replaceHTMLEntities(/** @type {string} */ input) {
		var	/** @type {string} */ result = input;

		// keep processing the input string while it contains HTML entities
		while (result.indexOf("&amp;") !== -1 || result.indexOf("&lt;") !== -1 || result.indexOf("&gt;") !== -1 || result.indexOf("&nbsp;") !== -1) {
			result = result.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ");
		}

		// return the transformed string
		return result;
	}

	// clean the pattern text
	/** @returns {string} */
	function cleanPattern(element) {
		// replace HTML entities
		var	/** @type {string} */ result = replaceHTMLEntities(element.innerHTML);

		// remove HTML tags
		result = result.replace(/<br *\/>/gi, "\n").replace(/<br>/gi, "\n").replace(/&nbsp;/gi, " ").replace(/<span class="posthilit">/gi, "").replace(/<\/span>/gi, "").replace(/<font><\/font>/gi, "").trim();

		// remove space or tab at the beginning of lines
		result = result.replace(/\n[ \t]+/g, "\n");

		// if the result is empty make it a valid pattern
		if (result === "") {
			result = "!";
		}

		// return cleaned string
		return result;
	}

	// update the inline viewer
	function updateMe(element) {
		// get the parent node
		var	parentItem = findDiv(element),

			// find the element containing the pattern
			textItem = parentItem.getElementsByTagName(DocConfig.patternSourceName)[0],

			// find the canvas
			canvasItem = parentItem.getElementsByTagName("canvas")[0],

			/** @type {string} */ cleanItem = "",
			/** @type {View} */ viewer = null;

		// find the View attached to this canvas
		if (canvasItem) {
			viewer = Controller.findViewerByCanvas(canvasItem.tabIndex);
			if (viewer) {
				// copy the text item into the inner html
				textItem.innerHTML = textItem.value;

				// clean the pattern text
				cleanItem = cleanPattern(textItem);

				// reset Identify before resizing the Viewer to prevent Cell Period Map generations
				viewer.lastIdentifyType = "";
				viewer.engine.countList = null;

				// reset the viewer
				viewer.viewStart(viewer);

				// hide any notifications immediately
				viewer.menuManager.notification.clear(true, true);
				viewer.menuManager.notification.clear(false, true);

				// update the viewer
				viewer.startViewer(cleanItem, false);
			}
		}
	}

	// complete update process after potential async load
	function completeUpdate(/**@type {View} */ view) {
		var	/** @type {number} */ itemHeight = 28,
			/** @type {number} */ itemFontSize = 18,
			/** @type {Array} */ viewer = Controller.standaloneViewer(),

			// get the popup window
			/** @type {PopupWindow} */ popup = viewer[2];

		// scale the viewer
		view.divItem.style.transform = "scale(" + view.windowZoom + "," + view.windowZoom + ")";
		view.divItem.style.transformOrigin = "top left";
		view.resize();

		// mark popup as displayed
		popup.displayed = true;

		// ensure popup is within the browser window
		popup.resizeWindow(popup);

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
		var	parentItem = findDiv(element),

			// find the element containing the pattern
			textItem = parentItem.getElementsByTagName(DocConfig.patternSourceName)[0],

			// get the pattern contents
			/** @type {string} */ cleanItem = cleanPattern(textItem),

			// get the standalone viewer
			/** @type {Array} */ viewer = Controller.standaloneViewer(),
			/** @type {View} */ view = null,

			// elements
			/** @type {HTMLCanvasElement} */ canvasItem = null,
			/** @type {HTMLDivElement} */ divItem = null,
			/** @type {Node} */ windowTitleItem = null,
			/** @type {HTMLAnchorElement} */ anchorItem = null,
			/** @type {HTMLDivElement} */ innerDivItem = null,
			/** @type {HTMLDivElement} */ centerDivItem = null,
			/** @type {HTMLAnchorElement} */ hiddenItem = null,

			// element sizes for scaling
			/** @type {number} */ itemHeight = 28,
			/** @type {number} */ itemFontSize = 18,

			// popup window
			/** @type {PopupWindow} */ popup = null;

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
			canvasItem = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
			canvasItem.width = ViewConstants.minViewerWidth;
			canvasItem.height = ViewConstants.minMenuHeight + 80;
			canvasItem.style.display = "block";
			//canvasItem.style.outline = "none";
			canvasItem.contentEditable = "false";

			// add a new anchor
			anchorItem = /** @type {!HTMLAnchorElement} */ (document.createElement('a'));
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
			hiddenItem = /** @type {!HTMLAnchorElement} */ (document.createElement('a'));
			hiddenItem.innerHTML = "&nbsp;X&nbsp;";
			hiddenItem.style.textDecoration = "none";
			hiddenItem.style.fontFamily = "Lucida Grande,Verdana,Helvetica,Arial,sans-serif";
			hiddenItem.style.visibility = "hidden";
			hiddenItem.style.cssFloat = "left";
			hiddenItem.style.height = itemHeight + "px";
			hiddenItem.style.fontSize = itemFontSize + "px";

			// create the center div with the window title text
			centerDivItem = /** @type {!HTMLDivElement} */ (document.createElement("div"));
			centerDivItem.style.textAlign = "center";
			centerDivItem.style.color = "rgb(83,100,130)";
			centerDivItem.style.fontFamily = "Arial, Verdana, Helvetica, sans-serif";
			centerDivItem.style.fontSize = itemFontSize + "px";
			centerDivItem.style.height = itemHeight + "px";
			windowTitleItem = document.createTextNode(ViewConstants.externalViewerTitle);
			centerDivItem.style.cursor = "default";
			centerDivItem.appendChild(windowTitleItem);

			// set the onclick
			registerEvent(anchorItem, "click", hideCallback, false);
			registerEvent(anchorItem, "touchend", hideCallback, false);

			// create enclosing div and set style
			divItem = /** @type {!HTMLDivElement} */ (document.createElement("div"));
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
			innerDivItem = /** @type {!HTMLDivElement} */ (document.createElement("div"));
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

		// reset Identify before resizing the Viewer to prevent Cell Period Map generations
		view.lastIdentifyType = "";
		view.engine.countList = null;

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
		var	/** @type {HTMLAnchorElement} */ anchorItem = rleItem.getElementsByTagName("a")[0],
			/** @type {HTMLAnchorElement} */ newAnchor = /** @type {!HTMLAnchorElement} */ (document.createElement("a")),
			/** @type {Node} */ nodeItem = null;

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

	// callback for show pattern error link
	function patternErrorCallback(/** @type {PointerEvent} */ event, /** @type {string} */ message) {
		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();

		alert(message);
		return false;
	}

	// create error
	function createError(rleItem, textItem, /** @type {string} */ message) {
		// add the show in viewer anchor
		var	/** @type {HTMLAnchorElement} */ anchorItem = rleItem.getElementsByTagName("a")[0],
			/** @type {HTMLAnchorElement} */ newAnchor = /** @type {!HTMLAnchorElement} */ (document.createElement("a")),
			/** @type {Node} */ nodeItem = null;

		// create new anchor
		newAnchor.setAttribute("href", "#");
		newAnchor.innerHTML = "Show Pattern Error";

		// set the onclick
		registerEvent(newAnchor, "click", function(/** @type {PointerEvent} */ event) {patternErrorCallback(event, message);}, false);

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

	// copy state map
	/** @returns {Array<Uint8Array>} */
	function copyStateMap(/** @type {Array<Uint8Array>} */ source) {
		var	/** @type {number} */ i = 0,
			/** @type {Array<Uint8Array>} */ result = Array.matrix(Type.Uint8, source.length , source[0].length, 0, Controller.allocator, "OverviewMap");

		// copy the contents
		for (i = 0; i < source.whole.length; i += 1) {
			result.whole[i] = source.whole[i];
		}

		return result;
	}

	// complete isPattern check
	function completeIsPattern(/** @type {Pattern} */ pattern, /** @type {Array} */ args) {
		// unpack arguments
		var	/** @type {string} */ patternString = args[0],
			rleItem = args[1],
			textItem = args[2],
			canvasItem = args[3];

		if (pattern && pattern.lifeMap && !pattern.tooBig) {
			// check for multiverse mode
			if (DocConfig.multi) {
				// add details to Controller
				Controller.patterns[Controller.patterns.length] = new PatternInfo(pattern.name, patternString, pattern.ruleName + pattern.boundedGridDef, pattern.width, pattern.height, pattern.originator, copyStateMap(pattern.multiStateMap));

				// check if this is the first viewer
				if (Controller.patterns.length === 1) {
					// hide the text
					textItem.style.display = "none";

					// check if there was a canvas
					if (canvasItem) {
						// initalise viewer not in popup
						canvasItem.contentEditable = "false";
						startView(patternString, canvasItem, textItem.offsetWidth, false, textItem);
					}
				} else {
					// hide the whole element
					rleItem.style.display = "none";
				}
			} else {
				// create the anchor if specified
				if (rleItem !== null) {
					createAnchor(rleItem, textItem);
				}
			}
		}
	}

	// complete isPattern check after load failure
	function completeIsPatternFailed(/** @type {Pattern} */ pattern, /** @type {Array} */ args) {
		// unpack arguments
		var	/** @type {string} */ patternText = args[0],
			rleItem = args[1],
			textItem = args[2];

		if (pattern) {
			if (rleItem !== null) {
				// ignore patterns that look like python code
				if (!(patternText[0] === "#" && patternText.indexOf("import ") !== -1)) {
					createError(rleItem, textItem, pattern.ruleName + " - " + pattern.originalFailure);
				}
			}
		}
	}

	// check if a string is a valid pattern
	function isPattern(/** @type {string} */ patternString, /** @type {Allocator} */ allocator, /** @type {PatternManager} */ manager, rleItem, textItem, canvasItem) {
		var	/** @type {Pattern} */ pattern = null;

		// attempt to create a pattern
		pattern = manager.create("", patternString, allocator, completeIsPattern, completeIsPatternFailed, [patternString, rleItem, textItem, canvasItem], null);
		if (!manager.loadingFromRepository) {
			if (pattern) {
				if (pattern.invalid) {
					pattern.originalFailure = manager.failureReason;
					completeIsPatternFailed(pattern, [patternString, rleItem, textItem, canvasItem]);
				} else {
					completeIsPattern(pattern, [patternString, rleItem, textItem, canvasItem]);
				}
			}
		}
	}

	// callback for show in viewer anchor
	function anchorCallback(/** @type {PointerEvent} */ event) {
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
		var	/** @type {View} */ view = null,
			/** @type {number} */ i = 0;

		// check for fullscreen viewer
		if (DocConfig.fullScreen) {
			// find default viewer
			view = Controller.viewers[0][1];
			view.displayWidth = (document.body.clientWidth & ~7) - 8;
			view.displayHeight = window.innerHeight - 130;
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

	// drop handler
	function dropHandler(/** @type {DragEvent} */ event) {
		var	/** @type {File} */ firstFile = null,
			/** @type {DataTransfer} */ dt = event.dataTransfer,
			/** @type {FileReader} */ reader = null,
			/** @type {Element} */ button = null;

		// check if there is a data transfer object
		if (dt) {
			// check if there are any files being dropped
			if (dt.files.length > 0) {
				// only process the firs file
				firstFile = dt.files[0];

				// read the file
				reader = new FileReader();
				reader.onload = function() {
					var	/** @type {string} */ text = /** @type {!string} */ (reader.result),
						/** @type {Element} */ node = document.getElementById("rle");

					if (node) {
						node.innerHTML = text;

						// click the View button
						button = document.getElementById("viewbutton");
						if (button) {
							updateMe(button);
						}
					}
				};
				reader.readAsText(firstFile);
			}
		}

		// disable default behaviour
		event.preventDefault();
		event.stopPropagation();
	};

	// drag over handler
	function dragOverHandler(/** @type {DragEvent} */ event) {
		event.preventDefault();
	};

	// start all viewers in the document
	function startAllViewers() {
		// find all viewers in the document (should be enclosed in <div class="rle">)
		var	divList = document.getElementsByTagName("div"),
			/** @type {number} */ i = 0,
			anchorList = null,
			/** @type {Element} */ textItem = null,
			/** @type {Element} */ childItem = null,
			/** @type {HTMLAnchorElement} */ anchorItem = null,
			/** @type {HTMLCanvasElement} */ canvasItem = null,
			/** @type {string} */ cleanItem = "",
			/** @type {HTMLDivElement} */ rleItem = null,
			/** @type {CSSStyleDeclaration} */ style = null,
			/** @type {Element} */ button = null,
			/** @type {Element} */ button2 = null,
			/** @type {Element} */ button3 = null,
			/** @type {Element} */ build = null,
			/** @type {Element} */ canvasElement = null,

			// temporary allocator and pattern manager
			/** @type {Allocator} */ allocator = new Allocator(),
			/** @type {PatternManager} */ manager = new PatternManager();

		console.time("LifeViewer page scan");

		// read settings
		readSettingsFromMeta();

		// initialise the aliases
		AliasManager.init();

		// search for rle divs
		for (i = 0; i < divList.length; i += 1) {
			// get the next div
			rleItem = /** @type {!HTMLDivElement} */ (divList[i]);

			// check if it is rle class
			if (rleItem.className === DocConfig.divClassName) {
				// find the child textarea and canvas
				textItem = rleItem.getElementsByTagName(DocConfig.patternSourceName)[0];
				canvasItem = /** @type {!HTMLCanvasElement} */ (rleItem.getElementsByTagName("canvas")[0]);

				// check if the text item contains a child text item
				childItem = textItem.getElementsByTagName(DocConfig.patternSourceName)[0];
				if (childItem) {
					textItem = childItem;
				}

				// check if typedArrays and Canvas are supported
				if (Supports.typedArrays && textItem) {

					console.time("LifeViewer read embedded");

					// remove any html tags from the text item and trim
					cleanItem = cleanPattern(textItem);

					// check for multiverse
					if (DocConfig.multi) {
						// check if the text is a pattern and add to Controller if in multiverse mode
						isPattern(cleanItem, allocator, manager, rleItem, textItem, canvasItem);
					} else {
						// check if the canvas exists
						if (canvasItem && canvasItem.getContext) {
							// check whether to limit the height of the text item
							if (DocConfig.patternSourceMaxHeight > -1) {
								if (textItem.clientHeight > DocConfig.patternSourceMaxHeight) {
									textItem.style.height = DocConfig.patternSourceMaxHeight + "px";
								}
							}

							// initalise viewer not in popup
							canvasItem.contentEditable = "false";
							startView(cleanItem, canvasItem, textItem.offsetWidth, false, textItem);
						} else {
							// hide the canvas item
							if (DocConfig.hide && canvasItem) { 
								canvasItem.style.display = "none";
							}
						}
					}

					console.timeEnd("LifeViewer read embedded");

				}
			} else {
				// check if typedArrays are supported
				if (Supports.typedArrays) {
					// check if it is a div containing a codebox (that isn't in an rle div)
					if (rleItem.className === DocConfig.divCodeClassName) {
						// check if the parent is rle
						if (rleItem.parentNode.className !== DocConfig.divClassName) {
							// find the child code block
							textItem = rleItem.getElementsByTagName(DocConfig.patternSourceName)[0];
							if (textItem) {

								console.time("LifeViewer read popup");

								// remove any html tags from the text item and trim
								cleanItem = cleanPattern(textItem);

								// null the anchor so we can tell if it gets created
								anchorItem = null;

								// check if the contents is a valid pattern (will add to Controller if in multiverse mode)
								isPattern(cleanItem, allocator, manager, rleItem, textItem, null);

								console.timeEnd("LifeViewer read popup");
							}
						}
					}
				}
			}
		}

		// remove accesskey elements that conflict with LifeViewer
		anchorList = document.getElementsByTagName("a");

		for (i = 0; i < anchorList.length; i += 1) {
			// get the next anchor
			anchorItem = /** @type {!HTMLAnchorElement} */ (anchorList[i]);
			if (anchorItem.accessKey !== "") {
				// check if it conflicts
				if (ViewConstants.altKeys.indexOf(anchorItem.accessKey) !== -1) {
					anchorItem.accessKey = "";
				}
			}
		}

		// check for LifeViewer home page button
		button = document.getElementById("viewbutton");
		if (button) {
			registerEvent(button, "click",  function() {updateMe(button);}, false);

			// style the button and parent TD
			style = button.style;
			style.fontSize = "24px";
			style.width = "100px";
			style.height = "66px";

			if (button.parentElement) {
				style = button.parentElement.style;
				style.verticalAlign = "middle";
				style.padding = "8px";
			}

			// enable file drag and drop
			canvasElement = document.getElementById("ViewerCanvas");
			if (canvasElement) {
				registerEvent(canvasElement, "drop", function(/** @type {DragEvent} */ event) {dropHandler(event);}, false);
				registerEvent(canvasElement, "dragover", function(/** @type {DragEvent} */ event) {dragOverHandler(event);}, false);
			}
		}

		// check for LifeViewer viewer.html buttons
		button2 = document.getElementById("viewerview");
		if (button2) {
			registerEvent(button2, "click", function() {updateMe(button2);}, false);
		}

		button3 = document.getElementById("viewerpopup");
		if (button3) {
			registerEvent(button3, "click", function() {updateViewer(button3);}, false);
		}

		// check for LifeViewer build element
		build = document.getElementById("lvbuild");
		if (build) {
			build.innerHTML = String(ViewConstants.versionBuild);
		}

		console.timeEnd("LifeViewer page scan");

		if (DocConfig.multi) {
			// switch to overview mode
			Controller.overview = true;

			// launch overview when pending rule downloads are complete
			RuleTreeCache.checkRequestsCompleted();
		}
	};

	// boot LifeViewer
	function bootLifeViewer() {
		// measure monitor frame rate
		requestAnimationFrame(Controller.frameRateMeasure);
	};

	/*  TBD WASM
	// load webassembly from base64 string
	var wasmBase64 = "AGFzbQEAAAABBgFgAX8BfwMCAQAHDAEIcG9wY291bnQAAAoHAQUAIABpCw==";
	var wasmString = atob(wasmBase64);
	var wasmBuffer = new  Uint8Array(wasmString.length);
	for (var i = 0; i < wasmString.length; i += 1) {
		wasmBuffer[i] = wasmString.charCodeAt(i);
	}

	// web assembly interface that functions will be called through
	var WASM = {};

	// instantiate the WebAssembly functions
	var importObj = {
		module: {}
	};

	WebAssembly.instantiate(wasmBuffer, importObj).then(result => {
		WASM.popCount = result.instance.exports.popcount;
	});
	*/

	// register event to start viewers when document is loaded
	registerEvent(window, "load", bootLifeViewer, false);
	registerEvent(window, "resize", resizeWindow, false);

	/*jshint -W069 */
	// external interface
	window['updateViewer'] = updateViewer;
	window['updateMe'] = updateMe;
