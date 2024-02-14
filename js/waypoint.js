// LifeViewer Waypoint
// Handles the Waypoint system, Points-Of-Interest (POIs).
// Also handles annotations (Labels, Arrows and Polygons).

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
	function Waypoint(/** @type {WaypointManager} */ manager) {
		// save the manager
		/** @type {WaypointManager} */ this.manager = manager;

		// whether to save interval time
		/** @type {boolean} */ this.intervalTime = false;

		// whether waypoint is POI
		/** @type {boolean} */ this.isPOI = false;

		// whether to reset at POI
		/** @type {boolean} */ this.resetAtPOI = false;

		// whether to stop or play at POI
		/** @type {number} */ this.modeAtPOI = WaypointConstants.none;

		// POI transition speed
		/** @type {number} */ this.poiTransitionSpeed = WaypointConstants.poiDefaultSpeed;

		// STOP generation
		/** @type {number} */ this.stopGeneration = -1;

		// LOOP generation
		/** @type {number} */ this.loopGeneration = -1;

		// camera position
		/** @type {number} */ this.x = 0;
		/** @type {number} */ this.y = 0;

		// camera angle
		/** @type {number} */ this.angle = 0;

		// camera tilt
		/** @type {number} */ this.tilt = 0;

		// camera zoom
		/** @type {number} */ this.zoom = 1;

		// layers
		/** @type {number} */ this.layers = 1;

		// layer depth
		/** @type {number} */ this.depth = 1;

		// colour theme
		/** @type {number} */ this.theme = 0;

		// gps
		/** @type {number} */ this.gps = 60;

		// step size
		/** @type {number} */ this.step = 1;

		// target generation
		/** @type {number} */ this.targetGen = 0;

		// target time
		/** @type {number} */ this.targetTime = 0;

		// text message
		/** @type {string} */ this.textMessage = "";

		// whether to fit zoom
		/** @type {boolean} */ this.fitZoom = false;

		// flags for linear
		/** @type {boolean} */ this.xLinear = false;
		/** @type {boolean} */ this.yLinear = false;
		/** @type {boolean} */ this.zLinear = false;

		// stars
		/** @type {boolean} */ this.stars = false;

		// grid
		/** @type {boolean} */ this.grid = false;

		// flags for which items were defined
		/** @type {boolean} */ this.xDefined = false;
		/** @type {boolean} */ this.yDefined = false;
		/** @type {boolean} */ this.angleDefined = false;
		/** @type {boolean} */ this.tiltDefined = false;
		/** @type {boolean} */ this.zoomDefined = false;
		/** @type {boolean} */ this.layersDefined = false;
		/** @type {boolean} */ this.depthDefined = false;
		/** @type {boolean} */ this.themeDefined = false;
		/** @type {boolean} */ this.gpsDefined = false;
		/** @type {boolean} */ this.stepDefined = false;
		/** @type {boolean} */ this.stopGenDefined = false;
		/** @type {boolean} */ this.loopGenDefined = false;
		/** @type {boolean} */ this.targetGenDefined = false;
		/** @type {boolean} */ this.targetTimeDefined = false;
		/** @type {boolean} */ this.textDefined = false;
		/** @type {boolean} */ this.xModeDefined = false;
		/** @type {boolean} */ this.yModeDefined = false;
		/** @type {boolean} */ this.zModeDefined = false;
		/** @type {boolean} */ this.starsDefined = false;
		/** @type {boolean} */ this.gridDefined = false;

		// whether waypoint has been processed
		/** @type {boolean} */ this.processed = false;
	}

	// set a waypoint to the same as another waypoint
	Waypoint.prototype.set = function(/** @type {Waypoint} */ fromWaypoint) {
		// copy interval time
		this.intervalTime = fromWaypoint.intervalTime;

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

		// copy tilt
		this.tilt = fromWaypoint.tilt;

		// copy zoom
		this.zoom = fromWaypoint.zoom;

		// copy layers
		this.layers = fromWaypoint.layers;

		// copy depth
		this.depth = fromWaypoint.depth;

		// copy theme
		this.theme = fromWaypoint.theme;

		// copy gps and step
		this.gps = fromWaypoint.gps;
		this.step = fromWaypoint.step;

		// copy target generation and time
		this.targetGen = fromWaypoint.targetGen;
		this.targetTime = fromWaypoint.targetTime;

		// copy text message
		this.textMessage = fromWaypoint.textMessage;

		// copy stars
		this.stars = fromWaypoint.stars;

		// copy grid
		this.grid = fromWaypoint.grid;
	};

	// return action name as string
	/** @returns {string} */
	Waypoint.prototype.actionName = function() {
		var	/** @type {string} */ result = "";

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
	Waypoint.prototype.setPlayAction = function(/** @type {Array<Array<string,string>>} */ scriptErrors) {
		if (this.isPOI) {
			if (this.modeAtPOI !== WaypointConstants.none) {
				scriptErrors[scriptErrors.length] = [Keywords.poiPlayWord, "overwrites " + this.actionName()];
			}
			this.modeAtPOI = WaypointConstants.play;
		} else {
			scriptErrors[scriptErrors.length] = [Keywords.poiPlayWord, "only valid at POI"];
		}
	};

	// set stop action
	Waypoint.prototype.setStopAction = function(/** @type {Array<Array<string,string>>} */ scriptErrors) {
		if (this.isPOI) {
			if (this.modeAtPOI !== WaypointConstants.none) {
				scriptErrors[scriptErrors.length] = [Keywords.poiStopWord, "overwrites " + this.actionName()];
			}
			this.modeAtPOI = WaypointConstants.stop;
		} else {
			scriptErrors[scriptErrors.length] = [Keywords.poiStopWord, "only valid at POI"];
		}
	};

	// set reset action
	Waypoint.prototype.setResetAction = function(/** @type {Array<Array<string,string>>} */ scriptErrors) {
		if (this.isPOI) {
			if (this.resetAtPOI) {
				scriptErrors[scriptErrors.length] = [Keywords.poiResetWord, "already defined"];
			}
			this.resetAtPOI = true;
		} else {
			scriptErrors[scriptErrors.length] = [Keywords.poiResetWord, "only valid at POI"];
		}
	};

	// set transition speed
	Waypoint.prototype.setTransitionSpeed = function(/** @type {number} */ speed, /** @type {Array<Array<string,string>>} */ scriptErrors) {
		if (this.isPOI) {
			if (this.poiTransitionSpeed !== WaypointConstants.poiDefaultSpeed) {
				scriptErrors[scriptErrors.length] = [Keywords.poiTransWord + " " + speed, "overwrites " + this.poiTransitionSpeed];
			}
			this.poiTransitionSpeed = speed;
		} else {
			scriptErrors[scriptErrors.length] = [Keywords.poiTransWord, "only valid at POI"];
		}
	};

	// set a waypoint to an interpolation between two waypoints
	Waypoint.prototype.interpolate = function(/** @type {Waypoint} */ fromWaypoint, /** @type {Waypoint} */ toWaypoint, /** @type {number} */ elapsedTime) {
		// compute the time delta
		var	/** @type {number} */ startTime = fromWaypoint.targetTime + 0.0,
			/** @type {number} */ endTime = toWaypoint.targetTime + 0.0,

			// start and end angle for wrap around
			/** @type {number} */ startAngle = fromWaypoint.angle + 0.0,
			/** @type {number} */ endAngle = toWaypoint.angle + 0.0,

			// default to complete
			/** @type {number} */ percentLinearComplete = 1.0,
			/** @type {number} */ percentBezierComplete = 1.0,

			// x, y and zoom percent complete
			/** @type {number} */ percentXComplete = 1.0,
			/** @type {number} */ percentYComplete = 1.0,
			/** @type {number} */ percentZComplete = 1.0;

		// cap elapsed time to end time
		if (elapsedTime > endTime) {
			elapsedTime = endTime;
		}

		// check if this is a zero time waypoint
		if (endTime - startTime === ViewConstants.singleFrameMS) {
			startTime = endTime;
		}

		// compute percentage complete
		if (endTime !== startTime) {
			percentLinearComplete = Math.round(1000000 * ((elapsedTime - startTime) / (endTime - startTime))) / 1000000;  // TBD !!!
			percentBezierComplete = (this.manager.bezierX(percentLinearComplete, 0, 0, 1, 1)) + 0.0;
		}

		// check whether to use linear or bezier for x, y and zoom
		if (toWaypoint.xLinear || toWaypoint.fitZoom) {
			percentXComplete = percentLinearComplete;
		} else {
			percentXComplete = percentBezierComplete;
		}

		if (toWaypoint.yLinear || toWaypoint.fitZoom) {
			percentYComplete = percentLinearComplete;
		} else {
			percentYComplete = percentBezierComplete;
		}

		if (toWaypoint.zLinear || toWaypoint.fitZoom) {
			percentZComplete = percentLinearComplete;
		} else {
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
		} else {
			if (endAngle - startAngle < -180) {
				endAngle += 360;
			}
		}

		// interpolate angle
		this.angle = (startAngle + percentBezierComplete * (endAngle - startAngle)) % 360;

		// interpolate tilt
		this.tilt = fromWaypoint.tilt + percentBezierComplete * (toWaypoint.tilt - fromWaypoint.tilt);

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

		// set interval time
		this.intervalTime = toWaypoint.intervalTime;
	};

	// Polygon constructor
	/**
	 * @constructor
	 */
	function Polygon(/** @type {Array<number>} */ coords, /** @type {boolean} */ isFilled, /** @type {number} */ zoom, /** @type {number} */ minZoom, /** @type {number} */ maxZoom, /** @type {string} */ colour, /** @type {number} */ alpha, /** @type {number} */ size, /** @type {number} */ t1, /** @type {number} */ t2, /** @type {number} */ tFade,
			/** @type {number} */ angle, /** @type {boolean} */ angleLocked, /** @type {boolean} */ positionLocked, /** @type {number} */ tDistance, /** @type {number} */ dx, /** @type {number} */ dy, /** @type {boolean} */ shadow) {
		// shadow on/off
		/** @type {boolean} */ this.shadow = shadow;

		// coordinates
		/** @type {Array<number>} */ this.coords = coords;

		// whether filled
		/** @type {boolean} */ this.isFilled = isFilled;

		// zoom
		/** @type {number} */ this.zoom = zoom;

		// minimum zoom
		/** @type {number} */ this.minZoom = minZoom;

		// maximum zoom
		/** @type {number} */ this.maxZoom = maxZoom;

		// colour
		/** @type {string} */ this.colour = colour;

		// alpha
		/** @type {number} */ this.alpha = alpha;

		// size
		/** @type {number} */ this.size = size;

		// start generation
		/** @type {number} */ this.t1 = t1;

		// end generation
		/** @type {number} */ this.t2 = t2;

		// fade generations
		/** @type {number} */ this.tFade = tFade;

		// angle
		/** @type {number} */ this.angle = angle;

		// angle locked when camera rotated
		/** @type {boolean} */ this.angleLocked = angleLocked;

		// position locked when TRACK used
		/** @type {boolean} */ this.positionLocked = positionLocked;

		// target distance
		/** @type {number} */ this.tDistance = tDistance;

		// label movement vector
		/** @type {number} */ this.dx = dx;
		/** @type {number} */ this.dy = dy;

		// process zoom range
		if (this.maxZoom === -1000 && this.minZoom === -1000) {
			this.minZoom = this.zoom / 4;
			this.maxZoom = this.zoom * 4;
		}
	}

	// Arrow constructor
	/**
	 * @constructor
	 */
	function Arrow(/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {number} */ zoom, /** @type {number} */ minZoom, /** @type {number} */ maxZoom, /** @type {string} */ colour,
			/** @type {number} */ alpha, /** @type {number} */ size, /** @type {number} */ headMultiple, /** @type {number} */ t1, /** @type {number} */ t2, /** @type {number} */ tFade, /** @type {number} */ angle, /** @type {boolean} */ angleLocked, /** @type {boolean} */ positionLocked, /** @type {number} */ tDistance, /** @type {number} */ dx, /** @type {number} */ dy, /** @type {boolean} */ shadow) {
		// shadow on/off
		/** @type {boolean} */ this.shadow = shadow;

		// x1 position
		/** @type {number} */ this.x1 = x1;

		// y1 position
		/** @type {number} */ this.y1 = y1;

		// x2 position
		/** @type {number} */ this.x2 = x2;

		// y2 position
		/** @type {number} */ this.y2 = y2;

		// zoom
		/** @type {number} */ this.zoom = zoom;

		// minimum zoom
		/** @type {number} */ this.minZoom = minZoom;

		// maximum zoom
		/** @type {number} */ this.maxZoom = maxZoom;

		// colour
		/** @type {string} */ this.colour = colour;

		// alpha
		/** @type {number} */ this.alpha = alpha;

		// size
		/** @type {number} */ this.size = size;

		// head size as multiple of arrow length
		/** @type {number} */ this.headMultiple = headMultiple;

		// start generation
		/** @type {number} */ this.t1 = t1;

		// end generation
		/** @type {number} */ this.t2 = t2;

		// fade generations
		/** @type {number} */ this.tFade = tFade;

		// angle
		/** @type {number} */ this.angle = angle;

		// angle locked when camera rotated
		/** @type {boolean} */ this.angleLocked = angleLocked;

		// position locked when TRACK used
		/** @type {boolean} */ this.positionLocked = positionLocked;

		// target distance
		/** @type {number} */ this.tDistance = tDistance;

		// label movement vector
		/** @type {number} */ this.dx = dx;
		/** @type {number} */ this.dy = dy;

		// process zoom range
		if (this.maxZoom === -1000 && this.minZoom === -1000) {
			this.minZoom = this.zoom / 4;
			this.maxZoom = this.zoom * 4;
		}
	}

	// Label constructor
	/**
	 * @constructor
	 */
	function Label(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ zoom, /** @type {number} */ minZoom, /** @type {number} */ maxZoom, /** @type {string} */ colour, /** @type {number} */ alpha,
			/** @type {number} */ size, /** @type {boolean} */ sizeLocked, /** @type {number} */ t1, /** @type {number} */ t2, /** @type {number} */ tFade, /** @type {number} */ angle, /** @type {boolean} */ angleLocked, /** @type {boolean} */ positionLocked, /** @type {number} */ tDistance, /** @type {number} */ dx, /** @type {number} */ dy, /** @type {boolean} */ shadow, /** @type {number} */ justification) {
		// shadow on/off
		/** @type {boolean} */ this.shadow = shadow;

		// message
		/** @type {string} */ this.message = "";

		// whether message has population substitution
		/** @type {number} */ this.popSub = -1;

		// whether message has generation substitution
		/** @type {number} */ this.genSub = -1;

		// whether message has reverse generation substitution (for PCA and Margolus rules)
		/** @type {number} */ this.revSub = -1;

		// whether message has relative generation substitution
		/** @type {number} */ this.relGenSub = -1;

		// whether message has relative reverse generation substitution (for PCA and Margolus rules)
		/** @type {number} */ this.relRevSub = -1;

		// x position
		/** @type {number} */ this.x = x;

		// y position
		/** @type {number} */ this.y = y;

		// zoom
		/** @type {number} */ this.zoom = zoom;

		// minimum zoom
		/** @type {number} */ this.minZoom = minZoom;

		// maximum zoom
		/** @type {number} */ this.maxZoom = maxZoom; 

		// colour
		/** @type {string} */ this.colour = colour;

		// alpha
		/** @type {number} */ this.alpha = alpha;

		// size
		/** @type {number} */ this.size = size;

		// whether size locked
		/** @type {boolean} */ this.sizeLocked = sizeLocked;

		// start generation
		/** @type {number} */ this.t1 = t1;

		// end generation
		/** @type {number} */ this.t2 = t2;

		// fade generations
		/** @type {number} */ this.tFade = tFade;

		// angle
		/** @type {number} */ this.angle = angle;

		// angle locked when camera rotated
		/** @type {boolean} */ this.angleLocked = angleLocked;

		// position locked when TRACK used
		/** @type {boolean} */ this.positionLocked = positionLocked;

		// target distance
		/** @type {number} */ this.tDistance = tDistance;

		// label movement vector
		/** @type {number} */ this.dx = dx;
		/** @type {number} */ this.dy = dy;

		// process zoom range
		if (this.maxZoom === -1000 && this.minZoom === -1000) {
			this.minZoom = this.zoom / 4;
			this.maxZoom = this.zoom * 4;
		}

		// text justification
		this.justification = justification;
	}

	// WaypointManager constructor
	/**
	 * @constructor
	 */
	function WaypointManager() {
		// list of waypoints
		/** @type {Array<Waypoint>} */ this.waypointList = [];

		// list of points of interest
		/** @type {Array<Waypoint>} */ this.poiList = [];

		// list of labels
		/** @type {Array<Label>} */ this.labelList = [];

		// list of arrows
		/** @type {Array<Arrow>} */ this.arrowList = [];

		// list of polygons
		/** @type {Array<Polygon>} */ this.polyList = [];

		// current position
		/** @type {Waypoint} */ this.current = new Waypoint(this);

		// temporary start waypoint
		/** @type {Waypoint} */ this.tempStart = new Waypoint(this);

		// temporary end waypoint
		/** @type {Waypoint} */ this.tempEnd = new Waypoint(this);

		// whether using the temporary position
		/** @type {boolean} */ this.usingTemp = false;

		// waypoint index to return to after temporary glide
		/** @type {number} */ this.tempIndex = 0;

		// whether last waypoint has been reached
		/** @type {boolean} */ this.lastReached = false;

		// whether waypoints contain camera commands
		/** @type {boolean} */ this.hasCamera = false;
	}

	// create a polygon
	WaypointManager.prototype.createPolygon = function(/** @type {Array<number>} */ coords, /** @type {boolean} */ isFilled, /** @type {number} */ zoom, /** @type {number} */ minZoom, /** @type {number} */ maxZoom, /** @type {string} */ colour, /** @type {number} */ alpha,
			/** @type {number} */ size, /** @type {number} */ t1, /** @type {number} */ t2, /** @type {number} */ tFade, /** @type {number} */ angle, /** @type {boolean} */ angleLocked, /** @type {boolean} */ positionLocked, /** @type {number} */ tdistance, /** @type {number} */ dx, /** @type {number} */ dy, /** @type {boolean} */ shadow) {
		return new Polygon(coords, isFilled, zoom, minZoom, maxZoom, colour, alpha, size, t1, t2, tFade, angle, angleLocked, positionLocked, tdistance, dx, dy, shadow);
	};

	// clear all polygons
	WaypointManager.prototype.clearPolygons = function() {
		this.polyList = [];
	};

	// add a polygon to the list
	WaypointManager.prototype.addPolygon = function(/** @type {Polygon} */ polygon) {
		this.polyList[this.polyList.length] = polygon;
	};

	// return number of polygons
	/** @returns {number} */
	WaypointManager.prototype.numPolygons = function() {
		return this.polyList.length;
	};

	// create an arrow
	WaypointManager.prototype.createArrow = function(/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {number} */ zoom, /** @type {number} */ minZoom, /** @type {number} */ maxZoom, /** @type {string} */ colour,
			/** @type {number} */ alpha, /** @type {number} */ size, /** @type {number} */ headMultiple, /** @type {number} */ t1, /** @type {number} */ t2, /** @type {number} */ tFade, /** @type {number} */ angle, /** @type {boolean} */ angleLocked, /** @type {boolean} */ positionLocked, /** @type {number} */ tdistance, /** @type {number} */ dx, /** @type {number} */ dy, /** @type {boolean} */ shadow) {
		return new Arrow(x1, y1, x2, y2, zoom, minZoom, maxZoom, colour, alpha, size, headMultiple, t1, t2, tFade, angle, angleLocked, positionLocked, tdistance, dx, dy, shadow);
	};

	// clear all arrows
	WaypointManager.prototype.clearArrows = function() {
		this.arrowList = [];
	};

	// add an arrow to the list
	WaypointManager.prototype.addArrow = function(/** @type {Arrow} */ arrow) {
		this.arrowList[this.arrowList.length] = arrow;
	};

	// return number of arrows
	/** @returns {number} */
	WaypointManager.prototype.numArrows = function() {
		return this.arrowList.length;
	};

	// create a label
	WaypointManager.prototype.createLabel = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ zoom, /** @type {number} */ minZoom, /** @type {number} */ maxZoom, /** @type {string} */ colour, /** @type {number} */ alpha,
			/** @type {number} */ size, /** @type {boolean} */ sizeLocked, /** @type {number} */ t1, /** @type {number} */ t2, /** @type {number} */ tFade, /** @type {number} */ angle, /** @type {boolean} */ angleLocked, /** @type {boolean} */ positionLocked, /** @type {number} */ tdistance, /** @type {number} */ dx, /** @type {number} */ dy, /** @type {boolean} */ shadow, /** @type {number} */ justification) {
		return new Label(x, y, zoom, minZoom, maxZoom, colour, alpha, size, sizeLocked, t1, t2, tFade, angle, angleLocked, positionLocked, tdistance, dx, dy, shadow, justification);
	};

	// clear all labels
	WaypointManager.prototype.clearLabels = function() {
		this.labelList = [];
	};

	// add a label to the list
	WaypointManager.prototype.addLabel = function(/** @type {Label} */ label) {
		// check for generation or population substitution
		label.popSub = label.message.indexOf("#P");
		label.genSub = label.message.indexOf("#G");
		label.revSub = label.message.indexOf("#H");
		label.relGenSub = label.message.indexOf("#I");
		label.relRevSub = label.message.indexOf("#J");

		// add to label list
		this.labelList[this.labelList.length] = label;
	};

	// return number of labels
	/** @returns {number} */
	WaypointManager.prototype.numLabels = function() {
		return this.labelList.length;
	};

	// return number of annoations
	/** @returns {number} */
	WaypointManager.prototype.numAnnotations = function() {
		return this.numLabels() + this.numArrows() + this.numPolygons();
	};

	// reset all annotations
	WaypointManager.prototype.clearAnnotations = function() {
		this.clearLabels();
		this.clearArrows();
		this.clearPolygons();
	};

	// return given polygon as a text string line 1
	/** @returns {string} */
	WaypointManager.prototype.polyAsText1 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {Polygon} */ current = null,
			/** @type {string} */ posLocked = "";

		if (number >= 0 && number < this.polyList.length) {
			current = this.polyList[number];
			if (current.positionLocked) {
				posLocked = "*";
			}
			if (current.isFilled) {
				result = "FILL\t";
			} else {
				result = "LINE\t";
			}
			result += "X1" + posLocked + " " + current.coords[0] + "\tY1" + posLocked + " " + current.coords[1];
		}

		return result;
	};

	// return given polygon as a text string line 2
	/** @returns {string} */
	WaypointManager.prototype.polyAsText2 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {number} */ zoom = 0,
			/** @type {Polygon} */ current = null,
			/** @type {string} */ angLocked = "";

		if (number >= 0 && number < this.polyList.length) {
			current = this.polyList[number];
			zoom = current.zoom;
			if (zoom >= 0 && zoom < 1) {
				zoom = -1 / zoom;
			}
			if (current.angleLocked) {
				angLocked = "*";
			}
			result = "Z " + zoom.toFixed(1) + "\tA" + angLocked + " " + current.angle.toFixed(1);
		}

		return result;
	};

	// return given poly as a text string line 3
	/** @returns {string} */
	WaypointManager.prototype.polyAsText3 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {Polygon} */ current = null;

		if (number >= 0 && number < this.polyList.length) {
			current = this.polyList[number];
			result = "Alpha " + current.alpha.toFixed(1);
			if (current.t1 !== -1) {
				result += "\tT1 " + current.t1 + "\tT2 " + current.t2;
				if (current.tFade > 0) {
					result += "\tFade " + current.tFade;
				}
			}
		}

		return result;
	};

	// return polygon colour
	/** @returns {string} */
	WaypointManager.prototype.polygonColour = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "";

		if (number >= 0 && number < this.polyList.length) {
			result = this.polyList[number].colour;
		}

		return result;
	};

	// return given arrow as a text string line 1
	/** @returns {string} */
	WaypointManager.prototype.arrowAsText1 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {Arrow} */ current = null,
			/** @type {string} */ posLocked = "";

		if (number >= 0 && number < this.arrowList.length) {
			current = this.arrowList[number];
			if (current.positionLocked) {
				posLocked = "*";
			}
			result = "X1" + posLocked + " " + current.x1 + "\tY1" + posLocked + " " + current.y1;
			result += "\tX2" + posLocked + " " + current.x2 + "\tY2" + posLocked + " " + current.y2;
		}

		return result;
	};

	// return given arrow as a text string line 2
	/** @returns {string} */
	WaypointManager.prototype.arrowAsText2 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {number} */ zoom = 0,
			/** @type {Arrow} */ current = null,
			/** @type {string} */ angLocked = "";

		if (number >= 0 && number < this.arrowList.length) {
			current = this.arrowList[number];
			zoom = current.zoom;
			if (zoom >= 0 && zoom < 1) {
				zoom = -1 / zoom;
			}
			if (current.angleLocked) {
				angLocked = "*";
			}
			result = "Z " + zoom.toFixed(1) + "\tA" + angLocked + " " + current.angle.toFixed(1);
		}

		return result;
	};

	// return given arrow as a text string line 3
	/** @returns {string} */
	WaypointManager.prototype.arrowAsText3 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {Arrow} */ current = null;

		if (number >= 0 && number < this.arrowList.length) {
			current = this.arrowList[number];
			result = "Alpha " + current.alpha.toFixed(1);
			if (current.t1 !== -1) {
				result += "\tT1 " + current.t1 + "\tT2 " + current.t2;
				if (current.tFade > 0) {
					result += "\tFade " + current.tFade;
				}
			}
		}

		return result;
	};

	// return arrow colour
	/** @returns {string} */
	WaypointManager.prototype.arrowColour = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "";

		if (number >= 0 && number < this.arrowList.length) {
			result = this.arrowList[number].colour;
		}

		return result;
	};

	// return given label as a text string line 1
	/** @returns {string} */
	WaypointManager.prototype.labelAsText1 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {number} */ zoom = 0,
			/** @type {Label} */ current = null,
			/** @type {string} */ posLocked = "",
			/** @type {string} */ angLocked = "";

		if (number >= 0 && number < this.labelList.length) {
			current = this.labelList[number];
			zoom = current.zoom;
			if (zoom >= 0 && zoom < 1) {
				zoom = -1 / zoom;
			}
			if (current.positionLocked) {
				posLocked = "*";
			}
			if (current.angleLocked) {
				angLocked = "*";
			}
			result = "X" + posLocked + " " + current.x + "\tY" + posLocked + " " + current.y;
			result += "\tZ " + zoom.toFixed(1) + "\tA" + angLocked + " " + current.angle.toFixed(1);
		}

		return result;
	};

	// return given label as a text string line 2
	/** @returns {string} */
	WaypointManager.prototype.labelAsText2 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {Label} */ current = null;

		if (number >= 0 && number < this.labelList.length) {
			current = this.labelList[number];
			result = "Alpha " + current.alpha.toFixed(1);
			if (current.t1 !== -1) {
				result += "\tT1 " + current.t1 + "\tT2 " + current.t2;
				if (current.tFade > 0) {
					result += "\tFade " + current.tFade;
				}
			}
		}

		return result;
	};

	// return given label as a text string line 3
	/** @returns {string} */
	WaypointManager.prototype.labelAsText3 = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "",
			/** @type {Label} */ current = null;

		if (number >= 0 && number < this.labelList.length) {
			current = this.labelList[number];
			result = "Size " + current.size + "\t\"" + current.message + "\"";
		}

		return result;
	};

	// return label colour
	/** @returns {string} */
	WaypointManager.prototype.labelColour = function(/** @type {number} */ number) {
		var	/** @type {string} */ result = "";

		if (number >= 0 && number < this.labelList.length) {
			result = this.labelList[number].colour;
		}

		return result;
	};

	// sort labels into zoom order for depth drawing
	WaypointManager.prototype.sortLabels = function() {
		this.labelList.sort(function(/** @type {Label} */ a, /** @type {Label} */ b) { return a.zoom - b.zoom; });
	};

	// sort arrows into zoom order for depth drawing
	WaypointManager.prototype.sortArrows = function() {
		this.arrowList.sort(function(/** @type {Arrow} */ a, /** @type {Arrow} */ b) { return a.zoom - b.zoom; });
	};

	// sort polygons into zoom order for depth drawing
	WaypointManager.prototype.sortPolygons = function() {
		this.polyList.sort(function(/** @type {Polygon} */ a, /** @type {Polygon} */ b) { return a.zoom - b.zoom; });
	};

	// sort annotations into zoom order for depth drawing
	WaypointManager.prototype.sortAnnotations = function() {
		this.sortLabels();
		this.sortArrows();
		this.sortPolygons();
	};

	// draw arrows
	WaypointManager.prototype.drawArrowsLayer = function(/** @type {View} */ view, /** @type {boolean} */ drawingShadows) {
		var	/** @type {number} */ i = 0,
			/** @type {Arrow} */ current = null,
			/** @type {Life} */ engine = view.engine,
			/** @type {CanvasRenderingContext2D} */ context = engine.context,
			/** @type {number} */ xOff = engine.width / 2 - engine.xOff - engine.originX,
			/** @type {number} */ yOff = engine.height / 2 - engine.yOff - engine.originY,
			/** @type {number} */ xZoom = engine.zoom * engine.originZ,
			/** @type {number} */ yZoom = engine.getYZoom(engine.zoom),
			/** @type {number} */ halfDisplayWidth = engine.displayWidth / 2,
			/** @type {number} */ halfDisplayHeight = engine.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @type {number} */ cx2 = 0,
			/** @type {number} */ cy2 = 0,
			/** @type {number} */ currentSize = 0,
			/** @type {number} */ linearZoom = 1,
			/** @type {number} */ alphaValue = 1,
			/** @type {number} */ timeAlpha = 1,
			/** @type {number} */ distAlpha = 1,
			/** @type {number} */ counter = view.engine.counter,
			/** @type {boolean} */ inrange = false,
			/** @type {number} */ radius = 0,
			/** @type {number} */ theta = 0,
			/** @type {number} */ rangeFromTarget = 0,
			/** @type {number} */ hexAdjust = engine.isHex ? -(engine.height >> 2) : 0,
			/** @type {number} */ headSize = 0,
			/** @type {number} */ headAngle = 0,
			/** @type {number} */ shadowOffset = 0,
			/** @type {number} */ tilt = engine.tilt,
			/** @type {number} */ mode7Angle = tilt - 1,
			/** @type {number} */ currentX1 = 0,
			/** @type {number} */ currentY1 = 0,
			/** @type {number} */ currentX2 = 0,
			/** @type {number} */ currentY2 = 0,
			/** @type {number} */ pz = 1,
			/** @type {number} */ xLeft = 0,
			/** @type {number} */ yLeft = 0,
			/** @type {number} */ xRight = 0,
			/** @type {number} */ yRight = 0,
			/** @type {number} */ floatCounter = view.fixedPointCounter / view.refreshRate;

		// adjust for hex
		if (engine.isHex) {
			xOff += yOff / 2;
		}

		// use the shadow colour if drawing shadows
		if (drawingShadows) {
			context.strokeStyle = ViewConstants.arrowShadowColour;
		}

		// draw each arrow
		for (i = 0; i < this.arrowList.length; i += 1) {
			// get the next arrow
			current = this.arrowList[i];
			currentX1 = current.x1;
			currentY1 = current.y1;
			currentX2 = current.x2;
			currentY2 = current.y2;

			// adjust position if in bounded grid
			if (view.engine.boundedGridType !== -1) {
				currentX1 += view.patternWidth >> 1;
				currentY1 += view.patternHeight >> 1;
				currentX2 += view.patternWidth >> 1;
				currentY2 += view.patternHeight >> 1;
			}

			// skip if drawing shadows layer and this arrow has no shadow
			if (drawingShadows && !current.shadow) continue;

			// check if the arrow has a defined generation range
			inrange = true;
			if (current.t1 !== -1) {
				// check if current generation is within the defined range
				if (counter < current.t1 || counter > current.t2) {
					inrange = false;
				}
			}

			// continue if in generation range
			if (inrange) {
				// scale the arrow based on the zoom
				currentSize = (current.size * xZoom / current.zoom);

				// adjust the shadow offset if drawing shadows
				if (drawingShadows) {
					shadowOffset = 1;
					if (currentSize >= 24) {
						shadowOffset = 2;
						if (currentSize >= 48) {
							shadowOffset = 3;
						}
					}
				}

				// do not draw if too big or too small
				if (xZoom >= current.minZoom && xZoom <= current.maxZoom) {
					// convert zoom into a linear range
					linearZoom = Math.log(xZoom / current.minZoom) / Math.log(current.maxZoom / current.minZoom);

					// make more transparent if in bottom or top 20% of linear range
					if (linearZoom <= 0.25) {
						alphaValue = linearZoom * 4;
					} else {
						if (linearZoom >= 0.75) {
							alphaValue = (1 - linearZoom) * 4;
						} else {
							alphaValue = 1;
						}
					}

					// if in a generation range then fade if near limits
					timeAlpha = 1;
					if (current.t1 !== -1 && current.tFade > 0) {
						if (counter - current.t1 < current.tFade) {
							timeAlpha = (counter - current.t1 + 1) / current.tFade;
						} else {
							if (current.t2 - counter < current.tFade) {
								timeAlpha = (current.t2 - counter + 1) / current.tFade;
							}
						}
					}

					// check if the target is set
					inrange = true;
					distAlpha = 1;
					if (current.tDistance !== -1) {
						rangeFromTarget = view.getDistFromCenter(currentX1, currentY1);
						if (rangeFromTarget > current.tDistance) {
							inrange = false;
						} else {
							// fade towards the maximum distance
							if (current.tDistance > 0) {
								if (rangeFromTarget / current.tDistance > 0.75) {
									distAlpha = 4 * (1 - (rangeFromTarget / current.tDistance));
								}
							}
						}
					}

					// set the alpha
					if (inrange) {
						context.globalAlpha = alphaValue * current.alpha * timeAlpha * distAlpha;

						// get arrow start position
						cy = currentY1 + yOff - (view.patternHeight >> 1) + 0.5;
						cx = currentX1 + xOff + hexAdjust - (view.patternWidth >> 1) + 0.5;

						// check for fixed position
						if (!current.positionLocked) {
							cx += engine.originX;
							cy += engine.originY;
						}

						// add movement
						if (current.t1 !== -1) {
							cx += current.dx * (floatCounter - current.t1);
							cy += current.dy * (floatCounter - current.t1);
						} else {
							cx += current.dx * floatCounter;
							cy += current.dy * floatCounter;
						}

						// check for camera rotation
						if (engine.camAngle !== 0) {
							// compute radius
							radius = Math.sqrt((cx * cx) + (cy * cy));

							// apply angle
							theta = Math.atan2(cy, cx) * (180 / Math.PI);

							// add current rotation
							theta += engine.camAngle;

							// compute rotated position
							cx = radius * Math.cos(theta * (Math.PI / 180));
							cy = radius * Math.sin(theta * (Math.PI / 180));
						}

						// adjust for hex
						if (engine.isHex) {
							cx -= cy / 2;
						}

						// draw the arrow
						y = (cy * yZoom) + halfDisplayHeight;
						x = (cx * xZoom) + halfDisplayWidth;
						cx2 = (currentX2 - currentX1) * xZoom;
						cy2 = (currentY2 - currentY1) * yZoom;
						if (engine.isHex) {
							cx2 -= cy2 / 2;
						}

						// compute arrow head size
						if (current.headMultiple === 0) {
							headSize = 0;
						} else {
							headSize = Math.sqrt((cx2 * cx2) + (cy2 * cy2)) * current.headMultiple;
						}

						// check for tilt
						if (tilt !== 0) {
							pz = -mode7Angle + (mode7Angle * 2 + 2) / engine.displayHeight * (engine.displayHeight - y);
							y = (((y - halfDisplayHeight) / pz) + halfDisplayHeight);
							x = (((x - halfDisplayWidth) / pz) + halfDisplayWidth);
						}

						// check annotation is on display
						if (pz >= 0) {
							// rotate context for drawing
							context.save();
							context.translate(x, y);
							context.scale(1 / pz, 1 / pz);
							theta = current.angle;
							if (!current.angleLocked) {
								theta += engine.camAngle;
							}
							context.rotate(theta / 180 * Math.PI);

							// set line width
							context.lineWidth = currentSize;

							// set line colour if not drawing shadows
							if (!drawingShadows) {
								context.strokeStyle = current.colour;
							}

							// set round line cap and join
							context.lineCap = "round";
							context.lineJoin = "round";

							// compute the head position
							if (headSize > 0) {
								headAngle = Math.atan2(cy2, cx2);
								xLeft = Math.cos(Math.PI * 0.85 + headAngle);
								yLeft = Math.sin(Math.PI * 0.85 + headAngle);
								xRight = Math.cos(-Math.PI * 0.85 + headAngle);
								yRight = Math.sin(-Math.PI * 0.85 + headAngle);
							}

							// draw arrow layer
							if (shadowOffset > 0) {
								context.translate(shadowOffset, shadowOffset);
							}
							context.beginPath();
							context.moveTo(0, 0);
							context.lineTo(cx2, cy2);
							if (headSize > 0) {
								context.moveTo(cx2, cy2);
								context.lineTo(cx2 + headSize * xLeft, cy2 + headSize * yLeft);
								context.moveTo(cx2, cy2);
								context.lineTo(cx2 + headSize * xRight, cy2 + headSize * yRight);
							}
							context.stroke();

							// restore context
							context.restore();
						}
					}
				}
			}
		}

		// restore alpha
		context.globalAlpha = 1;
	};

	// draw arrows
	WaypointManager.prototype.drawArrows = function(/** @type {View} */ view) {
		// draw shadows
		this.drawArrowsLayer(view, true);

		// draw arrows
		this.drawArrowsLayer(view, false);
	};

	// draw polygons
	WaypointManager.prototype.drawPolygonsLayer = function(/** @type {View} */ view, /** @type {boolean} */ drawingShadows) {
		var	/** @type {number} */ i = 0,
			/** @type {Polygon} */ current = null,
			/** @type {Life} */ engine = view.engine,
			/** @type {CanvasRenderingContext2D} */ context = engine.context,
			/** @type {number} */ xOff = engine.width / 2 - engine.xOff - engine.originX,
			/** @type {number} */ yOff = engine.height / 2 - engine.yOff - engine.originY,
			/** @type {number} */ xZoom = engine.zoom * engine.originZ,
			/** @type {number} */ yZoom = engine.getYZoom(engine.zoom),
			/** @type {number} */ halfDisplayWidth = engine.displayWidth / 2,
			/** @type {number} */ halfDisplayHeight = engine.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @type {number} */ cx2 = 0,
			/** @type {number} */ cy2 = 0,
			/** @type {number} */ currentSize = 0,
			/** @type {number} */ linearZoom = 1,
			/** @type {number} */ alphaValue = 1,
			/** @type {number} */ timeAlpha = 1,
			/** @type {number} */ distAlpha = 1,
			/** @type {number} */ counter = view.engine.counter,
			/** @type {boolean} */ inrange = false,
			/** @type {number} */ radius = 0,
			/** @type {number} */ theta = 0,
			/** @type {number} */ rangeFromTarget = 0,
			/** @type {number} */ hexAdjust = engine.isHex ? -(engine.height >> 2) : 0,
			/** @type {number} */ tilt = engine.tilt,
			/** @type {number} */ mode7Angle = tilt - 1,
			/** @type {number} */ pz = 1,
			/** @type {number} */ shadowOffset = 0,
			/** @type {number} */ boundedDx = 0,
			/** @type {number} */ boundedDy = 0,
			/** @type {Array<number>} */ coords = [],
			/** @type {number} */ length = 0,
			/** @type {number} */ coord = 0,
			/** @type {number} */ floatCounter = view.fixedPointCounter / view.refreshRate;

		// use the shadow colour if drawing shadows
		if (drawingShadows) {
			context.strokeStyle = ViewConstants.polyShadowColour;
			context.fillStyle = ViewConstants.polyShadowColour;
		}

		// adjust for hex
		if (engine.isHex) {
			xOff += yOff / 2;
		}

		// get bounded box offset
		if (view.engine.boundedGridType !== -1) {
			boundedDx = view.patternWidth >> 1;
			boundedDy = view.patternHeight >> 1;
		}

		// draw each polygon
		for (i = 0; i < this.polyList.length; i += 1) {
			// get the next polygon
			current = this.polyList[i];
			coords = current.coords;
			length = coords.length;

			// skip if drawing shadows layer and this arrow has no shadow
			if (drawingShadows && !current.shadow) continue;

			// check if the polygon has a defined generation range
			inrange = true;
			if (current.t1 !== -1) {
				// check if current generation is within the defined range
				if (counter < current.t1 || counter > current.t2) {
					inrange = false;
				}
			}

			// continue if in generation range
			if (inrange) {
				// scale the polygon based on the zoom
				currentSize = (current.size * xZoom / current.zoom);

				// adjust the shadow offset if drawing shadows
				if (drawingShadows) {
					shadowOffset = 1;
					if (currentSize >= 24) {
						shadowOffset = 2;
						if (currentSize >= 48) {
							shadowOffset = 3;
						}
					}
				}

				// do not draw if too big or too small
				if (xZoom >= current.minZoom && xZoom <= current.maxZoom) {
					// convert zoom into a linear range
					linearZoom = Math.log(xZoom / current.minZoom) / Math.log(current.maxZoom / current.minZoom);

					// make more transparent if in bottom or top 20% of linear range
					if (linearZoom <= 0.25) {
						alphaValue = linearZoom * 4;
					} else {
						if (linearZoom >= 0.75) {
							alphaValue = (1 - linearZoom) * 4;
						} else {
							alphaValue = 1;
						}
					}

					// if in a generation range then fade if near limits
					timeAlpha = 1;
					if (current.t1 !== -1 && current.tFade > 0) {
						if (counter - current.t1 < current.tFade) {
							timeAlpha = (counter - current.t1 + 1) / current.tFade;
						} else {
							if (current.t2 - counter < current.tFade) {
								timeAlpha = (current.t2 - counter + 1) / current.tFade;
							}
						}
					}

					// check if the target is set
					inrange = true;
					distAlpha = 1;
					if (current.tDistance !== -1) {
						rangeFromTarget = view.getDistFromCenter(current.coords[0] + boundedDx, current.coords[1] + boundedDy);
						if (rangeFromTarget > current.tDistance) {
							inrange = false;
						} else {
							// fade towards the maximum distance
							if (current.tDistance > 0) {
								if (rangeFromTarget / current.tDistance > 0.75) {
									distAlpha = 4 * (1 - (rangeFromTarget / current.tDistance));
								}
							}
						}
					}

					// set the alpha
					if (inrange) {
						context.globalAlpha = alphaValue * current.alpha * timeAlpha * distAlpha;

						// get polygon start position
						coord = 0;
						cx = coords[coord] + boundedDx + xOff + hexAdjust - (view.patternWidth >> 1) + 0.5;
						cy = coords[coord + 1] + boundedDy + yOff - (view.patternHeight >> 1) + 0.5;
						coord += 2;

						// check for fixed position
						if (!current.positionLocked) {
							cx += engine.originX;
							cy += engine.originY;
						}

						// add movement
						if (current.t1 !== -1) {
							cx += current.dx * (floatCounter - current.t1);
							cy += current.dy * (floatCounter - current.t1);
						} else {
							cx += current.dx * floatCounter;
							cy += current.dy * floatCounter;
						}

						// check for camera rotation
						if (engine.camAngle !== 0) {
							// compute radius
							radius = Math.sqrt((cx * cx) + (cy * cy));

							// apply angle
							theta = Math.atan2(cy, cx) * (180 / Math.PI);

							// add current rotation
							theta += engine.camAngle;

							// compute rotated position
							cx = radius * Math.cos(theta * (Math.PI / 180));
							cy = radius * Math.sin(theta * (Math.PI / 180));
						}

						// adjust for hex
						if (engine.isHex) {
							cx -= cy / 2;
						}

						// draw the polygon
						y = (cy * yZoom) + halfDisplayHeight;
						x = (cx * xZoom) + halfDisplayWidth;

						// check for tilt
						if (tilt !== 0) {
							pz = -mode7Angle + (mode7Angle * 2 + 2) / engine.displayHeight * (engine.displayHeight - y);
							y = (((y - halfDisplayHeight) / pz) + halfDisplayHeight);
							x = (((x - halfDisplayWidth) / pz) + halfDisplayWidth);
						}

						// check annotation is on display
						if (pz >= 0) {
							cx2 = (coords[coord] - coords[0]) * xZoom / pz;
							cy2 = (coords[coord + 1] - coords[1]) * yZoom / pz;
							if (engine.isHex) {
								cx2 -= cy2 / 2;
							}
							coord += 2;

							// rotate context for drawing
							context.save();
							context.translate(x, y);
							context.scale(1 / pz, 1 / pz);
							theta = current.angle;
							if (!current.angleLocked) {
								theta += engine.camAngle;
							}
							context.rotate(theta / 180 * Math.PI);

							// set line width
							context.lineWidth = currentSize;

							// set line colour if not drawing shadows
							if (!drawingShadows) {
								if (current.isFilled) {
									context.fillStyle = current.colour;
								} else {
									context.strokeStyle = current.colour;
								}
							}

							// set round line cap and join
							context.lineCap = "round";
							context.lineJoin = "round";

							// draw polygon layer
							if (shadowOffset > 0) {
								context.translate(shadowOffset, shadowOffset);
							}
							context.beginPath();
							context.moveTo(0, 0);
							context.lineTo(cx2, cy2);
							while (coord < length) {
								cx2 = (coords[coord] - coords[0]) * xZoom / pz;
								cy2 = (coords[coord + 1] - coords[1]) * yZoom / pz;
								if (engine.isHex) {
									cx2 -= cy2 / 2;
								}
								coord += 2;
								context.lineTo(cx2, cy2);
							}
							if (current.isFilled) {
								context.fill();
							} else {
								context.stroke();
							}

							// restore context
							context.restore();
						}
					}
				}
			}
		}

		// restore alpha
		context.globalAlpha = 1;
	};

	// draw polygons
	WaypointManager.prototype.drawPolygons = function(/** @type {View} */ view) {
		// draw shadows
		this.drawPolygonsLayer(view, true);

		// draw arrows
		this.drawPolygonsLayer(view, false);
	};

	// draw labels
	WaypointManager.prototype.drawLabels = function(/** @type {View} */ view) {
		var	/** @type {number} */ i = 0,
			/** @type {Label} */ current = null,
			/** @type {Life} */ engine = view.engine,
			/** @type {CanvasRenderingContext2D} */ context = engine.context,
			/** @type {number} */ xPos = 0,
			/** @type {number} */ maxXPos = 0,
			/** @type {number} */ xOff = engine.width / 2 - engine.xOff - engine.originX,
			/** @type {number} */ yOff = engine.height / 2 - engine.yOff - engine.originY,
			/** @type {number} */ xZoom = engine.zoom * engine.originZ,
			/** @type {number} */ yZoom = engine.getYZoom(engine.zoom),
			/** @type {number} */ halfDisplayWidth = engine.displayWidth / 2,
			/** @type {number} */ halfDisplayHeight = engine.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @type {number} */ currentSize = 0,
			/** @type {string} */ shadowColour = ViewConstants.labelShadowColour,
			/** @type {string} */ fontEnd = "px " + ViewConstants.labelFontFamily,
			/** @type {number} */ linearZoom = 1,
			/** @type {number} */ alphaValue = 1,
			/** @type {number} */ timeAlpha = 1,
			/** @type {number} */ distAlpha = 1,
			/** @type {number} */ index = 0,
			/** @type {string} */ message = "",
			/** @type {string} */ line = "",
			/** @type {number} */ counter = view.engine.counter,
			/** @type {boolean} */ inrange = false,
			/** @type {number} */ radius = 0,
			/** @type {number} */ theta = 0,
			/** @type {number} */ shadowOffset = 0,
			/** @type {number} */ rangeFromTarget = 0,
			/** @type {number} */ tilt = engine.tilt,
			/** @type {number} */ mode7Angle = tilt - 1,
			/** @type {number} */ pz = 1,
			/** @type {number} */ currentX = 0,
			/** @type {number} */ currentY = 0,
			/** @type {number} */ currentAlign = 0,
			/** @type {number} */ hexAdjust = engine.isHex ? -(engine.height >> 2) : 0,
			/** @type {number} */ floatCounter = view.fixedPointCounter / view.refreshRate;

		// adjust for hex
		if (engine.isHex) {
			xOff += yOff / 2;
		}

		// draw each label
		for (i = 0; i < this.labelList.length; i += 1) {
			// get the next label
			current = this.labelList[i];
			currentX = current.x;
			currentY = current.y;
			currentAlign = current.justification;

			// adjust position if in bounded grid
			if (view.engine.boundedGridType !== -1) {
				currentX += view.patternWidth >> 1;
				currentY += view.patternHeight >> 1;
			}

			// check if the label has a defined generation range
			inrange = true;
			if (current.t1 !== -1) {
				// check if current generation is within the defined range
				if (counter < current.t1 || counter > current.t2) {
					inrange = false;
				}
			}

			// continue if in generation range
			if (inrange) {
				// get the label font size
				if (current.sizeLocked) {
					currentSize = current.size;
				} else {
					// scale font size based on zoom
					currentSize = (current.size * xZoom / current.zoom);
				}
				shadowOffset = 1;
				if (currentSize >= 24) {
					shadowOffset = 2;
					if (currentSize >= 48) {
						shadowOffset = 3;
					}
				}

				// do not draw if too big or too small
				if (xZoom >= current.minZoom && xZoom <= current.maxZoom) {
					// convert zoom into a linear range
					linearZoom = Math.log(xZoom / current.minZoom) / Math.log(current.maxZoom / current.minZoom);
					context.font = currentSize + fontEnd;

					// make more transparent if in bottom or top 25% of linear range
					if (linearZoom <= 0.25) {
						alphaValue = linearZoom * 4;
					} else {
						if (linearZoom >= 0.75) {
							alphaValue = (1 - linearZoom) * 4;
						} else {
							alphaValue = 1;
						}
					}

					// if in a generation range then fade if near limits
					timeAlpha = 1;
					if (current.t1 !== -1 && current.tFade > 0) {
						if (counter - current.t1 < current.tFade) {
							timeAlpha = (counter - current.t1 + 1) / current.tFade;
						} else {
							if (current.t2 - counter < current.tFade) {
								timeAlpha = (current.t2 - counter + 1) / current.tFade;
							}
						}
					}

					// check if the target is set
					inrange = true;
					distAlpha = 1;
					if (current.tDistance !== -1) {
						rangeFromTarget = view.getDistFromCenter(currentX, currentY);
						if (rangeFromTarget > current.tDistance) {
							inrange = false;
						} else {
							// fade towards the maximum distance
							if (current.tDistance > 0) {
								if (rangeFromTarget / current.tDistance > 0.75) {
									distAlpha = 4 * (1 - (rangeFromTarget / current.tDistance));
								}
							}
						}
					}

					// set the alpha
					if (inrange) {
						context.globalAlpha = alphaValue * current.alpha * timeAlpha * distAlpha;

						// get label position
						cx = currentX + xOff + hexAdjust - (view.patternWidth >> 1) + 0.5;
						cy = currentY + yOff - (view.patternHeight >> 1) + 0.5;

						// check for fixed position
						if (!current.positionLocked) {
							cx += engine.originX;
							cy += engine.originY;
						}

						// add movement
						if (current.t1 !== -1) {
							cx += current.dx * (floatCounter - current.t1);
							cy += current.dy * (floatCounter - current.t1);
						} else {
							cx += current.dx * floatCounter;
							cy += current.dy * floatCounter;
						}

						// check for camera rotation
						if (engine.camAngle !== 0) {
							// compute radius
							radius = Math.sqrt((cx * cx) + (cy * cy));

							// apply angle
							theta = Math.atan2(cy, cx) * (180 / Math.PI);

							// add current rotation
							theta += engine.camAngle;

							// compute rotated position
							cx = radius * Math.cos(theta * (Math.PI / 180));
							cy = radius * Math.sin(theta * (Math.PI / 180));
						}

						// adjust for hex
						if (engine.isHex) {
							cx -= cy / 2;
						}

						// draw each line of the label
						message = current.message;

						// add generation if required
						if (current.genSub !== -1) {
							message = message.substring(0, current.genSub) + view.engine.counter + message.substring(current.genSub + 2);

							// if other substitutions also exist then recalculate position since it will have changed
							if (current.popSub !== -1) {
								current.popSub = message.indexOf("#P");
							}
							if (current.revSub !== -1) {
								current.revSub = message.indexOf("#H");
							}
							if (current.relGenSub !== -1) {
								current.relGenSub = message.indexOf("#I");
							}
							if (current.relRevSub !== -1) {
								current.relRevSub = message.indexOf("#J");
							}
						}

						// add population if required
						if (current.popSub !== -1) {
							message = message.substring(0, current.popSub) + view.engine.population + message.substring(current.popSub + 2);

							// if other subsistutions also exist then recalculate
							if (current.revSub !== -1) {
								current.revSub = message.indexOf("#H");
							}
							if (current.relGenSub !== -1) {
								current.relGenSub = message.indexOf("#I");
							}
							if (current.relRevSub !== -1) {
								current.relRevSub = message.indexOf("#J");
							}
						}

						// add reverse generation if required
						if (current.revSub !== -1) {
							if (view.engine.isMargolus || view.engine.isPCA) {
								message = message.substring(0, current.revSub) + view.engine.counterMargolus + message.substring(current.revSub + 2);
							} else {
								message = message.substring(0, current.revSub) + view.engine.counter + message.substring(current.revSub + 2);
							}
							if (current.relGenSub !== -1) {
								current.relGenSub = message.indexOf("#I");
							}
							if (current.relRevSub !== -1) {
								current.relRevSub = message.indexOf("#J");
							}
						}

						// add relative generation if required
						if (current.relGenSub !== -1) {
							message = message.substring(0, current.relGenSub) + (view.engine.counter + view.genOffset) + message.substring(current.relGenSub + 2);
							if (current.relRevSub !== -1) {
								current.relRevSub = message.indexOf("#J");
							}
						}

						// add relative reverse generation if reuqired
						if (current.relRevSub !== -1) {
							if (view.engine.isMargolus || view.engine.isPCA) {
								message = message.substring(0, current.relRevSub) + (view.engine.counterMargolus + view.genOffset) + message.substring(current.relRevSub + 2);
							} else {
								message = message.substring(0, current.relRevSub) + (view.engine.counter + view.genOffset) + message.substring(current.relRevSub + 2);
							}
						}

						index = message.indexOf("\\n");
						y = (cy * yZoom) + halfDisplayHeight;
						x = (cx * xZoom) + halfDisplayWidth;

						// check for tilt
						if (tilt !== 0) {
							pz = -mode7Angle + (mode7Angle * 2 + 2) / engine.displayHeight * (engine.displayHeight - y);
							y = (((y - halfDisplayHeight) / pz) + halfDisplayHeight);
							x = (((x - halfDisplayWidth) / pz) + halfDisplayWidth);
						}

						// check annotation is on display
						if (pz >= 0) {
							// rotate context for drawing
							context.save();
							context.translate(x, y);
							context.scale(1/ pz, 1 / pz);
							theta = current.angle;
							if (!current.angleLocked) {
								theta += engine.camAngle;
							}
							context.rotate(theta / 180 * Math.PI);
							y = 0;

							// check text alignment
							if (currentAlign === ViewConstants.labelMiddle) {
								// center text
								while (index !== -1) {
									// get the next line
									line = message.substring(0, index);
									message = message.substring(index + 2);
	
									// measure text line width
									xPos = context.measureText(line).width >> 1;
	
									// draw shadow
									if (current.shadow) {
										context.fillStyle = shadowColour;
										context.fillText(line, -xPos + shadowOffset, y + shadowOffset);
									}
	
									// draw message
									context.fillStyle = current.colour;
									context.fillText(line, -xPos, y);
	
									// compute y coordinate for next text line
									y += currentSize;
	
									// check for more lines
									index = message.indexOf("\\n");
								}
	
								// measure final text line width
								xPos = context.measureText(message).width >> 1;

								// draw shadow
								if (current.shadow) {
									context.fillStyle = shadowColour;
									context.fillText(message, -xPos + shadowOffset, y + shadowOffset);
								}
	
								// draw message
								context.fillStyle = current.colour;
								context.fillText(message, -xPos, y);
							} else {
								// left or right alignment so find longest string
								maxXPos = 0;
								while (index !== -1) {
									// get the next line
									line = message.substring(0, index);
									message = message.substring(index + 2);

									// measure text line width
									xPos = context.measureText(line).width >> 1;
									if (xPos > maxXPos) {
										maxXPos = xPos;
									}

									index = message.indexOf("\\n");
								}

								// measure final text line width
								xPos = context.measureText(message).width >> 1;
								if (xPos > maxXPos) {
									maxXPos = xPos;
								}

								// now draw the labels
								message = current.message;
								index = message.indexOf("\\n");

								while (index !== -1) {
									// get the next line
									line = message.substring(0, index);
									message = message.substring(index + 2);

									if (currentAlign === ViewConstants.labelRight) {
										xPos = context.measureText(line).width;
									}

									// draw shadow
									if (current.shadow) {
										context.fillStyle = shadowColour;
										if (currentAlign === ViewConstants.labelLeft) {
											context.fillText(line, -maxXPos + shadowOffset, y + shadowOffset);
										} else {
											context.fillText(line, maxXPos - xPos + shadowOffset, y + shadowOffset);
										}
									}
	
									// draw message
									context.fillStyle = current.colour;
									if (currentAlign === ViewConstants.labelLeft) {
										context.fillText(line, -maxXPos, y);
									} else {
										context.fillText(line, maxXPos - xPos, y);
									}
	
									// compute y coordinate for next text line
									y += currentSize;
	
									// check for more lines
									index = message.indexOf("\\n");
								}

								if (currentAlign === ViewConstants.labelRight) {
									xPos = context.measureText(message).width;
								}

								// draw shadow
								if (current.shadow) {
									context.fillStyle = shadowColour;
									if (currentAlign === ViewConstants.labelLeft) {
										context.fillText(message, -maxXPos + shadowOffset, y + shadowOffset);
									} else {
										context.fillText(message, maxXPos - xPos + shadowOffset, y + shadowOffset);
									}
								}
	
								// draw message
								context.fillStyle = current.colour;
								if (currentAlign === ViewConstants.labelLeft) {
									context.fillText(message, -maxXPos, y);
								} else {
									context.fillText(message, maxXPos - xPos, y);
								}
							}

							// restore context
							context.restore();
						}
					}
				}
			}
		}

		// restore alpha
		context.globalAlpha = 1;
	};

	// draw annotations
	WaypointManager.prototype.drawAnnotations = function(/** @type {View} */ view) {
		this.drawPolygons(view);
		this.drawArrows(view);
		this.drawLabels(view);
	};

	// process step back
	WaypointManager.prototype.steppedBack = function(/** @type {number} */ elapsedTime) {
		var	/** @type {number} */ i = 0,
			/** @type {Waypoint} */ current = null;

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
		var	/** @type {number} */ i;

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
	/** @returns {number} */
	WaypointManager.prototype.bezierX = function(/** @type {number} */ t, /** @type {number} */ x0, /** @type {number} */ x1, /** @type {number} */ x2, /** @type {number} */ x3) {
		// compute coefficients
		var	/** @type {number} */ cX = 3 * (x1 - x0),
			/** @type {number} */ bX = 3 * (x2 - x1) - cX,
			/** @type {number} */ aX = x3 - x0 - cX - bX,

			// compute the x position
			/** @type {number} */ x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + x0;

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
	/** @returns {Waypoint} */
	WaypointManager.prototype.lastWaypoint = function() {
		return this.waypointList[this.waypointList.length - 1];
	};

	// return time to a given generation
	/** @returns {number} */
	WaypointManager.prototype.elapsedTimeTo = function(/** @type {number } */ generation) {
		var	/** @type {number} */ result = 0,

		    // find the closest waypoint to the generation
		    /** @type {number} */ index = this.findWaypointNear(generation),

		    // get the waypoint
		    /** @type {Waypoint} */ waypoint = this.waypointList[index],
		    /** @type {Waypoint} */ previous = null;

		// check if the generation is beyond the waypoint
		if (generation > waypoint.targetGen) {
			// return the time to waypoint plus time at final gps to the generation
			result = waypoint.targetTime + (generation - waypoint.targetGen) * 1000 / (waypoint.gps * waypoint.step);
		} else {
			// check if there is a previous waypoint
			if (index > 0) {
				// get the previous waypoint
				previous = this.waypointList[index - 1];

				// return the time to the previous waypoint plus time at current gps to the generation
				result = previous.targetTime + (generation - previous.targetGen) * 1000 / (waypoint.gps * waypoint.step);
			} else {
				// return the time at current gps to the generation
				result = generation * 1000 / (waypoint.gps * waypoint.step);
			}
		}

		// return the elapsed time
		return result;
	};

	// create temporary position
	/** @returns {number}  */
	WaypointManager.prototype.createTemporaryPosition = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ zoom, /** @type {number} */ angle, /** @type {number} */ tilt, /** @type {number} */ layers, /** @type {number} */ depth, /** @type {number} */ theme, /** @type {number} */ gps, /** @type {number} */ step, /** @type {number} */ generation, /** @type {number} */ elapsedTime) {
		// get the temporary start waypoint
		var	/** @type {Waypoint} */ temp = this.tempStart,
			/** @type {number} */ result = 0;

		// set temporary waypoint from the supplied parameters
		temp.x = x;
		temp.y = y;
		temp.zoom = zoom;
		temp.angle = angle;
		temp.tilt = tilt;
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
		this.update(null, elapsedTime, generation, true);

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
	/** @returns {Waypoint} */
	WaypointManager.prototype.firstWaypoint = function() {
		// return the first waypoint
		return this.waypointList[0];
	};

	// return the number of points of interests
	/** @returns {number} */
	WaypointManager.prototype.numPOIs = function() {
		return this.poiList.length;
	};

	// return the number of waypoints
	/** @returns {number} */
	WaypointManager.prototype.numWaypoints = function() {
		return this.waypointList.length;
	};

	// add a waypoint to the manager
	WaypointManager.prototype.add = function(/** @type {Waypoint} */ waypoint, /** @type {View} */ view) {
		// check if this is a waypoint or a point of interest
		if (waypoint.isPOI) {
			// add the waypoint to the end of the POI list
			this.poiList[this.poiList.length] = waypoint;
		} else {
			// add the waypoint to the end of the waypoint list
			this.waypointList[this.waypointList.length] = waypoint;

			// check if the waypoint controls the camera
			if (waypoint.xDefined || waypoint.yDefined || waypoint.zoomDefined || waypoint.angleDefined || waypoint.tiltDefined || waypoint.fitZoom) {
				this.hasCamera = true;
			}

			// convert the step and gps into a playback speed
			if (waypoint.gpsDefined || waypoint.stepDefined) {
				// if just gens per second defined then default step to 1x
				if (waypoint.gpsDefined && !waypoint.stepDefined) {
					waypoint.step = ViewConstants.minStepSpeed;
				}

				// if step defined then default gens per second
				if (waypoint.stepDefined) {
					waypoint.gps = view.refreshRate;
				}
			}
		}
	};

	// check if at or beyond last waypoint
	/** @returns {boolean} */
	WaypointManager.prototype.atLast = function(/** @type {number} */ elapsedTime) {
		var	/** @type {boolean} */ result = false;

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
	/** @returns {string} */
	WaypointManager.prototype.shortNumber = function(/** @type {number} */ i, /** @type {number} */ places) {
		var	/** @type {string} */ result = "";

		// check if number is an integer
		if (i === (i | 0)) {
			// return integer version
			result = String(i | 0);
		} else {
			// return fixed point version
			result = String(i.toFixed(places));
		}

		return result;
	};

	// output a point of interest camera position as text
	/** @returns {string} */
	WaypointManager.prototype.poiCameraAsText = function(/** @type {number} */ i) {
		// build the text
		var	/** @type {string} */ text = "",
			/** @type {Waypoint} */ poi = null;

		// check whether the requested POI exists
		if (i >= 0 && i < this.numPOIs()) {
			// get the POI
			poi = this.poiList[i];

			// get the coordinates
			if (poi.xDefined) {
				text += " X " + -poi.x;
			}
			if (poi.yDefined) {
				text += " Y " + -poi.y;
			}

			// get the zoom and angle
			if (poi.zoomDefined) {
				text += " ZOOM " + this.shortNumber(poi.zoom, 1);
			}
			if (poi.angleDefined) {
				text += " ANGLE " + poi.angle;
			}
			if (poi.tiltDefined && poi.tilt !== 0) {
				text += " TILT " + poi.tilt;
			}
		}

		// return the text
		return text.substring(1);
	};

	// output a point of interest loop, stop, gps and step as text
	/** @returns {string} */
	WaypointManager.prototype.poiLoopStopGpsStepAsText = function(/** @type {number} */ i) {
		// build the text
		var	/** @type {string} */ text = "",
			/** @type {Waypoint} */ poi = null;

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
		return text.substring(1);
	};

	// output a point of interest action as text
	/** @returns {string} */
	WaypointManager.prototype.poiActionAsText = function(/** @type {number} */ i) {
		// build the text
		var	/** @type {string} */ text = "",
			/** @type {Waypoint} */ poi = null;

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
			} else {
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
		return text.substring(1);
	};

	// output a point of interest theme, depth and layer as text
	/** @returns {string} */
	WaypointManager.prototype.poiThemeDepthLayerAsText = function(/** @type {number} */ i) {
		// build the text
		var	/** @type {string} */ text = "",
			/** @type {Waypoint} */ poi = null;

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
		return text.substring(1);
	};

	// output a point of interest start generation as text
	/** @returns {string} */
	WaypointManager.prototype.poiStartGenAsText = function(/** @type {number} */ i) {
		/* eslint-enable no-unused-vars */
		// build the text
		var	/** @type {string} */ text = "",
			/** @type {Waypoint} */ poi = null;

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
		return text.substring(1);
	};

	// output a point of interest message as text
	/** @returns {string} */
	WaypointManager.prototype.poiMessageAsText = function(/** @type {number} */ i, /** @type {string} */ stringDelimiter) {
		// build the text
		var	/** @type {string} */ text = "",
			/** @type {Waypoint} */ poi = null;

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
		return text.substring(1);
	};

	// output a waypoint as text
	/** @returns {string} */
	WaypointManager.prototype.waypointAsText = function(/** @type {number} */ i, /** @type {string} */ stringDelimiter) {
		// build the text
		var	/** @type {string} */ text = "",

			// requested waypoint and previous waypoint
			/** @type {Waypoint} */ requested = null,
			/** @type {Waypoint} */ previous = null;

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
				} else {
					text = "T " + requested.targetGen;
				}

				// output changes
				if (requested.fitZoom) {
					text += " F";
				} else {
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
			} else {
				// create the text from the single waypoint
				text = "T " + requested.targetGen + " X " + -requested.x + " Y " + -requested.y + " Z " + this.shortNumber(requested.zoom, 1) + " A " + requested.angle + " L " + requested.layers + " D " + this.shortNumber(requested.depth, 1) + " C "  + requested.theme + " G " + requested.gps + " S " + requested.step;
			}
		}

		// return the text
		return text;
	};

	// update the current position and return whether waypoints ended
	/** @returns {boolean} */
	WaypointManager.prototype.update = function(/** @type {View} */ view, /** @type {number} */ elapsedTime, /** @type {number} */ generation, /** @type {boolean} */ interpolate) {
		var	/** @type {number} */ length = this.waypointList.length,
			/** @type {boolean} */ found = false,
			/** @type {number} */ i = this.tempIndex,
			/** @type {number} */ origI = i,
			/** @type {Waypoint} */ current = null,

			// set waypoints not ended
			/** @type {boolean} */ result = false;

		// check if using temporary waypoints
		if (this.usingTemp) {
			// interpolate between temporary waypoints
			this.current.interpolate(this.tempStart, this.tempEnd, elapsedTime);
			if (elapsedTime >= this.tempEnd.targetTime) {
				this.usingTemp = false;
			}
		} else {
			// find the last waypoint below the elapsed time
			while (i < length && !found) {
				current = this.waypointList[i];
				if (current.targetTime >= elapsedTime || !current.processed) {
					// result is previous waypoint
					found = true;
				} else {
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
			} else {
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
					if (interpolate) {
						this.current.interpolate(this.waypointList[i - 1], this.waypointList[i], elapsedTime);
					}
				} else {
					// at first waypoint
					i = 0;

					// just use first waypoint
					this.current.set(this.waypointList[i]);
				}
			}

			// save current index
			this.tempIndex = i;
		}

		// check if the waypoint changed
		if (this.tempIndex !== origI) {
			// check if saving interval time
			if (this.current.intervalTime && view) {
				// add the inteval time to the list
				view.menuManager.addTimeInterval();
			}
		}

		// return flag indicating whether waypoints ended
		return result;
	};

	// return the index of the closest waypoint to a generation
	/** @returns {number} */
	WaypointManager.prototype.findWaypointNear = function(/** @type {number} */ generation) {
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false,
			/** @type {Array<Waypoint>} */ waypointList = this.waypointList,
			/** @type {number} */ length = this.numWaypoints();

		// find the waypoint at or beyond the specified generation
		while (i < length && !found) {
			if (waypointList[i].targetGen >= generation) {
				// found the waypoint
				found = true;
			} else {
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
	/** @returns {number} */
	WaypointManager.prototype.findClosestWaypoint = function(/** @type {number} */ generation) {
		var	/** @type {number} */ elapsed = 0,
			/** @type {number} */ generations = 0,
			/** @type {number} */ result = 0,
			/** @type {Waypoint} */ currWP,
			/** @type {Waypoint} */ prevWP;

		// save the index of the closest waypoint
		this.tempIndex = this.findWaypointNear(generation);

		// interpolate elapsed time
		if (this.tempIndex > 0) {
			currWP = this.waypointList[this.tempIndex];
			prevWP = this.waypointList[this.tempIndex - 1];
			elapsed = currWP.targetTime - prevWP.targetTime;
			generations = currWP.targetGen - prevWP.targetGen;
			result = (elapsed * (generation - prevWP.targetGen) / generations) + prevWP.targetTime;
		}

		return result;
	};

	// copy a single initial value into POI
	WaypointManager.prototype.copyInitial = function(/** @type {string} */ what, /** @type {Waypoint} */ poi, /** @type {Array<Array<string,string>>} */ scriptErrors, /** @type {boolean} */ initialDefined) {
		// check there is an initial waypoint
		if (this.numWaypoints() === 0) {
			scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, "no initial waypoint defined"];
		} else {
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

			case Keywords.tiltWord:
				// check if tilt is already defined
				if (poi.tiltDefined) {
					scriptErrors[scriptErrors.length] = [what + " " + Keywords.initialWord, (initialDefined ? "already defined" : "overwrites " + poi.tilt)];
				}
				// set tilt
				poi.tilt = this.waypointList[0].tilt;
				poi.tiltDefined = true;
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
	WaypointManager.prototype.copyInitialAll = function(/** @type {Waypoint} */ poi, /** @type {Array<Array<string,string>>} */ scriptErrors) {
		this.copyInitial(Keywords.xWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.yWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.zoomWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.angleWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.tiltWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.layersWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.depthWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.themeWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.gpsWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.stepWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.loopWord, poi, scriptErrors, false);
		this.copyInitial(Keywords.stopWord, poi, scriptErrors, false);
	};

	// prepare waypoints for execution
	WaypointManager.prototype.prepare = function(/** @type {Array<Array<string,string>>} */ scriptErrors, /** @type {View} */ view) {
		var	/** @type {number} */ i = 0,
			/** @type {Waypoint} */ previous = null,
			/** @type {Waypoint} */ current = null,
			/** @type {Array<Waypoint>} */ waypointList = this.waypointList,
			/** @type {number} */ length = this.numWaypoints();

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

			// tilt
			if (!current.tiltDefined) {
				current.tilt = previous.tilt;
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

			// convert the step and gps into a playback speed
			if (current.gpsDefined || current.stepDefined) {
				// if just gens per second defined then default step to 1x
				if (current.gpsDefined && !current.stepDefined) {
					current.step = ViewConstants.minStepSpeed;
				}

				// if step defined then default gens per second
				if (current.stepDefined) {
					current.gps = view.refreshRate;
				}
			}

			// target generation
			if (!current.targetGenDefined) {
				current.targetGen = previous.targetGen;
			} else {
				// check it is later than the previous
				if (current.targetGen <= previous.targetGen) {
					scriptErrors[scriptErrors.length] = [Keywords.tWord + " " + current.targetGen, "target generation must be later than previous (" + previous.targetGen + ")"];
				}
			}

			// compute elapsed time
			if (current.targetTimeDefined) {
				// for time mode just add the previous
				current.targetTime = (current.targetTime * 1000) + previous.targetTime;
			} else {
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
