// LifeViewer Waypoint
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";
 
	// define globals
	/* global Keywords ViewConstants */

    // WaypointConstants singleton
	var WaypointConstants = {
		// POI mode
		/** @const {number} */ none : 0,
		/** @const {number} */ play : 1,
		/** @const {number} */ stop : 2,

		// POI transition speed
		/** @const {number} */ poiDefaultSpeed : 12,
		/** @const {number} */ poiMinSpeed : 0,
		/** @const {number} */ poiMaxSpeed: 200
	};

	// Waypoint constructor
	/**
	 * @constructor
	 */
	function Waypoint(manager) {
		// save the manager
		this.manager = manager;

		// whether waypoint is POI
		this.isPOI = false;

		// whether to reset at POI
		this.resetAtPOI = false;

		// whether to stop or play at POI
		this.modeAtPOI = WaypointConstants.none;

		// POI transition speed
		this.poiTransitionSpeed = WaypointConstants.poiDefaultSpeed;

		// STOP generation
		this.stopGeneration = -1;

		// LOOP generation
		this.loopGeneration = -1;

		// camera position
		this.x = 0;
		this.y = 0;

		// camera angle
		this.angle = 0;

		// camera zoom
		this.zoom = 1;

		// layers
		this.layers = 1;

		// layer depth
		this.depth = 1;

		// colour theme
		this.theme = 0;

		// gps
		this.gps = 60;

		// step size
		this.step = 1;

		// target generation
		this.targetGen = 0;

		// target time
		this.targetTime = 0;

		// text message
		this.textMessage = "";

		// whether to fit zoom
		this.fitZoom = false;

		// flags for linear
		this.xLinear = false;
		this.yLinear = false;
		this.zLinear = false;

		// stars
		this.stars = false;

		// grid
		this.grid = false;

		// flags for which items were defined
		this.xDefined = false;
		this.yDefined = false;
		this.angleDefined = false;
		this.zoomDefined = false;
		this.layersDefined = false;
		this.depthDefined = false;
		this.themeDefined = false;
		this.gpsDefined = false;
		this.stepDefined = false;
		this.stopGenDefined = false;
		this.loopGenDefined = false;
		this.targetGenDefined = false;
		this.targetTimeDefined = false;
		this.textDefined = false;
		this.xModeDefined = false;
		this.yModeDefined = false;
		this.zModeDefined = false;
		this.starsDefined = false;
		this.gridDefined = false;

		// whether waypoint has been processed
		this.processed = false;
	}

	// set a waypoint to the same as another waypoint
	Waypoint.prototype.set = function(fromWaypoint) {
		// copy POI information
		this.isPOI = fromWaypoint.isPOI;
		this.resetAtPOI = fromWaypoint.resetAtPOI;
		this.modeAtPOI = fromWaypoint.modeAtPOI;
		this.poiTransitionSpeed = fromWaypoint.poiTransitionSpeed;
		this.stopGeneration = fromWaypoint.stopGeneration;
		this.loopGeneration = fromWaypoint.loopGeneration;

		// copy position
		this.x = fromWaypoint.x;
		this.y = fromWaypoint.y;

		// copy mode
		this.xLinear = fromWaypoint.xLinear;
		this.yLinear = fromWaypoint.yLinear;
		this.zLinear = fromWaypoint.zLinear;

		// copy fit zoom
		this.fitZoom = fromWaypoint.fitZoom;

		// copy angle
		this.angle = fromWaypoint.angle;

		// copy zoom
		this.zoom = fromWaypoint.zoom;

		// copy layers
		this.layers = fromWaypoint.layers;

		// copy depth
		this.depth = fromWaypoint.depth;

		// copy theme
		this.theme = fromWaypoint.theme;

		// copy gps
		this.gps = fromWaypoint.gps;

		// copy target generation and time
		this.targetGen = fromWaypoint.targetGen;
		this.targetTime = fromWaypoint.targetTime;

		// copy text message
		this.textMessage = fromWaypoint.textMessage;

		// copy stars
		this.stars = fromWaypoint.stars;

		this.grid = fromWaypoint.grid;
	};

	// return action name as string
	Waypoint.prototype.actionName = function() {
		var result = "";

		switch (this.modeAtPOI) {
		case WaypointConstants.play:
			result = Keywords.poiPlayWord;
			break;
		case WaypointConstants.stop:
			result = Keywords.poiStopWord;
			break;
		default:
			break;
		}
		return result;
	};

	// set play action
	Waypoint.prototype.setPlayAction = function(scriptErrors) {
		if (this.isPOI) {
			if (this.modeAtPOI !== WaypointConstants.none) {
				scriptErrors[scriptErrors.length] = [Keywords.poiPlayWord, "overwrites " + this.actionName()];
			}
			this.modeAtPOI = WaypointConstants.play;
		}
		else {
			scriptErrors[scriptErrors.length] = [Keywords.poiPlayWord, "only valid at POI"];
		}
	};

	// set stop action
	Waypoint.prototype.setStopAction = function(scriptErrors) {
		if (this.isPOI) {
			if (this.modeAtPOI !== WaypointConstants.none) {
				scriptErrors[scriptErrors.length] = [Keywords.poiStopWord, "overwrites " + this.actionName()];
			}
			this.modeAtPOI = WaypointConstants.stop;
		}
		else {
			scriptErrors[scriptErrors.length] = [Keywords.poiStopWord, "only valid at POI"];
		}
	};

	// set reset action
	Waypoint.prototype.setResetAction = function(scriptErrors) {
		if (this.isPOI) {
			if (this.resetAtPOI) {
				scriptErrors[scriptErrors.length] = [Keywords.poiResetWord, "already defined"];
			}
			this.resetAtPOI = true;
		}
		else {
			scriptErrors[scriptErrors.length] = [Keywords.poiResetWord, "only valid at POI"];
		}
	};

	// set transition speed
	Waypoint.prototype.setTransitionSpeed = function(speed, scriptErrors) {
		if (this.isPOI) {
			if (this.poiTransitionSpeed !== WaypointConstants.poiDefaultSpeed) {
				scriptErrors[scriptErrors.length] = [Keywords.poiTransWord + " " + speed, "overwrites " + this.poiTransitionSpeed];
			}
			this.poiTransitionSpeed = speed;
		}
		else {
			scriptErrors[scriptErrors.length] = [Keywords.poiTransWord, "only valid at POI"];
		}
	};

	// set a waypoint to an interpolation between two waypoints
	Waypoint.prototype.interpolate = function(fromWaypoint, toWaypoint, elapsedTime) {
		// compute the time delta
		var startTime = fromWaypoint.targetTime + 0.0,
		    endTime = toWaypoint.targetTime + 0.0,

		    // start and end angle for wrap around
		    startAngle = fromWaypoint.angle + 0.0,
		    endAngle = toWaypoint.angle + 0.0,

		    // default to complete
		    percentLinearComplete = 1.0,
		    percentBezierComplete = 1.0,

		    // x, y and zoom percent complete
		    percentXComplete = 1.0,
		    percentYComplete = 1.0,
		    percentZComplete = 1.0;
		
		// cap elapsed time to end time
		if (elapsedTime > endTime) {
			elapsedTime = endTime;
		}

		// check if this is a zero time waypoint
		if (endTime - startTime == ViewConstants.singleFrameMS) {
			startTime = endTime;
		}

		// compute percentage complete
		if (endTime !== startTime) {
			percentLinearComplete = ((elapsedTime - startTime) / (endTime - startTime)) + 0.0;
			percentBezierComplete = (this.manager.bezierX(percentLinearComplete, 0, 0, 1, 1)) + 0.0;
		}

		// check whether to use linear or bezier for x, y and zoom
		if (toWaypoint.xLinear || toWaypoint.fitZoom) {
			percentXComplete = percentLinearComplete;
		}
		else {
			percentXComplete = percentBezierComplete;
		}

		if (toWaypoint.yLinear || toWaypoint.fitZoom) {
			percentYComplete = percentLinearComplete;
		}
		else {
			percentYComplete = percentBezierComplete;
		}

		if (toWaypoint.zLinear || toWaypoint.fitZoom) {
			percentZComplete = percentLinearComplete;
		}
		else {
			percentZComplete = percentBezierComplete;
		}

		// interpolate position
		this.x = fromWaypoint.x + percentXComplete * (toWaypoint.x - fromWaypoint.x);
		this.y = fromWaypoint.y + percentYComplete * (toWaypoint.y - fromWaypoint.y);

		// interpolate zoom
		this.zoom = fromWaypoint.zoom * Math.pow(toWaypoint.zoom / fromWaypoint.zoom, percentZComplete);

		// check if angle wrap around needed (e.g. 350 degrees to 10 degrees)
		if (endAngle - startAngle > 180) {
			startAngle += 360;
		}
		else {
			if (endAngle - startAngle < -180) {
				endAngle += 360;
			}
		}

		// interpolate angle
		this.angle = (startAngle + percentBezierComplete * (endAngle - startAngle)) % 360;

		// interpolate layers
		this.layers = (fromWaypoint.layers + percentLinearComplete * (toWaypoint.layers - fromWaypoint.layers)) | 0;

		// interpolate depth
		this.depth = fromWaypoint.depth + percentLinearComplete * (toWaypoint.depth - fromWaypoint.depth);

		// copy theme
		this.theme = toWaypoint.theme;

		// copy gps
		this.gps = toWaypoint.gps;

		// copy step
		this.step = toWaypoint.step;

		// interpolate target generation
		this.targetGen = (fromWaypoint.targetGen + percentLinearComplete * (toWaypoint.targetGen - fromWaypoint.targetGen)) | 0;

		// set time
		this.targetTime = elapsedTime;

		// set text message
		this.textMessage = toWaypoint.textMessage;

		// set fit zoom
		this.fitZoom = toWaypoint.fitZoom;
	};

	// Label constructor
	/**
	 * @constructor
	 */
	function Label(x, y, zoom) {
		// message
		this.message = "";

		// x position
		this.x = x;

		// y position
		this.y = y;

		// zoom
		this.zoom = zoom;
	}

	// WaypointManager constructor
	/**
	 * @constructor
	 */
	function WaypointManager() {
		// list of waypoints
		this.waypointList = [];

		// list of points of interest
		this.poiList = [];

		// list of labels
		this.labelList = [];

		// current position
		this.current = new Waypoint(this);

		// temporary start waypoint
		this.tempStart = new Waypoint(this);

		// temporary end waypoint
		this.tempEnd = new Waypoint(this);

		// whether using the temporary position
		this.usingTemp = false;

		// waypoint index to return to after temporary glide
		this.tempIndex = 0;

		// whether last waypoint has been reached
		this.lastReached = false;
	}

	// create a label
	WaypointManager.prototype.createLabel = function(x, y, zoom) {
		return new Label(x, y, zoom);
	};

	// clear all labels
	WaypointManager.prototype.clearLabels = function() {
		this.labelList = [];
	};

	// add a label to the list
	WaypointManager.prototype.addLabel = function(label) {
		this.labelList[this.labelList.length] = label;
	};

	// draw labels
	WaypointManager.prototype.drawLabels = function(view) {
		var i = 0,
			current = null,
			engine = view.engine,
			context = engine.context,
			xPos = 0,
			xOff = engine.width / 2 - engine.xOff - engine.originX,
			yOff = engine.height / 2 - engine.yOff - engine.originY,
			zoom = engine.zoom,
			halfDisplayWidth = engine.displayWidth / 2,
			halfDisplayHeight = engine.displayHeight / 2,
			x = 0, y = 0,
			currentSize = 0,
			shadowColour = ViewConstants.labelShadowColour,
			textColour = ViewConstants.labelFontColour,
			fontSize = ViewConstants.labelFontSize,
			fontEnd = "px " + ViewConstants.labelFontFamily,
			minFont = ViewConstants.minLabelFontSize,
			maxFont = ViewConstants.maxLabelFontSize,
			linearZoom = 1,
			changedAlpha = false;
			

		// draw each label
		for (i = 0; i < this.labelList.length; i += 1) {
			// get the next label
			current = this.labelList[i];

			// scale the font based on the zoom
			currentSize = (fontSize * zoom / current.zoom) | 0;

			// do not draw if too big or too small
			if (currentSize >= minFont && currentSize <= maxFont) {
				// convert zoom into a linear range
				linearZoom = Math.log(currentSize / minFont) / Math.log(maxFont / minFont);
				context.font = currentSize + fontEnd;

				// make more transparent if in bottom or top 20% of linear range
				if (linearZoom <= 0.2) {
					context.globalAlpha = linearZoom * 5;
					changedAlpha = true;
				} else {
					if (linearZoom >= 0.8) {
						context.globalAlpha = (1 - linearZoom) * 5;
						changedAlpha = true;
					} else {
						context.globalAlpha = 1;
					}
				}

				// measure text at current font
				xPos = context.measureText(current.message).width >> 1;
				x = -xPos + ((xOff + current.x) * zoom) + halfDisplayWidth;
				y = ((yOff + current.y) * zoom) + halfDisplayHeight;
	
				// draw shadow
				context.fillStyle = shadowColour;
				context.fillText(current.message, x + 2, y + 2);
	
				// draw message
				context.fillStyle = textColour;
				context.fillText(current.message, x, y);
			}
		}

		// restore alpha if changed
		if (changedAlpha) {
			context.globalAlpha = 1;
		}
	};

	// process step back
	WaypointManager.prototype.steppedBack = function(elapsedTime) {
		var i = 0,
		    current = null;

		// mark all waypoints after elasped time as not processed
		for (i = this.waypointList.length - 1; i >= 0; i -= 1) {
			current = this.waypointList[i];
			if (current.targetTime > elapsedTime && current.processed) {
				this.tempIndex = i;
				current.processed = false;
			}
		}
	};

	// reset for playback
	WaypointManager.prototype.resetPlayback = function() {
		var i;

		// mark all waypoints as not processed
		for (i = 0; i < this.waypointList.length; i += 1) {
			this.waypointList[i].processed = false;
		}

		// reset temporary index
		this.tempIndex = 0;

		// reset last reached flag
		this.lastReached = false;
	};

	// create a waypoint
	WaypointManager.prototype.createWaypoint = function() {
		return new Waypoint(this);
	};

	// return x from a bezier curve
	WaypointManager.prototype.bezierX = function(t, x0, x1, x2, x3) {
		// compute coefficients
		var cX = 3 * (x1 - x0),
		    bX = 3 * (x2 - x1) - cX,
		    aX = x3 - x0 - cX - bX,
            
		    // compute the x position
		    x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + x0;

		// return the x component
		return x;
	};

	// reset the waypoint manager
	WaypointManager.prototype.reset = function() {
		// clear waypoint list
		this.waypointList = [];

		// clear POI list
		this.poiList = [];

		// clear using temporary position flag
		this.usingTemp = false;

		// set temporary index
		this.tempIndex = 0;
	};

	// return the last waypoint
	WaypointManager.prototype.lastWaypoint = function() {
		return this.waypointList[this.waypointList.length - 1];
	};

	// return time to a given generation
	WaypointManager.prototype.elapsedTimeTo = function(generation) {
		var result = 0,
		   
		    // find the closest waypoint to the generation
		    index = this.findWaypointNear(generation),

		    // get the waypoint
		    waypoint = this.waypointList[index],
		    previous = null;

		// check if the generation is beyond the waypoint
		if (generation > waypoint.targetGen) {
			// return the time to waypoint plus time at final gps to the generation
			result = waypoint.targetTime + (generation - waypoint.targetGen) * 1000 / (waypoint.gps * waypoint.step);
		}
		else {
			// check if there is a previous waypoint
			if (index > 0) {
				// get the previous waypoint
				previous = this.waypointList[index - 1];

				// return the time to the previous waypoint plus time at current gps to the generation
				result = previous.targetTime + (generation - previous.targetGen) * 1000 / (waypoint.gps * waypoint.step);
			}
			else {
				// return the time at current gps to the generation
				result = generation * 1000 / (waypoint.gps * waypoint.step);
			}
		}

		// return the elapsed time
		return result;
	};

	// create temporary position
	WaypointManager.prototype.createTemporaryPosition = function(x, y, zoom, angle, layers, depth, theme, gps, step, generation, elapsedTime) {
		// get the temporary start waypoint
		var temp = this.tempStart,
		    result = 0;

		// set temporary waypoint from the supplied parameters
		temp.x = x;
		temp.y = y;
		temp.zoom = zoom;
		temp.angle = angle;
		temp.gps = gps;
		temp.step = step;
		temp.layers = layers;
		temp.depth = depth;
		temp.theme = theme;

		// set the target generation
		temp.targetGen = generation;

		// if already using temporary waypoint then set elapsed time from target
		if (this.usingTemp) {
			elapsedTime = this.tempEnd.targetTime;
		}

		// set the elapsed time one second in the past
		temp.targetTime = elapsedTime - 1000;

		// get the current position
		this.update(elapsedTime, generation);

		// set the temporary end waypoint as the current position
		this.tempEnd.set(this.current);
		this.tempEnd.fitZoom = false;

		// set the temporary end waypoint target as now
		this.tempEnd.targetTime = elapsedTime;

		// set using temporary position flag
		this.usingTemp = true;

		// set the elapsed time
		result = temp.targetTime;

		// return the temporary start waypoint time
		return result;
	};

	// return the first waypoint
	WaypointManager.prototype.firstWaypoint = function() {
		// return the first waypoint
		return this.waypointList[0];
	};

	// return the number of points of interests
	WaypointManager.prototype.numPOIs = function() {
		return this.poiList.length;
	};

	// return the number of waypoints
	WaypointManager.prototype.numWaypoints = function() {
		return this.waypointList.length;
	};

	// add a waypoint to the manager
	WaypointManager.prototype.add = function(waypoint) {
		// check if this is a waypoint or a point of interest
		if (waypoint.isPOI) {
			// add the waypoint to the end of the POI list
			this.poiList[this.poiList.length] = waypoint;
		}
		else {
			// add the waypoint to the end of the waypoint list
			this.waypointList[this.waypointList.length] = waypoint;
		}
	};

	// check if at or beyond last waypoint
	WaypointManager.prototype.atLast = function(elapsedTime) {
		var result = false;

		// check if the last used waypoint was the final one
		if (this.tempIndex >= this.waypointList.length - 1) {
			// check if elapsed time is greater than last waypoint
			if (elapsedTime >= this.waypointList[this.tempIndex].targetTime) {
				result = true;
			}
		}

		// return the flag
		return result;
	};

	// return a short version of a decimal
	WaypointManager.prototype.shortNumber = function(i, places) {
		var result = null;

		// check if number is an integer
		if (i === (i | 0)) {
			// return integer version
			result = String(i | 0);
		}
		else {
			// return fixed point version
			result = String(i.toFixed(places));
		}

		return result;
	};

	// output a point of interest camera position as text
	WaypointManager.prototype.poiCameraAsText = function(i) {
		// build the text
		var text = "",
		    poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// get the coordinates
			if (poi.xDefined) {
				text += " X " + poi.x;
			}
			if (poi.yDefined) {
				text += " Y " + poi.y;
			}

			// get the zoom and angle
			if (poi.zoomDefined) {
				text += " ZOOM " + this.shortNumber(poi.zoom, 1);
			}
			if (poi.angleDefined) {
				text += " ANGLE " + poi.angle;
			}

		}

		// return the text
		return text.substr(1);
	};

	// output a point of interest action as text
	WaypointManager.prototype.poiActionAsText = function(i) {
		// build the text
		var text = "",
		    poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// add reset if defined
			if (poi.resetAtPOI) {
				text += " POIRESET";
			}
			// add mode if defined
			if (poi.modeAtPOI === WaypointConstants.play) {
				text += " POIPLAY";
			}
			else {
				if (poi.modeAtPOI === WaypointConstants.stop)  {
					text += " POISTOP";
				}
			}

			// add transition time if not default
			if (poi.poiTransitionSpeed !== WaypointConstants.poiDefaultSpeed) {
				text += " POITRANS " + poi.poiTransitionSpeed;
			}
		}

		// return the text
		return text.substr(1);
	};

	// output a point of interest loop, stop, gps and step as text
	WaypointManager.prototype.poiLoopStopGpsStepAsText = function(i) {
		// build the text
		var text = "",
		    poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// add loop if defined
			if (poi.loopGenDefined) {
				text += " LOOP " + (poi.loopGeneration === -1 ? "OFF" : poi.loopGeneration);
			}

			// add stop if defined
			if (poi.stopGenDefined) {
				text += " STOP " + (poi.stopGeneration === -1 ? "OFF" : poi.stopGeneration);
			}

			// add gps if defined
			if (poi.gpsDefined) {
				text += " GPS " + poi.gps;
			}

			// add step if defined
			if (poi.stepDefined) {
				text += " STEP " + poi.step;
			}
		}

		// return the text
		return text.substr(1);
	};

	// output a point of interest action as text
	WaypointManager.prototype.poiActionAsText = function(i) {
		// build the text
		var text = "",
		    poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// add reset if defined
			if (poi.resetAtPOI) {
				text += " POIRESET";
			}
			// add mode if defined
			if (poi.modeAtPOI === WaypointConstants.play) {
				text += " POIPLAY";
			}
			else {
				if (poi.modeAtPOI === WaypointConstants.stop)  {
					text += " POISTOP";
				}
			}

			// add transition time if not default
			if (poi.poiTransitionSpeed !== WaypointConstants.poiDefaultSpeed) {
				text += " POITRANS " + poi.poiTransitionSpeed;
			}
		}

		// return the text
		return text.substr(1);
	};

	// output a point of interest theme, depth and layer as text
	WaypointManager.prototype.poiThemeDepthLayerAsText = function(i) {
		// build the text
		var text = "",
		    poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// add theme if defined
			if (poi.themeDefined) {
				text += " THEME " + poi.theme;
			}

			// add depth if defined
			if (poi.depthDefined) {
				text += " DEPTH " + this.shortNumber(poi.depth, 1);
			}

			// add layer if defined
			if (poi.layersDefined) {
				text += " LAYERS " + poi.layers;
			}
		}

		// return the text
		return text.substr(1);
	};

	// output a point of interest start generation as text
	/* eslint-disable no-unused-vars */
	WaypointManager.prototype.poiStartGenAsText = function(i, stringDelimiter) {
		/* eslint-enable no-unused-vars */
		// build the text
		var text = "",
		    poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// add the start generation if defined
			if (poi.targetGenDefined) {
				text += " POIT " + poi.targetGen;
			}
		}

		// return the text
		return text.substr(1);
	};

	// output a point of interest message as text
	WaypointManager.prototype.poiMessageAsText = function(i, stringDelimiter) {
		// build the text
		var text = "",
		    poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// add the message if defined
			if (poi.textMessage !== "") {
				text += " " + stringDelimiter + poi.textMessage + stringDelimiter;
			}
		}

		// return the text
		return text.substr(1);
	};

	// output a waypoint as text
	WaypointManager.prototype.waypointAsText = function(i, stringDelimiter) {
		// build the text
		var text = "",

		    // requested waypoint and previous waypoint
		    requested = null,
		    previous = null;

		// check whether the requested waypoint exists
		if (i >= 0 && i < this.numWaypoints()) {
			// set the requested waypoint
			requested = this.waypointList[i];

			// check if the previous waypoint exists
			if (i > 0) {
				// get the previous waypoint
				previous = this.waypointList[i - 1];

				// check if generation target or pause
				if (requested.targetGen === previous.targetGen) {
					text = "P " + this.shortNumber(((requested.targetTime - previous.targetTime) | 0) / 1000, 1);
				}
				else {
					text = "T " + requested.targetGen;
				}

				// output changes
				if (requested.fitZoom) {
					text += " F";
				}
				else {
					if (requested.x !== previous.x) {
						text += " X " + -requested.x;
					}
					if (requested.y !== previous.y) {
						text += " Y " + -requested.y;
					}
					if (requested.zoom !== previous.zoom) {
						text += " Z " + this.shortNumber(requested.zoom, 1);
					}
				}

				if (requested.angle !== previous.angle) {
					text += " A " + requested.angle;
				}
				if (requested.layers !== previous.layers) {
					text += " L " + requested.layers;
				}
				if (requested.depth !== previous.depth) {
					text += " D " + this.shortNumber(requested.depth, 1);
				}
				if (requested.theme !== previous.theme) {
					text += " C " + requested.theme;
				}
				if (requested.gps !== previous.gps) {
					text += " G " + requested.gps;
				}
				if (requested.step !== previous.step) {
					text += " S " + requested.step;
				}
				if (requested.textMessage !== "") {
					text += " " + stringDelimiter + requested.textMessage + stringDelimiter;
				}
			}
			else {
				// create the text from the single waypoint
				text = "T " + requested.targetGen + " X " + -requested.x + " Y " + -requested.y + " Z " + this.shortNumber(requested.zoom, 1) + " A " + requested.angle + " L " + requested.layers + " D " + this.shortNumber(requested.depth, 1) + " C "  + requested.theme + " G " + requested.gps + " S " + requested.step;
			}
		}

		// return the text
		return text;
	};

	// update the current position and return whether waypoints ended
	WaypointManager.prototype.update = function(elapsedTime, generation) {
		var length = this.waypointList.length,
		    found = false,
		    i = this.tempIndex,
		    current = null,

		    // set waypoints not ended
		    result = false;

		// check if using temporary waypoints
		if (this.usingTemp) {
			// interpolate between temporary waypoints
			this.current.interpolate(this.tempStart, this.tempEnd, elapsedTime);
			if (elapsedTime >= this.tempEnd.targetTime) {
				this.usingTemp = false;
			}
		}
		else {
			// find the last waypoint below the elapsed time
			while (i < length && !found) {
				current = this.waypointList[i];
				if (current.targetTime >= elapsedTime || !current.processed) {
					// result is previous waypoint
					found = true;
				}
				else {
					// check next waypoint
					i += 1;
				}
			}

			// check if the waypoint was found
			if (!found) {
				// set current to last waypoint
				i = length - 1;
				this.current.set(this.waypointList[i]);

				// flag end of waypoints
				if (generation >= this.current.targetGen && this.lastReached) {
					result = true;
				}
				this.lastReached = true;
			}
			else {
				// mark waypoint as processed unless it is the last one
				this.waypointList[i].processed = true;

				// check for first waypoint
				if (i > 0) {
					// check for fit zoom
					if (this.waypointList[i].fitZoom) {
						// copy fit zoom from current waypoint to target
						this.waypointList[i].x = this.current.x;
						this.waypointList[i].y = this.current.y;
						this.waypointList[i].zoom = this.current.zoom;
					}
					
					// interpolate between waypoints
					this.current.interpolate(this.waypointList[i - 1], this.waypointList[i], elapsedTime);
				}
				else {
					// at first waypoint
					i = 0;

					// just use first waypoint
					this.current.set(this.waypointList[i]);
				}
			}

			// save current index
			this.tempIndex = i;
		}

		// return flag indicating whether waypoints ended
		return result;
	};

	// return the index of the closest waypoint to a generation
	WaypointManager.prototype.findWaypointNear = function(generation) {
		var i = 0,
		    found = false,
		    waypointList = this.waypointList,
		    length = this.numWaypoints();

		// find the waypoint at or beyond the specified generation
		while (i < length && !found) {
			if (waypointList[i].targetGen >= generation) {
				// found the waypoint
				found = true;
			}
			else {
				// check next waypoint
				i += 1;
			}
		}

		// check if found
		if (!found) {
			// return the last waypoint
			i = length - 1;
		}

		// return the waypoint index
		return i;
	};

	// find the closest waypoint to a generation
	WaypointManager.prototype.findClosestWaypoint = function(generation) {
		// save the index of the closest waypoint
		this.tempIndex = this.findWaypointNear(generation);
	};

	// copy a single initial value into POI
	WaypointManager.prototype.copyInitial = function(what, poi, scriptErrors, initialDefined) {
		// check there is an initial waypoint
		if (this.numWaypoints() === 0) {
			scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, "no initial waypoint defined"];
		}
		else {
			// check which value to copy
			switch (what) {
			case Keywords.xWord:
				// check if x is already defined
				if (poi.xDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + -poi.x)];
				}
				// set x
				poi.x = this.waypointList[0].x;
				poi.xDefined = true;
				break;

			case Keywords.yWord:
				// check if y is already defined
				if (poi.yDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + -poi.y)];
				}
				// set y
				poi.y = this.waypointList[0].y;
				poi.yDefined = true;
				break;

			case Keywords.zoomWord:
				// check if zoom is already defined
				if (poi.zoomDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + this.shortNumber((poi.zoom < 1) ? -(1 / poi.zoom) : poi.zoom, 1))];
				}
				// set zoom
				poi.zoom = this.waypointList[0].zoom;
				poi.zoomDefined = true;
				break;

			case Keywords.angleWord:
				// check if angle is already defined
				if (poi.angleDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + poi.angle)];
				}
				// set angle
				poi.angle = this.waypointList[0].angle;
				poi.angleDefined = true;
				break;

			case Keywords.depthWord:
				// check if depth is already defined
				if (poi.depthDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + this.shortNumber(poi.depth, 1))];
				}
				// set depth
				poi.depth = this.waypointList[0].depth;
				poi.depthDefined = true;
				break;

			case Keywords.layersWord:
				// check if layers is already defined
				if (poi.layersDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + poi.layers)];
				}
				// set layers
				poi.layers = this.waypointList[0].layers;
				poi.layersDefined = true;
				break;

			case Keywords.themeWord:
				// check if theme is already defined
				if (poi.themeDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + poi.theme)];
				}
				// set theme
				poi.theme = this.waypointList[0].theme;
				poi.themeDefined = true;
				break;

			case Keywords.gpsWord:
				// check if gps is already defined
				if (poi.gpsDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + poi.gps)];
				}
				// set gps
				poi.gps = this.waypointList[0].gps;
				poi.gpsDefined = true;
				break;

			case Keywords.stepWord:
				// check if step is already defined
				if (poi.stepDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + poi.step)];
				}
				// set step
				poi.step = this.waypointList[0].step;
				poi.stepDefined = true;
				break;

			case Keywords.stopWord:
				// check if stop is already defined
				if (poi.stopGenDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + ((poi.stopGeneration === -1) ? "OFF" : poi.stopGeneration))];
				}
				// set stop
				poi.stopGeneration = this.waypointList[0].stopGeneration;
				poi.stopGenDefined = true;
				break;

			case Keywords.loopWord:
				// check if loop is already defined
				if (poi.loopGenDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + ((poi.loopGeneration === -1) ? "OFF" : poi.loopGeneration))];
				}
				// set loop
				poi.loopGeneration = this.waypointList[0].loopGeneration;
				poi.loopGenDefined = true;
				break;

			default:
				scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, "illegal command before " + Keywords.initialWord];
				break;
			}
		}
	};

	// copy all initial values into POI
	WaypointManager.prototype.copyInitialAll = function(poi, scriptErrors) {
		this.copyInitial(Keywords.xWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.yWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.zoomWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.angleWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.layersWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.depthWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.themeWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.gpsWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.stepWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.loopWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.stopWord, poi, scriptErrors, false);
	};

	// prepare waypoints for execution
	WaypointManager.prototype.prepare = function(scriptErrors) {
		var i = 0,
		    previous = null,
		    current = null,
		    waypointList = this.waypointList,
		    length = this.numWaypoints();

		// fill in missing items
		for (i = 1; i < length; i += 1) {
			// get the previous and current waypoint
			previous = waypointList[i - 1];
			current = waypointList[i];

			// fill in non-specified position
			if (!current.xDefined) {
				current.x = previous.x;
			}

			if (!current.yDefined) {
				current.y = previous.y;
			}

			// motion
			if (!current.xModeDefined) {
				current.xLinear = previous.xLinear;
			}
			if (!current.yModeDefined) {
				current.yLinear = previous.yLinear;
			}
			if (!current.zModeDefined) {
				current.zLinear = previous.zLinear;
			}

			// angle
			if (!current.angleDefined) {
				current.angle = previous.angle;
			}

			// zoom
			if (!current.zoomDefined) {
				current.zoom = previous.zoom;
			}

			// layers
			if (!current.layersDefined) {
				current.layers = previous.layers;
			}

			// depth
			if (!current.depthDefined) {
				current.depth = previous.depth;
			}

			// theme
			if (!current.themeDefined) {
				current.theme = previous.theme;
			}

			// gps
			if (!current.gpsDefined) {
				current.gps = previous.gps;
			}

			// step size
			if (!current.stepDefined) {
				current.step = previous.step;
			}

			// target generation
			if (!current.targetGenDefined) {
				current.targetGen = previous.targetGen;
			}
			else {
				// check it is later than the previous
				if (current.targetGen <= previous.targetGen) {
					scriptErrors[scriptErrors.length] = [Keywords.tWord + " " + current.targetGen, "target generation must be later than previous (" + previous.targetGen + ")"];
				}
			}

			// compute elapsed time
			if (current.targetTimeDefined) {
				// for time mode just add the previous
				current.targetTime = (current.targetTime * 1000) + previous.targetTime;
			}
			else {
				// for generation mode compute the time for this one and add previous
				current.targetTime = previous.targetTime + (current.targetGen - previous.targetGen) * 1000 / (current.gps * current.step);
			}

			// stars
			if (!current.starsDefined) {
				current.stars = previous.stars;
			}

			// grid
			if (!current.gridDefined) {
				current.grid = previous.grid;
			}
		}
	};

	// external interface
	window["Waypoint"] = Waypoint;
	window["WaypointManager"] = WaypointManager;
	window["WaypointConstants"] = WaypointConstants;
}
());

