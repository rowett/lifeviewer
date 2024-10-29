// Pattern decoder
// Supports decoding various pattern formats: Cells, Life 1.05, Life 1.06, and RLE.
// Also handles fetching RuleTable rules from a remote repository.

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

	// RuleTreeCache singleton
	var RuleTreeCache = {
		// list of rules
		/** @type {Array} */ rules : [],

		// meta data
		/** @type {Array} */ meta : [],

		// list of pending requests
		/** @type {Array} */ requests : [],

		// definitions
		/** @type {Array} */ definitions : []
	};

	// add a request to the cache
	/** @returns {boolean} */
	RuleTreeCache.addRequest = function(/** @type {Pattern} */ pattern, /** @type {null|function(Pattern,Array,View):void} */ succeedCallback, /** @type {null|function(Pattern,Array,View):void} */ failCallback, /** @type {Array} */ args, /** @type {View} */ view) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ l = this.requests.length,
			request = null,
			/** @type {boolean} */ found = false,
			/** @type {string} */ name = pattern.ruleName.toLowerCase();

		// convert spaces to underscores
		name = name.replace(/ /g, "_");

		// check if the rule already exists
		i = 0;
		while (i < l && !found) {
			request = this.requests[i];
			if (request.name === name) {
				found = true;
				// add callbacks to the existing record
				request.pattern[request.pattern.length] = pattern;
				request.succeedCallback[request.succeedCallback.length] = succeedCallback;
				request.failCallback[request.failCallback.length] = failCallback;
				request.args[request.args.length] = args;
				request.view[request.view.length] = view;
			} else {
				i += 1;
			}
		}

		// add if not found
		if (!found) {
			this.requests[l] = {name: name, pattern: [pattern], succeedCallback: [succeedCallback], failCallback: [failCallback], args: [args], view: [view]};
		}

		// return whether there was already a request for the rule
		return found;
	};

	// get definition for a named rule
	/** @returns {string} */
	RuleTreeCache.getDefinition = function(/** @type {string} */ name) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ l = this.definitions.length,
			/** @type {boolean} */ found = false,
			/** @type {string} */ result = "";

		name = name.toLowerCase();
		// convert spaces to underscores
		name = name.replace(/ /g, "_");

		while (i < l && !found) {
			if (this.definitions[i].name === name) {
				found = true;
				result = this.definitions[i].definition;
			} else {
				i += 1;
			}
		}

		return result;
	};

	// check if all requests are completed
	RuleTreeCache.checkRequestsCompleted = function() {
		var	/** @type {number} */ i = 0,
			/** @type {boolean} */ complete = true;

		// check for any requests that are not complete
		for (i = 0; i < this.requests.length; i += 1) {
			if (this.requests[i].name !== "") {
				complete = false;
			}
		}

		// if complete then check for overview mode
		if (complete && Controller.overview && Controller.viewers.length > 0) {
			if (Controller.viewers[0][1]) {
				Controller.viewers[0][1].initOverview();
			}
		}
	};

	// remove a request from the cache
	RuleTreeCache.removeRequest = function(/** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ l = this.requests.length,
			request = null,
			/** @type {boolean} */ found = false,
			/** @type {string} */ name = pattern.ruleName.toLowerCase();

		// convert spaces to underscores
		name = name.replace(/ /g, "_");

		// check if the rule already exists
		i = 0;
		while (i < l && !found) {
			request = this.requests[i];
			if (request.name === name) {
				found = true;
				// remove the request name
				request.name = "";

				// call the success callback on requesters
				for (j = 0; j < request.succeedCallback.length; j += 1) {
					if (request.succeedCallback[j] !== null) {
						this.loadIfExists(request.pattern[j]);
						request.pattern[j].manager.failureReason = "";
						request.pattern[j].manager.executable = true;
						request.pattern[j].manager.extendedFormat = false;
						request.succeedCallback[j](request.pattern[j], request.args[j], request.view[j]);
					}
				}
			} else {
				i += 1;
			}
		}

		// check if all requests have now been processed
		this.checkRequestsCompleted();
	};

	// process a failed request 
	RuleTreeCache.requestFailed = function(/** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ l = this.requests.length,
			request = null,
			/** @type {boolean} */ found = false,
			/** @type {string} */ name = pattern.ruleName.toLowerCase();

		// convert spaces to underscores
		name = name.replace(/ /g, "_");

		// check if the rule already exists
		i = 0;
		while (i < l && !found) {
			request = this.requests[i];
			if (request.name === name) {
				found = true;

				// remove the request
				request.name = "";

				// call the fail callback on requesters
				for (j = 0; j < request.failCallback.length; j += 1) {
					if (request.failCallback[j] !== null) {
						request.pattern[j].isHROT = request.pattern[j].wasHROT;
						request.failCallback[j](request.pattern[j], request.args[j], request.view[j]);
					}
				}
			} else {
				i += 1;
			}
		}

		// check if all requests have now been processed
		this.checkRequestsCompleted();
	};

	// add a new rule to the cache
	RuleTreeCache.add = function(/** @type {Pattern} */ pattern, /** @type {number} */ fetchTime, /** @type {number} */ decodeTime, /** @type {number} */ ruleSize, /** @type {string} */ definition, /** @type {boolean} */ ruleTableB0) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ l = this.rules.length,
			/** @type {boolean} */ found = false,
			/** @type {string} */ name = pattern.ruleName.toLowerCase();

		// convert spaces to underscores
		name = name.replace(/ /g, "_");

		// check if the rule already exists
		i = 0;
		while (i < l && !found) {
			if (this.rules[i].name === name) {
				found = true;
			} else {
				i += 1;
			}
		}

		// add if not found
		if (!found) {
			// create rule record
			if (pattern.ruleTableOutput === null) {
				// add @TREE
				this.rules[l] = {name: name, isTree: true, states: pattern.ruleTreeStates, neighbours: pattern.ruleTreeNeighbours,
					nodes: pattern.ruleTreeNodes, base: pattern.ruleTreeBase, ruleA: pattern.ruleTreeA,
					ruleB: pattern.ruleTreeB, colours: pattern.ruleTreeColours, icons: pattern.ruleTableIcons,
					names: pattern.ruleTableNames, isHex: pattern.ruleTreeIsHex, b0: ruleTableB0};
			} else {
				// add @TABLE
				this.rules[l] = {name: name, isTree: false, states: pattern.ruleTableStates, neighbourhood: pattern.ruleTableNeighbourhood,
					compressed: pattern.ruleTableCompressedRules, output: pattern.ruleTableOutput,
					LUT: pattern.ruleTableLUT, colours: pattern.ruleTreeColours, dups: pattern.ruleTableDups,
					icons: pattern.ruleTableIcons, names: pattern.ruleTableNames, b0: ruleTableB0};
			}

			// create metadata
			this.meta[l] = {fetch: fetchTime | 0, decode: decodeTime | 0, size: ruleSize};

			// create definition
			this.definitions[l] = {name: name, definition: definition};

			// remove the rule from the request list
			this.removeRequest(pattern);
		}
	};

	// populate a pattern from the rule cache
	RuleTreeCache.loadIfExists = function(/** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ l = this.rules.length,
			record = null,
			/** @type {boolean} */ found = false,
			/** @type {string} */ name = pattern.ruleName.toLowerCase();

		// convert spaces to underscores
		name = name.replace(/ /g, "_");

		// check if the rule exists
		i = 0;
		while (i < l && !found) {
			if (this.rules[i].name === name) {
				found = true;
				record = this.rules[i];
			} else {
				i += 1;
			}
		}

		// populate pattern from the cache if found
		if (found) {
			// clear pattern record first
			pattern.ruleTableOutput = null;

			// load retrieved record
			if (record.isTree) {
				pattern.ruleTreeStates = record.states;
				pattern.ruleTreeNeighbours = record.neighbours;
				pattern.ruleTreeNodes = record.nodes;
				pattern.ruleTreeBase = record.base;
				pattern.ruleTreeA = record.ruleA;
				pattern.ruleTreeB = record.ruleB;
				pattern.isHex = record.isHex;
			} else {
				pattern.ruleTableStates = record.states;
				pattern.ruleTableNeighbourhood = record.neighbourhood;
				pattern.ruleTableCompressedRules = record.compressed;
				pattern.ruleTableOutput = record.output;
				pattern.ruleTableLUT = record.LUT;
				pattern.ruleTableDups = record.dups;
				if (pattern.ruleTableNeighbourhood === PatternConstants.ruleTableHex) {
					pattern.isHex = true;
				} else {
					pattern.isHex = false;
				}
			}
			pattern.ruleTreeColours = record.colours;
			pattern.ruleTableIcons = record.icons;
			pattern.ruleTableNames = record.names;
			pattern.isNone = false;
			pattern.manager.ruleTableB0 = record.b0;
		}

		// return whether populated
		return found;
	};

	// Life 1.05 section
	/**
	 * @constructor
	 */
	function Life105Section(/** @type {number} */ startX, /** @type {number} */ startY, /** @type {number} */ width, /** @type {number} */ height, /** @type {number} */ startPos, /** @type {number} */ endPos) {
		/** @type {number} */ this.startX = startX;
		/** @type {number} */ this.startY = startY;
		/** @type {number} */ this.width = width;
		/** @type {number} */ this.height = height;
		/** @type {number} */ this.startPos = startPos;
		/** @type {number} */ this.endPos = endPos;
	}

	// cells decoder
	var Cells = {
		// magic header
		/** @const {string} */ magic1 : "!",
		/** @const {string} */ magic2 : "O",
		/** @const {string} */ magic3 : ".",
		/** @const {string} */ magic4 : "*",
		/** @const {string} */ magic5 : "o"
	},

	// Life 1.05 decoder
	Life105 = {
		// magic header
		/** @const {string} */ magic : "#Life 1.05"
	},

	// Life 1.06 decoder
	Life106 = {
		// magic header
		/** @const {string} */ magic : "#Life 1.06"
	};

	// pattern constants
	var PatternConstants = {
		// table section neighbourhood indices (must be in the same order as strings above)
		/** @const {number} */ ruleTableVN : 0,
		/** @const {number} */ ruleTableMoore : 1,
		/** @const {number} */ ruleTableHex : 2,
		/** @const {number} */ ruleTableOneD : 3,

		// icons section built-in icon sets
		/** @const {number} */ ruleTableIconNone : -1,
		/** @const {number} */ ruleTableIconCircles : 0,
		/** @const {number} */ ruleTableIconDiamonds : 1,
		/** @const {number} */ ruleTableIconHexagons : 2,
		/** @const {number} */ ruleTableIconTriangles : 3,

		/** @const {Array<string>} */ ruleTableIconNames : ["circles", "diamonds", "hexagons", "triangles"]
	};

	// pattern manager
	/**
	 * @constructor
	 */
	function PatternManager() {
		// timing
		/** @type {number} */ this.time = 0;

		/** @type {boolean} */ this.wolframEmulation = false;

		// whether attempting to load from repository
		/** @type {boolean} */ this.loadingFromRepository = false;

		// illegal state found (rule is valid but pattern is not)
		/** @type {boolean} */ this.illegalState = false;

		// rule search name
		/** @type {string} */ this.ruleSearchName = "";

		// rule search URI
		/** @type {string} */ this.ruleSearchURI = "";

		// RuleTable repository end tag
		/** @const {string} */ this.ruleSearchEndTag = "<!--";

		// _none_ rule (must be lower case)
		/** @const {string} */ this.noneRuleName = "none";

		// PCA rule prefix (must be lower case)
		/** @const {string} */ this.pcaRulePrefix = "2pca4";

		// base64 digits
		/** @const {string} */ this.base64Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

		// hex digits
		/** @const {string} */ this.hexCharacters = "0123456789abcdef";

		// number of base64 characters in 512bit (Moore) map string
		/** @const {number} */ this.map512Length = 86;

		// number of base64 characters in 128bit (hexagonal) map string
		/** @const {number} */ this.map128Length = 22;

		// number of base64 characters in 32bit (von Neumann) map string
		/** @const {number} */ this.map32Length = 6;

		// number of neighbours for MAP rule
		/** @type {number} */ this.mapNeighbours = 8;

		// extended command prefix
		/** @const {string} */ this.extendedPrefix = "XRLE";

		// pos command
		/** @const {string} */ this.posCommand = "Pos";

		// gen command
		/** @const {string} */ this.genCommand = "Gen";

		// decode failure reason
		/** @type {string} */ this.failureReason = "";

		// bounded grid prefix
		/** @const {string} */ this.boundedGridPrefix = ":";

		// valid bounded grid types
		/** @const {string} */ this.boundedGridTypes = "ptkcs";

		// maximum bounded grid shift
		/** @const {number} */ this.maximumShift = 1000000;

		// vadlid rule characters (digits must come first)
		/** @const {string} */ this.validRuleLetters = "012345678ceaiknjqrytwz-";

		// decimal digits
		/** @const {string} */ this.decimalDigits = "0123456789";

		// valid triangular rule characters
		/** @const {string} */ this.validTriangularRuleLetters = "0123456789xyz";

		// valid triangular Edges rule characters
		/** @const {string} */ this.validTriangularEdgesRuleLetters = "0123";

		// valid triangular Vertices rule characters
		/** @const {string} */ this.validTriangularVerticesRuleLetters = "0123456789";

		// valid triangular Inner rule characters
		/** @const {string} */ this.validTriangularInnerRuleLetters = "0123456";

		// valid triangular Outer rule characters
		/** @const {string} */ this.validTriangularOuterRuleLetters = "0123456";

		// valid triangular Biohazard rule characters
		/** @const {string} */ this.validTriangularBiohazardRuleLetters = "0123456789";

		// valid triangular Radiation rule characters
		/** @const {string} */ this.validTriangularRadiationRuleLetters = "0123";

		// triangular mask
		/** @const {number} */ this.triangularMask = 8191;

		// triangular Edges mask
		/** @const {number} */ this.triangularEdgesMask = 1038;

		// triangular Vertices mask
		/** @const {number} */ this.triangularVerticesMask = 7157;

		// triangular Inner mask
		/** @const {number} */ this.triangularInnerMask = 5454;

		// triangular Outer mask
		/** @const {number} */ this.triangularOuterMask = 2741;

		// triangular Biohazard mask
		/** @const {number} */ this.triangularBiohazardMask = 3775;

		// triangular Radiation mask
		/** @const {number} */ this.triangularRadiationMask = 4420;

		// valid hex tripod rule characters
		/** @const {string} */ this.validHexTripodRuleLetters = "0123";

		// valid hex rule characters
		/** @const {string} */ this.validHexRuleLetters = "0123456omp-";

		// von neumann digits
		/** @const {string} */ this.vonNeumannDigits = "01234";

		// rule letters
		/** @const {Array<string>} */ this.ruleLetters = ["ce", "ceaikn", "ceaiknjqry", "ceaiknjqrytwz"];

		// rule hex letters
		/** @const {string} */ this.ruleHexLetters = "omp";

		// rule hex neighborhoods
		/** @const {Array<Array<Array<number>>>} */ this.ruleHexNeighbourhoods = [
															[[6, 36, 160, 192, 72, 10], [132, 96, 136, 66, 12, 34], [68, 40, 130]],
															[[38, 164, 224, 200, 74, 14], [44, 162, 196, 104, 138, 70, 100, 168, 194, 76, 42, 134], [140, 98]],
															[[166, 228, 232, 202, 78, 46], [172, 226, 204, 106, 142, 102], [108, 170, 198]]
														];

		// valid letters per digit
		/** @const {Array<string>} */ this.validLettersPerDigit = ["", "ce", "ceaikn", "ceaiknjqry", "ceaiknjqrytwz", "ceaiknjqry", "ceaikn", "ce", ""];

		// valid hex letters per digit
		/** @const {Array<string>} */ this.validHexLettersPerDigit = ["", "", "omp", "omp", "omp", "", ""];

		// maximum number of letters for each neighbour count
		/** @const {Array<number>} */ this.maxLetters = [0, 2, 6, 10, 13, 10, 6, 2, 0];

		// order of letters for canonical format
		/** @const {Array<Array<number>>} */ this.orderLetters = [[0], [0, 1], [2, 0, 1, 3, 4, 5], [2, 0, 1, 3, 6, 4, 5, 7, 8, 9] , [2, 0, 1, 3, 6, 4, 5, 7, 8, 10, 11, 9, 12], [2, 0, 1, 3, 6, 4, 5, 7, 8, 9], [2, 0, 1, 3, 4, 5], [0, 1], [0]];

		// rule neighbourhoods
		/** @const {Array<Array<number>>} */ this.ruleNeighbourhoods = [[1, 2], [5, 10, 3, 40, 33, 68], [69, 42, 11, 7, 98, 13, 14, 70, 41, 97], [325, 170, 15, 45, 99, 71, 106, 102, 43, 101, 105, 78, 108]];

		// negative bit in letters bitmask
		/** @const {number} */ this.negativeBit = 13;

		// maximum width and height of patterns
		/** @const {number} */ this.maxWidth = 16384;
		/** @const {number} */ this.maxHeight = 16384;

		// maxmimum states
		/** @const {number} */ this.maxStates = 256;

		// state count
		/** @type {Uint32Array} */ this.stateCount = new Uint32Array(256);

		// 8192 bit triangular rule
		/** @type {Uint8Array} */ this.ruleTriangularArray = new Uint8Array(8192);

		// 8192 bit triangular alternate rule
		/** @type {Uint8Array} */ this.ruleAltTriangularArray = new Uint8Array(8192);

		// 512 bit rule
		/** @type {Uint8Array} */ this.ruleArray = new Uint8Array(512);

		// 512 bit alternate rule
		/** @type {Uint8Array} */ this.ruleAltArray = new Uint8Array(512);

		// swap array
		/** @type {Uint16Array} */ this.swapArray = new Uint16Array(512);

		// whether pattern is executable
		/** @type {boolean} */ this.executable = false;

		// whether pattern in extended RLE format
		/** @type {boolean} */ this.extendedFormat = false;

		// lower case name of [R]History postfix
		/** @const {string} */ this.historyPostfix = "history";
		/** @const {string} */ this.properHistoryPostfix = "History";

		// lower case name of [R]Super postfix
		/** @const {string} */ this.superPostfix = "super";
		/** @const {string} */ this.properSuperPostfix = "Super";

		// lower case name of [R]Extended postfix
		/** @const {string} */ this.extendedPostfix = "investigator";
		/** @const {string} */ this.properExtendedPostfix = "Investigator";

		// lower case name of Triangular postfix
		/** @const {string} */ this.triangularPostfix = "l";

		// lower case name of Triangular Edges postfix
		/** @const {string} */ this.triangularEdgesPostfix = "le";

		// lower case name of Triangular Vertices postfix
		/** @const {string} */ this.triangularVerticesPostfix = "lv";

		// lower case name of Triangular Inner postfix
		/** @const {string} */ this.triangularInnerPostfix = "li";

		// lower case name of Triangular Outer postfix
		/** @const {string} */ this.triangularOuterPostfix = "lo";

		// lower case name of Triangular Biohazard postfix
		/** @const {string} */ this.triangularBiohazardPostfix = "lb";

		// lower case name of Triangular Radiation postfix
		/** @const {string} */ this.triangularRadiationPostfix = "lr";

		// lower case name of Hex postfix
		/** @const {string} */ this.hexPostfix = "h";

		// lower case name of Hex tripod postfix
		/** @const {string} */ this.hexTripodPostfix = "ht";

		// lower case name of Von-Neumann postfix
		/** @const {string} */ this.vonNeumannPostfix = "v";

		// flag if last pattern was too big
		/** @type {boolean} */ this.tooBig = false;

		// generation number
		/** @type {number} */ this.generation = 0;
		/** @type {boolean} */ this.genDefined = false;

		// position x and y
		/** @type {number} */ this.posX = 0;
		/** @type {number} */ this.posY = 0;
		/** @type {boolean} */ this.posDefined = false;

		// index in string
		/** @type {number} */ this.index = 0;

		// LTL min and max range
		/** @const {number} */ this.minRangeLTL = 1;
		/** @const {number} */ this.maxRangeLTL = 500;

		// LTL min and max states
		/** @const {number} */ this.minStatesLTL = 0;
		/** @const {number} */ this.maxStatesLTL = 256;

		// LTL min and max middle value
		/** @const {number} */ this.minMiddleLTL = 0;
		/** @const {number} */ this.maxMiddleLTL = 1;

		// HROT min and max range
		/** @const {number} */ this.minRangeHROT = 1;
		/** @const {number} */ this.maxRangeHROT = 500;
		/** @const {number} */ this.maxRangeHROTGaussian = 50;

		// HROT min and max states
		/** @const {number} */ this.minStatesHROT = 0;
		/** @const {number} */ this.maxStatesHROT = 256;

		// max state seen
		/** @type {number} */ this.maxSurvivalHROT = 0;
		/** @type {number} */ this.maxBirthHROT = 0;

		// LtL/HROT neighborhoods
		/** @const {number} */ this.mooreHROT = 0;
		/** @const {number} */ this.vonNeumannHROT = 1;
		/** @const {number} */ this.circularHROT = 2;
		/** @const {number} */ this.crossHROT = 3;
		/** @const {number} */ this.saltireHROT = 4;
		/** @const {number} */ this.starHROT = 5;
		/** @const {number} */ this.l2HROT = 6;
		/** @const {number} */ this.hexHROT = 7;
		/** @const {number} */ this.checkerHROT = 8;
		/** @const {number} */ this.hashHROT = 9;
		/** @const {number} */ this.customHROT = 10;
		/** @const {number} */ this.tripodHROT = 11;
		/** @const {number} */ this.asteriskHROT = 12;
		/** @const {number} */ this.triangularHROT = 13;
		/** @const {number} */ this.gaussianHROT = 14;
		/** @const {number} */ this.weightedHROT = 15;
		/** @const {number} */ this.cornerEdgeHROT = 16;
		/** @const {number} */ this.alignedCheckerHROT = 17;

		// specified width and height from RLE pattern
		/** @type {number} */ this.specifiedWidth = -999999;
		/** @type {number} */ this.specifiedHeight = -999999;

		// triangular neighbourhoods
		/** @const {number} */ this.triangularAll = 0;
		/** @const {number} */ this.triangularEdges = 1;
		/** @const {number} */ this.triangularVertices = 2;
		/** @const {number} */ this.triangularInner = 3;
		/** @const {number} */ this.triangularOuter = 4;
		/** @const {number} */ this.triangularBiohazard = 5;
		/** @const {number} */ this.triangularRadiation = 6;

		// hex neighbourhoods
		/** @const {number} */ this.hexAll = 0;
		/** @const {number} */ this.hexTripod = 1;

		// alternate rule separator
		/** @const {string} */ this.altRuleSeparator = "|";

		// whether alternate rule specified
		/** @type {boolean} */ this.altSpecified = false;

		// rule table rule section including trailing space
		/** @const {string} */ this.ruleTableRuleName = "@RULE";

		// rule table tree section
		/** @const {string} */ this.ruleTableTreeName = "@TREE";

		// tree section states setting
		/** @const {string} */ this.ruleTreeStates = "num_states";

		// tree section neighbours setting
		/** @const {string} */ this.ruleTreeNeighbours = "num_neighbors";

		// tree section nodes setting
		/** @const {string} */ this.ruleTreeNodes = "num_nodes";

		// rule table table section
		/** @const {string} */ this.ruleTableTableName = "@TABLE";

		// table section states setting
		/** @const {string} */ this.ruleTableStates = "n_states";

		// table section neighbourhood setting
		/** @const {string} */ this.ruleTableNeighbours = "neighborhood";

		// table section symmetries setting
		/** @const {string} */ this.ruleTableSymmetries = "symmetries";

		// table section neighbourhood strings
		/** @const {Array<string>} */ this.ruleTableNeighbourhoods = [];

		// populate neighbourhoods (must be lower case)
		this.ruleTableNeighbourhoods[PatternConstants.ruleTableVN] = "vonneumann";
		this.ruleTableNeighbourhoods[PatternConstants.ruleTableMoore] = "moore";
		this.ruleTableNeighbourhoods[PatternConstants.ruleTableHex] = "hexagonal";
		this.ruleTableNeighbourhoods[PatternConstants.ruleTableOneD] = "onedimensional";

		// rule table inputs per neighbourhood
		/** @const {Array<number>} */ this.ruleTableInputs = [];

		// populate inputs
		this.ruleTableInputs[PatternConstants.ruleTableVN] = 5;
		this.ruleTableInputs[PatternConstants.ruleTableMoore] = 9;
		this.ruleTableInputs[PatternConstants.ruleTableHex] = 7;
		this.ruleTableInputs[PatternConstants.ruleTableOneD] = 3;

		// table section variable keyword (must be lower case)
		/** @const {string} */ this.ruleTableVar = "var";

		// table section symmetries
		/** @const {Array<Array<string>>} */ this.ruleTableSymmetriesList = [];

		// populate symmetries (must be lower case)
		this.ruleTableSymmetriesList[PatternConstants.ruleTableVN] = ["none", "rotate4", "rotate4reflect", "reflect_horizontal", "permute"];
		this.ruleTableSymmetriesList[PatternConstants.ruleTableMoore] = ["none", "rotate4", "rotate8", "rotate4reflect", "rotate8reflect", "reflect_horizontal", "permute"];
		this.ruleTableSymmetriesList[PatternConstants.ruleTableHex] = ["none", "rotate2", "rotate3", "rotate6", "rotate6reflect", "permute"];
		this.ruleTableSymmetriesList[PatternConstants.ruleTableOneD] = ["none", "reflect", "permute"];

		// symmetry remap
		/** @type {Array<Array<Array<Array<number>>>>} */ this.ruleTableSymmetryRemap = [];

		// populate remap
		// von Neumann
		this.ruleTableSymmetryRemap[PatternConstants.ruleTableVN] = [
			[[0, 1, 2, 3, 4, 5], [0, 2, 3, 4, 1, 5], [0, 3, 4, 1, 2, 5], [0, 4, 1, 2, 3, 5]],  // rotate4
			[[0, 1, 2, 3, 4, 5], [0, 2, 3, 4, 1, 5], [0, 3, 4, 1, 2, 5], [0, 4, 1, 2, 3, 5],  [0, 4, 3, 2, 1, 5], [0, 3, 2, 1, 4, 5], [0, 2, 1, 4, 3, 5], [0, 1, 4, 3, 2, 5]],  // rotate4reflect
			[[0, 1, 2, 3, 4, 5], [0, 1, 4, 3, 2, 5]]  // reflect_horizonal
		];

		// Moore
		this.ruleTableSymmetryRemap[PatternConstants.ruleTableMoore] = [
			[[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 3, 4, 5, 6, 7, 8, 1, 2, 9], [0, 5, 6, 7, 8, 1, 2, 3, 4, 9], [0, 7, 8, 1, 2, 3, 4, 5, 6, 9]],  // rotate4
			[[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 2, 3, 4, 5, 6, 7, 8, 1, 9], [0, 3, 4, 5, 6, 7, 8, 1, 2, 9], [0, 4, 5, 6, 7, 8, 1, 2, 3, 9], [0, 5, 6, 7, 8, 1, 2, 3, 4, 9], [0, 6, 7, 8, 1, 2, 3, 4, 5, 9], [0, 7, 8, 1, 2, 3, 4, 5, 6, 9], [0, 8, 1, 2, 3, 4, 5, 6, 7, 9]],  // rotate8
			[[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 3, 4, 5, 6, 7, 8, 1, 2, 9], [0, 5, 6, 7, 8, 1, 2, 3, 4, 9], [0, 7, 8, 1, 2, 3, 4, 5, 6, 9], [0, 1, 8, 7, 6, 5, 4, 3, 2, 9], [0, 7, 6, 5, 4, 3, 2, 1, 8, 9], [0, 5, 4, 3, 2, 1, 8, 7, 6, 9], [0, 3, 2, 1, 8, 7, 6, 5, 4, 9]],  // rotate4reflect
			[[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 2, 3, 4, 5, 6, 7, 8, 1, 9], [0, 3, 4, 5, 6, 7, 8, 1, 2, 9], [0, 4, 5, 6, 7, 8, 1, 2, 3, 9], [0, 5, 6, 7, 8, 1, 2, 3, 4, 9], [0, 6, 7, 8, 1, 2, 3, 4, 5, 9], [0, 7, 8, 1, 2, 3, 4, 5, 6, 9], [0, 8, 1, 2, 3, 4, 5, 6, 7, 9], [0, 8, 7, 6, 5, 4, 3, 2, 1, 9], [0, 7, 6, 5, 4, 3, 2, 1, 8, 9], [0, 6, 5, 4, 3, 2, 1, 8, 7, 9], [0, 5, 4, 3, 2, 1, 8, 7, 6, 9], [0, 4, 3, 2, 1, 8, 7, 6, 5, 9], [0, 3, 2, 1, 8, 7, 6, 5, 4, 9], [0, 2, 1, 8, 7, 6, 5, 4, 3, 9], [0, 1, 8, 7, 6, 5, 4, 3, 2, 9]],  // rotate8reflect
			[[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 1, 8, 7, 6, 5, 4, 3, 2, 9]]  // reflect_horizontal
		];

		// One dimensional
		this.ruleTableSymmetryRemap[PatternConstants.ruleTableOneD] = [
			[[0, 1, 2, 3], [0, 2, 1, 3]]  // reflect
		];

		// Hexagonal
		this.ruleTableSymmetryRemap[PatternConstants.ruleTableHex] = [
			[[0, 1, 2, 3, 4, 5, 6, 7], [0, 4, 5, 6, 1, 2, 3, 7]],  // rotate2
			[[0, 1, 2, 3, 4, 5, 6, 7], [0, 3, 4, 5, 6, 1, 2, 7], [0, 5, 6, 1, 2, 3, 4, 7]], // rotate3
			[[0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 3, 4, 5, 6, 1, 7], [0, 3, 4, 5, 6, 1, 2, 7], [0, 4, 5, 6, 1, 2, 3, 7], [0, 5, 6, 1, 2, 3, 4, 7], [0, 6, 1, 2, 3, 4, 5, 7]],  // rotate6
			[[0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 3, 4, 5, 6, 1, 7], [0, 3, 4, 5, 6, 1, 2, 7], [0, 4, 5, 6, 1, 2, 3, 7], [0, 5, 6, 1, 2, 3, 4, 7], [0, 6, 1, 2, 3, 4, 5, 7], [0, 6, 5, 4, 3, 2, 1, 7], [0, 5, 4, 3, 2, 1, 6, 7], [0, 4, 3, 2, 1, 6, 5, 7], [0, 3, 2, 1, 6, 5, 4, 7], [0, 2, 1, 6, 5, 4, 3, 7], [0, 1, 6, 5, 4, 3, 2, 7]]  // rotate6reflect
		];

		// whether rule table has B0
		/** @type {boolean} */ this.ruleTableB0 = false;

		// rule table names section
		/** @const {string} */ this.ruleTableNamesName = "@NAMES";

		// rule table colours section
		/** @const {string} */ this.ruleTableColoursName = "@COLORS";

		// rule table icons section
		/** @const {string} */ this.ruleTableIconsName = "@ICONS";

		// rule table XPM keyword
		/** @const {string} */ this.ruleTableIconsXPM = "xpm";

		// rule loader definition
		/** @type {string} */ this.ruleLoaderDefinition = "";
	}

	// Life pattern constructor
	/**
	 * @constructor
	 */
	function Pattern(/** @type {string} */ name, /** @type {PatternManager} */ manager) {
		// allocator
		/** @type {Allocator} */ this.allocator = null;

		// manager
		/** @type {PatternManager} */ this.manager = manager;

		// original failure reason before repository lookup
		/** @type {string} */ this.originalFailure = "";

		// whether HROT pattern is probabilistic (non-deterministic)
		/** @type {boolean} */ this.probabilisticHROT = false;

		// HROT births, survivals and immunities changes
		/** @type {number} */ this.probabilisticBirths = -1;
		/** @type {number} */ this.probabilisticSurvivals = -1;
		/** @type {number} */ this.probabilisticImmunities = -1;

		// remove extension from name if present
		var	/** @type {number} */ i = name.lastIndexOf(".");
		if (i !== -1) {
			name = name.substring(0, i);
		}

		/** @type {string} */ this.name = name;

		// birth mask for triangular rules
		/** @type {number} */ this.birthTriMask = 0;

		// survival mask for triangular rules
		/** @type {number} */ this.survivalTriMask = 0;

		// bounded grid type found
		/** @type {number} */ this.gridType = -1;

		// grid width
		/** @type {number} */ this.gridWidth = -1;

		// grid height
		/** @type {number} */ this.gridHeight = -1;

		// grid horizontal shift
		/** @type {number} */ this.gridHorizontalShift = 0;

		// grid vertical shift
		/** @type {number} */ this.gridVerticalShift = 0;

		// grid horizontal twist
		/** @type {boolean} */ this.gridHorizontalTwist = false;

		// grid vertical twist
		/** @type {boolean} */ this.gridVerticalTwist = false;

		// grid sphere axis
		/** @type {boolean} */ this.gridSphereAxisTopLeft = true;

		// original rule name
		/** @type {string} */ this.originalRuleName = "";

		// rule name
		/** @type {string} */ this.ruleName = "";

		// alias name
		/** @type {string} */ this.aliasName = "";

		// bounded grid definition
		/** @type {string} */ this.boundedGridDef = "";

		// is Margolus rule
		/** @type {boolean} */ this.isMargolus = false;

		// is PCA rule
		/** @type {boolean} */ this.isPCA = false;

		// is _none_ rule
		/** @type {boolean} */ this.isNone = false;

		// is history rule
		/** @type {boolean} */ this.isHistory = false;

		// is super rule
		/** @type {boolean} */ this.isSuper = false;

		// is extended rule
		/** @type {boolean} */ this.isExtended = false;

		// contains Niemiec extended states
		/** @type {boolean} */ this.isNiemiec = false;

		// is hex rule
		/** @type {boolean} */ this.isHex = false;

		// hex neighbourhood (0 - full, 1 - tripod)
		/** @type {number} */ this.hexNeighbourhood = this.manager.hexAll;

		// is triangular rule
		/** @type {boolean} */ this.isTriangular = false;

		// triangular neighbourhood (0 - full, 1 - edges, 2 - vertices, 3 - inner, 4 - outer)
		/** @type {number} */ this.triangularNeighbourhood = this.manager.triangularAll;

		// is Wolfram rule
		/** @type {number} */ this.wolframRule = -1;

		// is von neumann rule
		/** @type {boolean} */ this.isVonNeumann = false;

		// is LTL rule
		/** @type {boolean} */ this.isLTL = false;

		// LTL range
		/** @type {number} */ this.rangeLTL = -1;

		// LTL middle included
		/** @type {number} */ this.middleLTL = 1;

		// LTL Smin
		/** @type {number} */ this.SminLTL = -1;

		// LTL Smax
		/** @type {number} */ this.SmaxLTL = -1;

		// LTL Bmin
		/** @type {number} */ this.BminLTL = -1;

		// LTL Bmax
		/** @type {number} */ this.BmaxLTL = -1;

		// alternate rule LTL settings
		/** @type {number} */ this.altMiddleLTL = -1;
		/** @type {number} */ this.altSminLTL = -1;
		/** @type {number} */ this.altSmaxLTL = -1;
		/** @type {number} */ this.altBminLTL = -1;
		/** @type {number} */ this.altBmaxLTL = -1;

		// LTL neightborhood
		/** @type {number} */ this.neighborhoodLTL = -1;

		// is HROT rule
		/** @type {boolean} */ this.isHROT = false;
		/** @type {boolean} */ this.wasHROT = false;

		// HROT range
		/** @type {number} */ this.rangeHROT = -1;

		// HROT birth array
		/** @type {Uint8Array} */ this.birthHROT = null;

		// HROT survival array
		/** @type {Uint8Array} */ this.survivalHROT = null;

		// alternate rule HROT birth and survival arrays
		/** @type {Uint8Array} */ this.altBirthHROT = null;
		/** @type {Uint8Array} */ this.altSurvivalHROT = null;

		// HROT neighborhood
		/** @type {number} */ this.neighborhoodHROT = -1;

		// states for generations, LTL or HROT
		/** @type {number} */ this.multiNumStates = -1;

		// maximum state read
		/** @type {number} */ this.maxStateRead = -1;

		// HROT corner and edge ranges
		/** @type {number} */ this.cornerRange = 1;
		/** @type {number} */ this.edgeRange = 1;

		// HROT custom neighbourhood
		/** @type {string} */ this.customNeighbourhood = "";
		/** @type {number} */ this.customNeighbourCount = -1;
		/** @type {string} */ this.customGridType = "";

		// HROT weighted neighbourhood
		/** @type {Array<number>} */ this.weightedNeighbourhood = null;

		// HROT weighted states
		/** @type {Array<number>} */ this.weightedStates = null;

		// width of grid
		/** @type {number} */ this.width = 0;

		// height of grid
		/** @type {number} */ this.height = 0;

		// life bitmap
		/** @type {Array<Uint16Array>} */ this.lifeMap = null;

		// multi-state map
		/** @type {Array<Uint8Array>} */ this.multiStateMap = null;

		// title
		/** @type {string} */ this.title = "";

		// title before RLE
		/** @type {string} */ this.beforeTitle = "";

		// title after RLE
		/** @type {string} */ this.afterTitle = "";

		// title array concatenators
		/** @type {Array<string>} */ this.titleConcat = [];
		/** @type {Array<string>} */ this.beforeTitleConcat = [];
		/** @type {Array<string>} */ this.afterTitleConcat = [];

		// pattern source format
		/** @type {string} */ this.patternFormat = "";

		// number of states
		/** @type {number} */ this.numStates = 2;

		// number of used states
		/** @type {number} */ this.numUsedStates = 0;

		// pattern too big flag
		/** @type {boolean} */ this.tooBig = false;

		// pattern invalid flag
		/** @type {boolean} */ this.invalid = false;

		// pattern originator
		/** @type {string} */ this.originator = "";

		// rule table name
		/** @type {string} */ this.ruleTableName = "";

		// rule tree states
		/** @type {number} */ this.ruleTreeStates = -1;

		// whether rule tree is hex
		/** @type {boolean} */ this.ruleTreeIsHex = false;

		// rule tree neighbours
		/** @type {number} */ this.ruleTreeNeighbours = -1;

		// rule tree nodes
		/** @type {number} */ this.ruleTreeNodes = -1;

		// rule tree base
		/** @type {number} */ this.ruleTreeBase = -1;

		// rule table neighbourhood
		/** @type {number} */ this.ruleTableNeighbourhood = -1;

		// rule table states
		/** @type {number} */ this.ruleTableStates = -1;

		// rule table LUT
		/** @type {Array} */ this.ruleTableLUT = null;

		// rule table output
		/** @type {Uint8Array} */ this.ruleTableOutput = null;

		// rule table number of duplicates removed
		/** @type {number} */ this.ruleTableDups = 0;

		// rule table number of compressed rules
		/** @type {number} */ this.ruleTableCompressedRules = 0;

		// rule tree b array
		/** @type {Uint8Array} */ this.ruleTreeB = null;

		// rule tree a array
		/** @type {Uint32Array} */ this.ruleTreeA = null;

		// rule tree colours
		/** @type {Uint32Array} */ this.ruleTreeColours = null;

		// rule tree names
		/** @type {Array<string>} */ this.ruleTableNames = [];

		// rule table icons
		/** @type {Array} */ this.ruleTableIcons = null;
	}

	// check if pattern is HROT and has B0
	Pattern.prototype.hasHROTB0 = function() {
		var	/** @type {boolean} */ result = false;

		if (this.isHROT && this.birthHROT[0] !== 0) {
			result = true;
		}

		return result;
	};

	// corner/edge canonical rule name part
	/** @returns {string} */
	Pattern.prototype.cornerEdgeCanonical = function(/** @type {number} */ range) {
		var	/** @type {string} */ result = "";

		if (this.cornerRange !== range || this.edgeRange !== range) {
			if (this.cornerRange !== range) {
				result += "C" + this.cornerRange;
			}
			if (this.edgeRange !== range) {
				result += "E" + this.edgeRange;
			}
		}

		return result;
	};

	// copy settings from one pattern to another
	Pattern.prototype.copySettingsFrom = function(/** @type {Pattern} */ source) {
		// copy settings
		this.originalRuleName = source.originalRuleName;
		this.ruleName = source.ruleName;
		this.isMargolus = source.isMargolus;
		this.isPCA = source.isPCA;
		this.isNone = source.isNone;
		this.aliasName = source.aliasName;
		this.isHex = source.isHex;
		this.hexNeighbourhood = source.hexNeighbourhood;
		this.isTriangular = source.isTriangular;
		this.birthTriMask = source.birthTriMask;
		this.survivalTriMask = source.survivalTriMask;
		this.triangularNeighbourhood = source.triangularNeighbourhood;
		this.wolframRule = source.wolframRule;
		this.isVonNeumann = source.isVonNeumann;
		this.isLTL = source.isLTL;
		this.rangeLTL = source.rangeLTL;
		this.neighborhoodLTL = source.neighborhoodLTL;
		this.middleLTL = source.middleLTL;
		this.SminLTL = source.SminLTL;
		this.SmaxLTL = source.SmaxLTL;
		this.BminLTL = source.BminLTL;
		this.BmaxLTL = source.BmaxLTL;
		this.isHROT = source.isHROT;
		this.rangeHROT = source.rangeHROT;
		this.neighborhoodHROT = source.neighborhoodHROT;
		this.multiNumStates = source.multiNumStates;
		this.numStates = source.numStates;
		this.customGridType = source.customGridType;
		this.customNeighbourCount = source.customNeighbourCount;
		this.customNeighbourhood = source.customNeighbourhood;

		// copy arrays
		if (source.survivalHROT) {
			this.survivalHROT = new Uint8Array(source.survivalHROT.length);
			this.survivalHROT.set(source.survivalHROT);
		}
		if (source.birthHROT) {
			this.birthHROT = new Uint8Array(source.birthHROT.length);
			this.birthHROT.set(source.birthHROT);
		}
	};

	// copy multi-state settings from pattern to alternate on this pattern
	Pattern.prototype.copyMultiSettingsFrom = function(/** @type {Pattern} */ source, /** @type {Allocator} */ allocator) {
		// copy arrays
		if (source.survivalHROT) {
			this.altSurvivalHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, source.survivalHROT.length, "HROT.altSurvivals"));
			this.altSurvivalHROT.set(source.survivalHROT);
		}
		if (source.birthHROT) {
			this.altBirthHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, source.birthHROT.length, "HROT.altBirths"));
			this.altBirthHROT.set(source.birthHROT);
		}

		// copy settings
		this.altMiddleLTL = source.middleLTL;
		this.altSminLTL = source.SminLTL;
		this.altSmaxLTL = source.SmaxLTL;
		this.altBminLTL = source.BminLTL;
		this.altBmaxLTL = source.BmaxLTL;
	};

	// reset settings to defaults
	Pattern.prototype.resetSettings = function() {
		this.originalRuleName = "";
		this.ruleName = "";
		this.aliasName = "";
		this.isMargolus = false;
		this.isPCA = false;
		this.isNone = false;
		this.isHex = false;
		this.hexNeighbourhood = this.manager.hexAll;
		this.isTriangular = false;
		this.birthTriMask = 0;
		this.survivalTriMask = 0;
		this.triangularNeighbourhood = this.manager.triangularAll;
		this.wolframRule = -1;
		this.isVonNeumann = false;
		this.isLTL = false;
		this.rangeLTL = -1;
		this.neighborhoodLTL = -1;
		this.isHROT = false;
		this.rangeHROT = -1;
		this.neighborhoodHROT = -1;
		this.multiNumStates = -1;
		this.numStates = 2;
	};

	// check if one pattern is the same family as another
	/** @returns {string} */
	Pattern.prototype.isSameFamilyAs = function(/** @type {Pattern} */ source) {
		var	/** @type {number} */ states = (this.multiNumStates === -1 ? this.numStates : this.multiNumStates),
			/** @type {number} */ sourceStates = (source.multiNumStates === -1 ? source.numStates : source.multiNumStates);

		// check for rule families
		if ((this.isLTL !== source.isLTL) || (this.isHROT !== source.isHROT)) {
			return "Alternate is different rule family";
		}

		// check for Wolfram emulation
		if (this.manager.wolframEmulation) {
			return "Alternate can not use Wolfram emulation";
		}

		// check for number of states
		if (states !== sourceStates) {
			return "Alternate has different number of states";
		}

		// check for neighborhoods
		if ((this.isPCA !== source.isPCA) || (this.isMargolus !== source.isMargolus) || (this.isHex !== source.isHex) || (this.hexNeighbourhood !== source.hexNeighbourhood) || (this.isTriangular !== source.isTriangular) || (this.triangularNeighbourhood !== source.triangularNeighbourhood) || (this.isVonNeumann !== source.isVonNeumann) || (this.wolframRule === -1 && source.wolframRule !== -1) || (this.wolframRule !== -1 && source.wolframRule === -1) || (this.neighborhoodLTL !== source.neighborhoodLTL) || (this.neighborhoodHROT !== source.neighborhoodHROT)) {
			return "Alternate has different neighborhood";
		}

		// check for range
		if ((this.rangeLTL !== source.rangeLTL) || (this.rangeHROT !== source.rangeHROT)) {
			return "Alternate has different range";
		}

		// check for "none" rules
		if (this.isNone || source.isNone) {
			return "Alternate can not use none";
		}

		// check for custom neighbourhoods
		if (this.customGridType !== source.customGridType || this.customNeighbourCount !== source.customNeighbourCount || this.customNeighbourhood !== source.customNeighbourhood) {
			return "Alternate has different neighbourhood";
		}

		// all checks passed
		return "";
	};

	// decode a Cells pattern
	PatternManager.prototype.decodeCells = function(/** @type {Pattern} */ pattern, /** @type {string} */ source, /** @type {Allocator} */ allocator) {
		var	/** @type {number} */ i,
			/** @type {number} */ length,
			/** @type {string} */ chr,
			/** @type {number} */ mode,
			/** @type {number} */ maxWidth = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ sectionStart,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {boolean} */ skipBlanks,

			// parser modes
			/** @const {number} */ headerMode = 0,
			/** @const {number} */ readTitle = 1,
			/** @const {number} */ cellsMode = 2,

			// whether valid
			/** @type {boolean} */ invalid = false;

		// parse the source
		length = source.length;

		// start in header mode
		mode = headerMode;

		// read each character starting at the beginning since the magic is one character
		i = 0;

		while (i < length) {
			// get next character
			chr = source[i];
			i += 1;

			// check on mode
			switch (mode) {
			// processing header
			case headerMode:
				switch (chr) {
				// found title
				case "!":
					mode = readTitle;
					// output as RLE comment since that is the canonical format for copy to clipboard
					pattern.beforeTitle += "#C ";
					skipBlanks = true;
					break;

				// found cells
				case "O":
				case "o":
				case "*":
				case ".":
					mode = cellsMode;
					height = 0;
					maxWidth = 0;
					width = 0;

					// character is part of bitmap so go back to process it
					i -= 1;

					// mark the start of the section
					sectionStart = i;
					break;

				// ignore other characters
				default:
					break;
				}
				break;

			// reading title
			case readTitle:
				// add to title
				if (chr !== "\r" && chr !== "\n") {
					// check for skipping blanks
					if (chr === " ") {
						if (!skipBlanks) {
							pattern.title += chr;
							pattern.beforeTitle += chr;
						}
					} else {
						skipBlanks = false;
						pattern.title += chr;
						pattern.beforeTitle += chr;
					}
				}

				// end of line
				if (chr === "\n") {
					// switch back to header mode
					mode = headerMode;
					pattern.beforeTitle += chr;
					pattern.title += " ";
				}
				break;

			// reading cells
			case cellsMode:
				switch (chr) {
				// cell
				case "O":
				case "o":
				case "*":
				case ".":
					width += 1;
					break;

				// newline
				case "\n":
					// increment height
					height += 1;
					if (width > maxWidth) {
						maxWidth = width;
						width = 0;
					}
					width = 0;
					break;

				// ignore spaces
				case " ":
				case "\t":
					break;

				// other characters are errors
				default:
					// exit
					i = length;
					invalid = true;
					break;
				}
				break;
			}
		}

		// check if valid
		if (!invalid) {
			// check for unterminated bitmap line
			if (mode === cellsMode && chr !== "\n") {
				// increment height
				height += 1;
				if (width > maxWidth) {
					maxWidth = width;
				}
			}

			// get width and height
			pattern.height = height;
			pattern.width = maxWidth;
			pattern.patternFormat = "Cells";

			// allocate the life array
			pattern.lifeMap = Array.matrix(Type.Uint16, pattern.height, ((pattern.width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");

			// populate the array
			i = sectionStart;

			y = 0;
			x = 0;

			while (i < length) {
				// get next character
				chr = source[i];
				i += 1;

				switch (chr) {
				// newline
				case "\n":
					y += 1;
					x = 0;
					break;

				// set cell
				case "O":
				case "o":
				case "*":
					pattern.lifeMap[y][x >> 4] |= 1 << (~x & 15);
					x += 1;
					break;

				// clear cell
				case ".":
					x += 1;
					break;

				// ignore other characters
				default:
					break;
				}
			}

			// mark as executable
			this.executable = true;

			// remove empty comment
			if (pattern.beforeTitle === "#C ") {
				pattern.beforeTitle = "";
			}

			// set Conway rule
			this.decodeRuleString(pattern, "", allocator, false);
		}
	};

	// decode a Life 1.06 pattern
	PatternManager.prototype.decode106 = function(/** @type {Pattern} */ pattern, /** @type {string} */ source, /** @type {Allocator} */ allocator) {
		var	/** @type {number} */ i,
			/** @type {number} */ length,
			/** @type {string} */ chr,
			/** @type {number} */ item,
			/** @type {number} */ minX,
			/** @type {number} */ maxX,
			/** @type {number} */ minY,
			/** @type {number} */ maxY,
			/** @type {Array} */ cells,
			/** @type {number} */ n,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {boolean} */ negative,
			/** @type {boolean} */ sawPosition,

			// item types
			/** @const {number} */ waiting = 0,
			/** @const {number} */ xPos = 1,
			/** @const {number} */ yPos = 2;

		// parse the source
		length = source.length;

		// initialise the read
		cells = [];
		n = 0;
		negative = false;
		x = 0;
		y = 0;
		sawPosition = false;

		// read each character starting past the magic
		i = Life106.magic.length;

		while (i < length) {
			// get next character
			chr = source[i];
			i += 1;

			switch (chr) {
			// newline
			case "\n":
				if (sawPosition) {
					sawPosition = false;

					// check if y position should be negative
					if (item === yPos) {
						if (negative) {
							y = -y;
							negative = false;
						}
					}

					// add to cells array
					cells[n] = [x, y];
					n += 1;
				}

				// reset position
				x = 0;
				y = 0;
				item = waiting;
				break;

			// dash
			case "-":
				// set negative flag
				negative = true;

				// switch to next item
				if (item === waiting) {
					item = xPos;
				} else {
					if (item === xPos) {
						item = yPos;
					}
				}
				break;

			// space
			case " ":
				// check if x position should be negative
				if (item === xPos) {
					if (negative) {
						x = -x;
						negative = false;
					}
					item = yPos;
				}
				break;

			// digit
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
				// check if item being processed
				if (item === waiting) {
					item = xPos;
				}

				// add to the position
				if (item === xPos) {
					x = (x * 10) + parseInt(chr, 10);
				} else {
					y = (y * 10) + parseInt(chr, 10);
					sawPosition = true;
				}
				break;

			// ignore other characters
			default:
				break;
			}
		}

		// check for final item
		if (sawPosition) {
			// check if y position should be negative
			if (item === yPos) {
				if (negative) {
					y = -y;
					negative = false;
				}
			}

			// add to cells array
			cells[n] = [x, y];
			n += 1;
		}

		// compute the array size
		if (n) {
			// read size from first cell
			minX = cells[0][0];
			maxX = minX;
			minY = cells[0][1];
			maxY = minY;

			// update min and max from remaining cells
			for (i = 1; i < n; i += 1) {
				x = cells[i][0];
				y = cells[i][1];
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				if (y < minY) {
					minY = y;
				}
				if (y > maxY) {
					maxY = y;
				}
			}

			// get height and width
			pattern.height = maxY - minY + 1;
			pattern.width = maxX - minX + 1;

			// allocate an array
			pattern.lifeMap = Array.matrix(Type.Uint16, pattern.height, ((pattern.width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");
			pattern.patternFormat = "Life 1.06";

			// set Conway rule
			this.decodeRuleString(pattern, "", allocator, false);

			// set the cells
			for (i = 0; i < n; i += 1) {
				x = cells[i][0] - minX;
				y = cells[i][1] - minY;
				pattern.lifeMap[y][x >> 4] |= 1 << (~x & 15);
			}
		}
	};

	// decode a Life 1.05 pattern
	PatternManager.prototype.decode105 = function(/** @type {Pattern} */ pattern, /** @type {string} */ source, /** @type {boolean} */ header, /** @type {Allocator} */ allocator) {
		var	/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {string} */ chr,
			/** @type {number} */ endX,
			/** @type {number} */ endY,
			/** @type {number} */ width,
			/** @type {number} */ maxWidth,
			/** @type {number} */ height,
			/** @type {number} */ sectionStart,
			/** @type {number} */ sectionEnd,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ xOffset,
			/** @type {number} */ yOffset,
			/** @type {boolean} */ skipBlanks,

			// parser modes
			/** @const {number} */ headerMode = 0,
			/** @const {number} */ readTitle = 1,
			/** @const {number} */ readCommand = 2,
			/** @const {number} */ cellsMode = 3,
			/** @const {number} */ readCustomRule = 4,
			/** @const {number} */ readPosition = 5,

			// item types
			/** @type {number} */ waiting = 0,
			/** @type {number} */ xPos = 1,
			/** @type {number} */ yPos = 2,

			// sections
			/** @type {Array} */ sections = [],
			/** @type {number} */ numSections = 0,

			// parse the source
			/** @type {number} */ length = source.length,

			// custom rule
			/** @type {string} */ customRule = "",
			/** @type {boolean} */ sawCustom = false,

			// start in header mode
			/** @type {number} */ mode = headerMode,
			/** @type {number} */ item = waiting,
			/** @type {boolean} */ negative = false,
			/** @type {boolean} */ ended = false,
			/** @type {number} */ startX = 0,
			/** @type {number} */ startY = 0;

		// read each character starting past the magic
		if (header) {
			i = Life105.magic.length;
		} else {
			i = 0;
		}

		// mark as executable
		this.executable = true;

		while (i < length && !ended) {
			// get next character
			chr = source[i];
			i += 1;

			// check on mode
			switch (mode) {
			// processing header
			case headerMode:
				switch (chr) {
				// found a command
				case "#":
					mode = readCommand;
					break;

				// found cells
				case "*":
				case ".":
					mode = cellsMode;

					// reset size
					width = 0;
					maxWidth = 0;
					height = 0;

					// character is part of bitmap so go back to process it
					i -= 1;

					// mark the start of the section
					sectionStart = i;
					break;

				// ignore other characters
				default:
					break;
				}
				break;

			// read command
			case readCommand:
				switch (chr) {
				// comment
				case "C":
				case "D":
					mode = readTitle;
					// output as RLE comment since that is the canonical format for copy to clipboard
					pattern.beforeTitle += "#C ";
					skipBlanks = true;
					break;

				// default rule
				case "N":
					mode = headerMode;
					break;

				// custom rule
				case "R":
					mode = readCustomRule;
					break;

				// position
				case "P":
					mode = readPosition;
					item = waiting;
					negative = false;
					startX = 0;
					startY = 0;
					break;

				// newline
				case "\n":
					mode = headerMode;
					break;

				// other characters should be treated as comments
				default:
					mode = readTitle;
					skipBlanks = true;
					break;
				}
				break;

			// reading title
			case readTitle:
				// add to title
				if (chr !== "\r" && chr !== "\n") {
					// check for skipping blanks
					if (chr === " ") {
						if (!skipBlanks) {
							pattern.title += chr;
							pattern.beforeTitle += chr;
						}
					} else {
						skipBlanks = false;
						pattern.title += chr;
						pattern.beforeTitle += chr;
					}
				}

				// end of line
				if (chr === "\n") {
					// switch back to header mode
					mode = headerMode;
					pattern.title += " ";
					pattern.beforeTitle += chr;
				}
				break;

			// read custom rule
			case readCustomRule:
				if (chr === "\n") {
					mode = headerMode;
				} else {
					customRule += chr;
					sawCustom = true;
				}
				break;

			// read position
			case readPosition:
				switch (chr) {
				// newline
				case "\n":
					// switch to header mode
					mode = headerMode;

					// check if y position should be negative
					if (item === yPos) {
						if (negative) {
							startY = -startY;
							negative = false;
						}
					}
					break;

				// dash
				case "-":
					// set negative flag
					negative = true;

					// switch to next item
					if (item === waiting) {
						item = xPos;
					} else {
						if (item === xPos) {
							item = yPos;
						}
					}
					break;

				// space
				case " ":
					// check if x position should be negative
					if (item === xPos) {
						if (negative) {
							startX = -startX;
							negative = false;
						}
						item = yPos;
					}
					break;

				// digit
				case "0":
				case "1":
				case "2":
				case "3":
				case "4":
				case "5":
				case "6":
				case "7":
				case "8":
				case "9":
					// check if item being processed
					if (item === waiting) {
						item = xPos;
					}

					// add to the position
					if (item === xPos) {
						startX = (startX * 10) + parseInt(chr, 10);
					} else {
						startY = (startY * 10) + parseInt(chr, 10);
					}
					break;

				default:
					// ignore other characters
					break;
				}
				break;

			// process cells
			case cellsMode:
				switch (chr) {
				// newline
				case "\n":
					// check if this row was the widest yet
					if (width > maxWidth) {
						maxWidth = width;
					}
					width = 0;

					// add one to height
					height += 1;
					break;

				// hash
				case "#":
					// add to section array
					sections[numSections] = new Life105Section(startX, startY, maxWidth, height, sectionStart, i - 1);
					numSections += 1;

					// switch to read command mode
					mode = readCommand;
					break;

				// cell value
				case "*":
				case ".":
					width += 1;
					break;

				// ignore spaces
				case " ":
				case "\t":
					break;

				// other characters are invalid
				default:
					ended = true;
					break;
				}
				break;

			// ignore other modes
			default:
				break;
			}
		}

		// check for missing trailing newline
		if (chr !== "\n") {
			height += 1;
		}

		// check if processing a section
		if (mode === cellsMode) {
			// add to section array
			sections[numSections] = new Life105Section(startX, startY, maxWidth, height, sectionStart, i - 1);
			numSections += 1;
		}

		// process the sections to determine grid size
		if (numSections && !ended) {
			// get the size of the first section
			startX = sections[0].startX;
			startY = sections[0].startY;
			endX = startX + sections[0].width - 1;
			endY = startY + sections[0].height - 1;

			// check other sections
			for (i = 1; i < numSections; i += 1) {
				if (sections[i].startX < startX) {
					startX = sections[i].startX;
				}
				if (sections[i].startY < startY) {
					startY = sections[i].startY;
				}
				if (sections[i].startX + sections[i].width - 1 > endX) {
					endX = sections[i].startX + sections[i].width - 1;
				}
				if (sections[i].startY + sections[i].height - 1 > endY) {
					endY = sections[i].startY + sections[i].height - 1;
				}
			}

			// get width and height
			pattern.height = endY - startY + 1;
			pattern.width = endX - startX + 1;

			// allocate the life array
			pattern.lifeMap = Array.matrix(Type.Uint16, pattern.height, ((pattern.width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");
			pattern.patternFormat = "Life 1.05";

			// allocate multi-state array
			pattern.multiStateMap = Array.matrix(Type.Uint8, pattern.height, pattern.width, 0, allocator, "Pattern.multiStateMap");

			// set rule
			if (sawCustom) {
				// code the rule
				this.decodeRule(pattern, customRule, false, allocator);
				if (this.executable) {
					// check for multi-state rule
					if (!(pattern.multiNumStates >= 0 || pattern.isHistory)) {
						// free multi-state map
						pattern.multiStateMap = null;
					}
				} else {
					// disable multi-state
					pattern.multiNumStates = -1;
					pattern.isHistory = false;
					pattern.isSuper = false;
					pattern.isExtended = false;
				}
			} else {
				// default to Conway's Life
				this.decodeRuleString(pattern, "", allocator, false);
			}

			// populate the array
			for (i = 0; i < numSections; i += 1) {
				// get the offset in the source for the cell data for this section
				j = sections[i].startPos;
				sectionEnd = sections[i].endPos;

				// compute the offset from the top left for this section
				xOffset = sections[i].startX - startX;
				yOffset = sections[i].startY - startY;

				// process each character
				x = xOffset;
				y = yOffset;

				while (j <= sectionEnd) {
					chr = source[j];
					j += 1;

					switch (chr) {
					// newline
					case "\n":
						// move to next line
						y += 1;
						x = xOffset;
						break;

					// set cell
					case "*":
						// process set cell
						pattern.lifeMap[y][x >> 4] |= 1 << (~x & 15);
						if (pattern.multiStateMap) {
							pattern.multiStateMap[y][x] = 1;
						}
						x += 1;
						break;

					// ignore other characters
					default:
						x += 1;
						break;
					}
				}
			}
		}
	};

	// set triangular totalistic neighbourhood
	PatternManager.prototype.setTriangularTotalistic = function(/** @type {Uint8Array} */ ruleTriangularArray, /** @type {number} */ value, /** @type {boolean} */ survival, /** @type {number} */ ruleMask) {
		// mask
		var	/** @type {number} */ mask = 0,

			// neighbours
			/** @type {number} */ neighbours = 0,
			/** @type {number} */ neighbourhood = 0,

			// counters
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0;

		// compute the mask
		if (survival) {
			mask = 4;
		}

		// Triangular neighbourhood is:
		// -- e1 e1 e1 --         o1 o1 o1 o1 o1
		// e2 e2 EC e2 e2   and   o2 o2 OC o2 o2
		// e3 e3 e3 e3 e3         -- o3 o3 o3 -
		// Mask is: 8191 = b1111111111111

		// Triangular Vertices neighbourhood is:
		// -- e1 e1 e1 --         o1 o1 -- o1 o1
		// e2 -- EC -- e2   and   o2 -- OC -- o2
		// e3 e3 -- e3 e3         -- o3 o3 o3 -
		// Mask is: 7157 = b1101111110101

		// Triangular Edges neighbourhood is:
		// -- -- -- -- --         -- -- o1 -- --
		// -- e2 EC e2 --         -- o2 OC o2 --
		// -- -- e3 -- --         -- -- -- -- --
		// Mask is: 1038 = b0010000001110

		// Triangular Outer neighbourhood is:
		// -- e1 -- e1 --         -- o1 -- o1 --
		// e2 -- EC -- e2   and   o2 -- OC -- o2
		// -- e3 -- e3 --         -- o3 -- o3 --
		// Mask is: 2741 = b0101010110101

		// Triangular Inner neighbourhood is:
		// -- -- e1 -- --         o1 -- o1 -- o1
		// -- e2 EC e2 --   and   -- o2 OC o2 --
		// e3 -- e3 -- e3         -- -- o3 -- --
		// Mask is: 5454 = b1010101001110

		// Triangular Biohazard neighbourhood is:
		// -- e1 -- e1 --         -- o1 o1 o1 --
		// e2 e2 EC e2 e2   and   o2 o2 OC o2 o2
		// -- e3 e3 e3 --         -- o3 -- o3 --
		// Mask is: 3775 = b0111010111111

		// Triangular Radiation neighbourhood is:
		// -- -- e1 -- --         o1 -- -- -- o1
		// -- -- EC -- --   and   -- -- OC -- --
		// e3 -- -- -- e3         -- -- o3 -- --
		// Mask is: 4420 = b1000101000100

		// bit order is:
		// e3 e3 e3 e3 e3 e1 e1 e1 e2 e2 EC e2 e2
		// and:
		// o1 o1 o1 o1 o1 o3 o3 o3 o2 o2 OC o2 o2
		// which keeps survival bit in the same location for odd/even

		// fill the array based on the value and birth or survival
		for (i = 0; i < 8192; i += 8) {
			for (j = 0; j < 4; j += 1) {
				neighbours = 0;
				neighbourhood = (i + j) & ruleMask;

				// count set bits in neighbourhood
				while (neighbourhood > 0) {
					neighbours += (neighbourhood & 1);
					neighbourhood >>= 1;
				}

				// check if neighbours matches the suppled birth or survival count
				if (value === neighbours) {
					ruleTriangularArray[i + j + mask] = 1;
				}
			}
		}
	};

	// set totalistic neighbourhood
	PatternManager.prototype.setTotalistic = function(/** @type {Uint8Array} */ ruleArray, /** @type {number} */ value, /** @type {boolean} */ survival, /** @type {number} */ hexMask) {
		// mask
		var	/** @type {number} */ mask = 0,

			// neighbours
			/** @type {number} */ neighbours = 0,
			/** @type {number} */ neighbourhood = 0,

			// counters
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0;

		// compute the mask
		if (survival) {
			mask = 0x10;
		}

		// fill the array based on the value and birth or survival
		for (i = 0; i < 512; i += 32) {
			for (j = 0; j < 16; j += 1) {
				neighbours = 0;
				neighbourhood = (i + j) & hexMask;

				while (neighbourhood > 0) {
					neighbours += (neighbourhood & 1);
					neighbourhood >>= 1;
				}
				if (value === neighbours) {
					ruleArray[i + j + mask] = 1;
				}
			}
		}
	};

	// flip bits
	/** @returns {number} */
	PatternManager.prototype.flipBits = function(/** @type {number} */ x) {
		return ((x & 0x07) << 6) | ((x & 0x1c0) >> 6) | (x & 0x38);
	};

	// rotate 90
	/** @returns {number} */
	PatternManager.prototype.rotateBits90Clockwise = function(/** @type {number} */ x) {
		return ((x & 0x4) << 6) | ((x & 0x20) << 2) | ((x & 0x100) >> 2)
			| ((x & 0x2) << 4) | (x & 0x10) | ((x & 0x80) >> 4)
			| ((x & 0x1) << 2) | ((x & 0x8) >> 2) | ((x & 0x40) >> 6);
	};

	// set symmetrical neighbourhood into 512bit value
	PatternManager.prototype.setSymmetrical512 = function(/** @type {Uint8Array} */ ruleArray, /** @type {number} */ x, /** @type {number} */ b) {
		// variables
		var	/** @type {number} */ y = x,

			// counters
			/** @type {number} */ i = 0;

		// compute 4 rotations
		for (i = 0; i < 4; i += 1) {
			ruleArray[y] = b;
			y = this.rotateBits90Clockwise(y);
		}

		// flip
		y = this.flipBits(y);

		// compute 4 rotations
		for (i = 0; i < 4; i += 1) {
			ruleArray[y] = b;
			y = this.rotateBits90Clockwise(y);
		}
	};

	// set symmetrical hex neighbourhood
	PatternManager.prototype.setHexSymmetrical = function(/** @type {Uint8Array} */ ruleArray, /** @type {number} */ value, /** @type {boolean} */ survival, /** @type {string} */ character, /** @type {number} */ normal, /** @type {number} */ hexMask) {
		// default values
		var	/** @type {Array} */ settings = [],
			/** @type {number} */ i = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ survivalOffset = (survival ? 0x10 : 0),

			// letter index
			letterIndex = null;

		// check for homogeneous bits
		if (value < 2 || value > 4) {
			this.setTotalistic(ruleArray, value, survival, hexMask);
		} else {
			// check letter is valid
			letterIndex = this.ruleHexLetters.indexOf(character);
			if (letterIndex !== -1) {
				// lookup the neighbourhood
				settings = this.ruleHexNeighbourhoods[value - 2][letterIndex];
				for (i = 0; i < settings.length; i += 1) {
					x = settings[i] + survivalOffset;
					ruleArray[x] = normal;
					ruleArray[x + 256] = normal;
					ruleArray[x + 1] = normal;
					ruleArray[x + 257] = normal;
				}
			}
		}
	};

	// set symmetrical neighbourhood
	PatternManager.prototype.setSymmetrical = function(/** @type {Uint8Array} */ ruleArray, /** @type {number} */ value, /** @type {boolean} */ survival, /** @type {string} */ character, /** @type {number} */ normal, /** @type {number} */ hexMask) {
		// default values
		var	/** @type {number} */ xOrbit = 0,
			/** @type {number} */ nIndex = value - 1,
			/** @type {number} */ x = 0,

			// letter index
			letterIndex = null;

		// check for homogeneous bits
		if (value === 0 || value === 8) {
			this.setTotalistic(ruleArray, value, survival, hexMask);
		} else {
			// compute x orbit and n index
			if (nIndex > 3) {
				nIndex = 6 - nIndex;
				xOrbit = 0x1ef;
			}

			// check letter is valid
			letterIndex = this.ruleLetters[nIndex].indexOf(character);
			if (letterIndex !== -1) {
				// lookup the neighbourhood
				x = this.ruleNeighbourhoods[nIndex][letterIndex] ^ xOrbit;
				if (survival) {
					x |= 0x10;
				}

				// set symmetrical neighbourhood
				this.setSymmetrical512(ruleArray, x, normal);
			}
		}
	};

	// set totalistic birth or survival rule from a string
	PatternManager.prototype.setTotalisticRuleFromString = function(/** @type {Uint8Array} */ ruleArray, /** @type {string} */ rule, /** @type {boolean} */ survival, /** @type {number} */ mask) {
		// current character
		var	/** @type {number} */ current,

			// length
			/** @type {number} */ length = rule.length,

			// ASCII 0
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),

			// used bit array
			/** @type {number} */ used = 0,

			// canonical string
			/** @type {string} */ canonical = "",

			// counter
			/** @type {number} */ i = 0;

		// process each character
		for (i = 0; i < length; i += 1) {
			// get the next character as a number
			current = rule.charCodeAt(i) - asciiZero;
			used |= 1 << current;

			// set hex totalistic
			this.setTotalistic(ruleArray, current, survival, mask);
		}

		// build the canonical representation
		for (i = 0; i < 9; i += 1) {
			if ((used & 1 << i) !== 0) {
				canonical += String(i);
			}
		}
		return canonical;
	};

	// return a count of the number of bits set in the given number
	/** @returns {number} */
	PatternManager.prototype.bitCount = function(/** @type {number} */ number) {
		var	/** @type {number} */ r = 0;

		while (number) {
			r += 1;
			number &= number - 1;
		}
		return r;
	};

	// add canonical hex letter representation
	/** @returns {string} */
	PatternManager.prototype.addHexLetters = function(/** @type {number} */ count, /** @type {Array} */ lettersArray) {
		var	/** @type {string} */ canonical = "",
			/** @type {number} */ bits = 0,
			/** @type {number} */ negative = 0,
			/** @type {number} */ setbits = 0,
			/** @type {number} */ maxbits = 0,
			/** @type {number} */ j = 0;

		// check if letters are defined for this neighbour count
		if (lettersArray[count]) {
			// check whether normal or inverted letters defined
			bits = lettersArray[count];

			// check for negative
			if ((bits & (1 << this.negativeBit)) !== 0) {
				negative = 1;
				bits = bits & ~(1 << this.negativeBit);
			}

			// compute the number of bits set
			setbits = this.bitCount(bits);

			// get the maximum number of allowed letters at this neighbour count
			if (count < 2 || count > 4) {
				maxbits = 0;
			} else {
				maxbits = 3;
			}

			// if maximum letters minus number used is greater than number used then invert
			if (setbits >= 2) {
				// invert maximum letters for this count
				bits = ~bits & ((1 << maxbits) - 1);
				if (bits) {
					negative = 1 - negative;
				}
			}

			// add if not negative and bits defined
			if (!(negative && !bits)) {
				// add the count
				canonical += String(count);

				// add the minus if required
				if (negative) {
					canonical += "-";
				}

				// add defined letters
				for (j = 0; j < maxbits; j += 1) {
					if ((bits & (1 << j)) !== 0) {
						canonical += this.ruleHexLetters[j];
					}
				}
			}
		} else {
			// just add the count
			canonical += String(count);
		}

		// return the canonical string
		return canonical;
	};

	// add canonical letter representation
	/** @returns {string} */
	PatternManager.prototype.addLetters = function(/** @type {number} */ count, /** @type {Array} */ lettersArray) {
		var	/** @type {string} */ canonical = "",
			/** @type {number} */ bits = 0,
			/** @type {number} */ negative = 0,
			/** @type {number} */ setbits = 0,
			/** @type {number} */ maxbits = 0,
			/** @type {number} */ letter = 0,
			/** @type {number} */ j = 0;

		// check if letters are defined for this neighbour count
		if (lettersArray[count]) {
			// check whether normal or inverted letters defined
			bits = lettersArray[count];

			// check for negative
			if ((bits & (1 << this.negativeBit)) !== 0) {
				negative = 1;
				bits = bits & ~(1 << this.negativeBit);
			}

			// compute the number of bits set
			setbits = this.bitCount(bits);

			// get the maximum number of allowed letters at this neighbour count
			maxbits = this.maxLetters[count];

			// do not invert if not negative and seven letters
			if (!(!negative && setbits === 7 && maxbits === 13)) {
				// if maximum letters minus number used is greater than number used then invert
				if (setbits + negative > (maxbits >> 1)) {
					// invert maximum letters for this count
					bits = ~bits & ((1 << maxbits) - 1);
					if (bits) {
						negative = 1 - negative;
					}
				}
			}

			// add if not negative and bits defined
			if (!(negative && !bits)) {
				// add the count
				canonical += String(count);

				// add the minus if required
				if (negative) {
					canonical += "-";
				}

				// add defined letters
				for (j = 0; j < maxbits; j += 1) {
					letter = this.orderLetters[count][j];
					if ((bits & (1 << letter)) !== 0) {
						canonical += this.ruleLetters[3][letter];
					}
				}
			}
		} else {
			// just add the count
			canonical += String(count);
		}

		// return the canonical string
		return canonical;
	};

	// set birth or survival hex rule from a string
	/** @returns {string} */
	PatternManager.prototype.setHexRuleFromString = function(/** @type {Uint8Array} */ ruleArray, /** @type {string} */ rule, /** @type {boolean} */ survival, /** @type {number} */ mask) {
		// current and next characters
		var	/** @type {number} */ current,
			/** @type {string} */ next,

			// length
			/** @type {number} */ length = rule.length,

			// whether character meaning normal or inverted
			/** @type {number} */ normal = 1,

			// used to check for normal and inverted
			/** @type {number} */ check = 0,

			// ASCII 0
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),

			// letter index
			/** @type {number} */ letterIndex = 0,

			// used bit array
			/** @type {number} */ used = 0,
			/** @type {boolean} */ alreadyUsed = false,

			// letters bit array
			/** @type {Array} */ lettersArray = [],

			// canonical string
			/** @type {string} */ canonical = "",

			// counters
			/** @type {number} */ i = 0;

		// add a character for lookahead
		rule += " ";

		// clear letters arrays
		for (i = 0; i < 7; i += 1) {
			lettersArray[i] = 0;
		}

		// process each character
		for (i = 0; i < length; i += 1) {
			// get the next character as a number
			current = rule.charCodeAt(i) - asciiZero;

			// check if it is a digit
			if (current >= 0 && current <= 8) {
				// set canonical
				alreadyUsed = ((used & (1 << current)) !== 0);
				used |= 1 << current;

				// determine what follows the digit
				next = rule[i + 1];

				// check if it is a letter
				letterIndex = this.validHexLettersPerDigit[current].indexOf(next);
				if (letterIndex === -1 && !alreadyUsed) {
					// not a letter so set totalistic
					this.setTotalistic(ruleArray, current, survival, mask);
				}

				// check if non-totalistic
				normal = 1;
				if (next === "-") {
					// invert following character meanings
					normal = 0;
					i += 1;
					next = rule[i + 1];
					letterIndex = this.validHexLettersPerDigit[current].indexOf(next);
				}

				// if the next character is not a valid letter report an error if it is not a digit or space
				if (letterIndex === -1 && !((next >= "0" && next <= "9") || next === " ")) {
					this.failureReason = (survival ? "S" : "B") + current + next + " not valid";
					i = length;
				}

				// check for minus and non-minus use of this digit
				if (alreadyUsed) {
					check = 0;
					if ((lettersArray[current] & 1 << this.negativeBit) === 0) {
						check = 1;
					}
					if (check !== normal) {
						this.failureReason = (survival ? "S" : "B") + current + " can not have minus and non-minus";
						letterIndex = -1;
						i = length;
					}
				}

				// process non-totalistic characters
				while (letterIndex !== -1) {
					// check if the letter has already been used
					if ((lettersArray[current] & (1 << letterIndex)) !== 0) {
						this.failureReason = "Duplicate " + current + this.validHexLettersPerDigit[current][letterIndex];
						letterIndex = -1;
						i = length;
					} else {
						// set symmetrical
						this.setHexSymmetrical(ruleArray, current, survival, next, normal, mask);

						// update the letter bits
						lettersArray[current] |= 1 << letterIndex;

						if (!normal) {
							// set the negative bit
							lettersArray[current] |= 1 << this.negativeBit;
						}
						i += 1;
						next = rule[i + 1];
						letterIndex = this.validHexLettersPerDigit[current].indexOf(next);
					}
				}
			} else {
				// character found without digit prefix
				this.failureReason = "Missing digit prefix";
			}
		}

		// build the canonical representation
		for (i = 0; i < 7; i += 1) {
			if ((used & 1 << i) !== 0) {
				canonical += this.addHexLetters(i, lettersArray);
			}
		}
		return canonical;
	};

	// set birth or survival rule from a string
	/** @returns {string} */
	PatternManager.prototype.setRuleFromString = function(/** @type {Uint8Array} */ ruleArray, /** @type {string} */ rule, /** @type {boolean} */ survival) {
		// current and next characters
		var	/** @type {number} */ current,
			/** @type {string} */ next,

			// length
			/** @type {number} */ length = rule.length,

			// whether character meaning normal or inverted
			/** @type {number} */ normal = 1,

			// used to check for normal and inverted
			/** @type {number} */ check = 0,

			// ASCII 0
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),

			// letter index
			/** @type {number} */ letterIndex = 0,

			// neighbourhood mask
			/** @type {number} */ mask = 511,

			// used bit array
			/** @type {number} */ used = 0,
			/** @type {boolean} */ alreadyUsed = false,

			// letters bit array
			/** @type {Array} */ lettersArray = [],

			// canonical string
			/** @type {string} */ canonical = "",

			// counters
			/** @type {number} */ i = 0;

		// add a character for lookahead
		rule += " ";

		// clear letters arrays
		for (i = 0; i < 9; i += 1) {
			lettersArray[i] = 0;
		}

		// process each character
		for (i = 0; i < length; i += 1) {
			// get the next character as a number
			current = rule.charCodeAt(i) - asciiZero;

			// check if it is a digit
			if (current >= 0 && current <= 8) {
				// set canonical
				alreadyUsed = ((used & (1 << current)) !== 0);
				used |= 1 << current;

				// determine what follows the digit
				next = rule[i + 1];

				// check if it is a letter
				letterIndex = this.validLettersPerDigit[current].indexOf(next);
				if (letterIndex === -1 && !alreadyUsed) {
					// not a letter so set totalistic
					this.setTotalistic(ruleArray, current, survival, mask);
				}

				// check if non-totalistic
				normal = 1;
				if (next === "-") {
					// invert following character meanings
					normal = 0;
					i += 1;
					next = rule[i + 1];
					letterIndex = this.validLettersPerDigit[current].indexOf(next);
				}

				// if the next character is not a valid letter report an error if it is not a digit or space
				if (letterIndex === -1 && !((next >= "0" && next <= "9") || next === " ")) {
					this.failureReason = (survival ? "S" : "B") + current + next + " not valid";
					i = length;
				}

				// check for minus and non-minus use of this digit
				if (alreadyUsed) {
					check = 0;
					if ((lettersArray[current] & 1 << this.negativeBit) === 0) {
						check = 1;
					}
					if (check !== normal) {
						this.failureReason = (survival ? "S" : "B") + current + " can not have minus and non-minus";
						letterIndex = -1;
						i = length;
					}
				}

				// process non-totalistic characters
				while (letterIndex !== -1) {
					// check if the letter has already been used
					if ((lettersArray[current] & (1 << letterIndex)) !== 0) {
						this.failureReason = "Duplicate " + current + this.validLettersPerDigit[current][letterIndex];
						letterIndex = -1;
						i = length;
					} else {
						// set symmetrical
						this.setSymmetrical(ruleArray, current, survival, next, normal, mask);

						// update the letter bits
						lettersArray[current] |= 1 << letterIndex;

						if (!normal) {
							// set the negative bit
							lettersArray[current] |= 1 << this.negativeBit;
						}
						i += 1;
						next = rule[i + 1];
						letterIndex = this.validLettersPerDigit[current].indexOf(next);
					}
				}
			} else {
				// character found without digit prefix
				this.failureReason = "Missing digit prefix";
			}
		}

		// build the canonical representation
		for (i = 0; i < 9; i += 1) {
			if ((used & 1 << i) !== 0) {
				canonical += this.addLetters(i, lettersArray);
			}
		}
		return canonical;
	};

	// create the rule map from Wolfram rule number
	PatternManager.prototype.createWolframMap = function(/** @type {Uint8Array} */ ruleArray, /** @type {number} */ number) {
		var	/** @type {number} */ i = 0;

		// set the rule array
		for (i = 0; i < 512; i += 1) {
			if ((number & (1 << (i & 7))) !== 0) {
				ruleArray[i] = 1;
			} else {
				if ((i & 16) !== 0) {
					ruleArray[i] = 1;
				} else {
					ruleArray[i] = 0;
				}
			}
		}
	};

	// create triangular map
	PatternManager.prototype.createTriMap = function(/** @type {Pattern} */ pattern, /** @type {Uint8Array} */ ruleTriangularArray, /** @type {Uint8Array} */ secondTriangularArray) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ digits = 12,
			/** @type {number} */ ruleMask = this.triangularMask,
			/** @type {number} */ bMask = pattern.birthTriMask,
			/** @type {number} */ sMask = pattern.survivalTriMask;

		// check neighbourhood
		switch (pattern.triangularNeighbourhood) {
			case this.triangularEdges:
				digits = 3;
				ruleMask = this.triangularEdgesMask;
				break;

			case this.triangularVertices:
				digits = 9;
				ruleMask = this.triangularVerticesMask;
				break;

			case this.triangularInner:
				digits = 6;
				ruleMask = this.triangularInnerMask;
				break;

			case this.triangularOuter:
				digits = 6;
				ruleMask = this.triangularOuterMask;
				break;

			case this.triangularBiohazard:
				digits = 9;
				ruleMask = this.triangularBiohazardMask;
				break;

			case this.triangularRadiation:
				digits = 3;
				ruleMask = this.triangularRadiationMask;
				break;
		}

		// clear arrays
		ruleTriangularArray.fill(0);
		if (secondTriangularArray) {
			secondTriangularArray.fill(0);
		}

		// check for B0
		if ((bMask & 1) !== 0) {
			// check for Smax
			if ((sMask & (1 << digits)) !== 0) {
				// B0 with Smax so invert neighbour counts
				bMask = ~bMask;
				sMask = ~sMask;

				// B becomes S(max-x)
				for (i = 0; i <= digits; i += 1) {
					if (sMask & (1 << (digits - i))) {
						this.setTriangularTotalistic(ruleTriangularArray, i, false, ruleMask);
					}
				}
				// S becomes B(max-x)
				for (i = 0; i <= digits; i += 1) {
					if (bMask & (1 << (digits - i))) {
						this.setTriangularTotalistic(ruleTriangularArray, i, true, ruleMask);
					}
				}

				// copy to second array
				secondTriangularArray.set(ruleTriangularArray);
			} else {
				// B0 without Smax so for even generations invert neighbour counts
				for (i = 0; i <= digits; i += 1) {
					if ((~bMask) & (1 << i)) {
						this.setTriangularTotalistic(secondTriangularArray, i, false, ruleMask);
					}
				}
				for (i = 0; i <= digits; i += 1) {
					if ((~sMask) & (1 << i)) {
						this.setTriangularTotalistic(secondTriangularArray, i, true, ruleMask);
					}
				}

				// for odd generations B becomes S(max-x)
				for (i = 0; i <= digits; i += 1) {
					if (sMask & (1 << (digits - i))) {
						this.setTriangularTotalistic(ruleTriangularArray, i, false, ruleMask);
					}
				}
				// S becomes B(max-x)
				for (i = 0; i <= digits; i += 1) {
					if (bMask & (1 << (digits - i))) {
						this.setTriangularTotalistic(ruleTriangularArray, i, true, ruleMask);
					}
				}

				// mark as alternating
				this.altSpecified = true;
			}
		} else {
			// add birth digits
			for (i = 0; i <= digits; i += 1) {
				if ((bMask & (1 << i)) !== 0) {
					this.setTriangularTotalistic(ruleTriangularArray, i, false, ruleMask);
				}
			}

			// add survival digits
			for (i = 0; i <= digits; i += 1) {
				if ((sMask & (1 << i)) !== 0) {
					this.setTriangularTotalistic(ruleTriangularArray, i, true, ruleMask);
				}
			}

			// copy to second array if specified
			if (secondTriangularArray) {
				secondTriangularArray.set(ruleTriangularArray);
			}
		}
	};

	// create a triangular map from birth and survival strings
	/** @returns {string} */
	PatternManager.prototype.createTriangularRuleMap = function(/** @type {Pattern} */ pattern, /** @type {string} */ birthPart, /** @type {string} */ survivalPart, /** @type {number} */ generationsStates, /** @type {number} */ triangularNeighbourhood) {
		var	/** @type {string} */ canonicalName = "",
			/** @type {string} */ letters = this.validTriangularRuleLetters,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {string} */ birthName = "",
			/** @type {string} */ survivalName = "";

		// check which triangular neighbourhood is specified
		switch (triangularNeighbourhood) {
			case this.triangularEdges:
				letters = this.validTriangularEdgesRuleLetters;
				break;

			case this.triangularVertices:
				letters = this.validTriangularVerticesRuleLetters;
				break;

			case this.triangularInner:
				letters = this.validTriangularInnerRuleLetters;
				break;

			case this.triangularOuter:
				letters = this.validTriangularOuterRuleLetters;
				break;

			case this.triangularBiohazard:
				letters = this.validTriangularBiohazardRuleLetters;
				break;

			case this.triangularRadiation:
				letters = this.validTriangularRadiationRuleLetters;
				break;
		}

		// find out which birth letters are specified
		pattern.birthTriMask = 0;
		for (i = 0; i < birthPart.length; i += 1) {
			j = letters.indexOf(birthPart[i]);
			pattern.birthTriMask |= (1 << j);
		}

		// find out which survival letters are specified
		pattern.survivalTriMask = 0;
		for (i = 0; i < survivalPart.length; i += 1) {
			j = letters.indexOf(survivalPart[i]);
			pattern.survivalTriMask |= (1 << j);
		}

		// add birth letters in order to canonical rule name
		for (i = 0; i < letters.length; i += 1) {
			if ((pattern.birthTriMask & (1 << i)) !== 0) {
				birthName += letters[i];
			}
		}

		// add survival letters in order to canonical rule name
		for (i = 0; i < letters.length; i += 1) {
			if ((pattern.survivalTriMask & (1 << i)) !== 0) {
				survivalName += letters[i];
			}
		}

		// create canonical rule name
		if (generationsStates !== -1) {
			canonicalName = survivalName + "/" + birthName + "/" + generationsStates;
		} else {
			canonicalName = "B" + birthName + "/S" + survivalName;
		}

		return canonicalName;
	};

	// create the rule map from birth and survival strings
	/** @returns {string} */
	PatternManager.prototype.createRuleMap = function(/** @type {Pattern} */ pattern, /** @type {string} */ birthPart, /** @type {string} */ survivalPart, /** @type {string} */ base64, /** @type {Uint8Array} */ ruleArray) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ c = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ m = 0,
			/** @type {number} */ mask = 0,
			/** @type {string} */ canonicalName = "",
			/** @type {string} */ birthName = "",
			/** @type {string} */ survivalName = "",
			/** @type {Uint16Array} */ swapArray = this.swapArray,
			/** @type {number} */ power2 = 1 << (this.mapNeighbours + 1),
			/** @type {number} */ fullchars = (power2 / 6) | 0,
			/** @type {Uint8Array} */ tempArray = new Uint8Array(512),
			/** @type {boolean} */ isMargolus = pattern.isMargolus,
			/** @type {boolean} */ isPCA = pattern.isPCA,
			/** @type {boolean} */ isHex = pattern.isHex,
			/** @type {number} */ hexNeighbourhood = pattern.hexNeighbourhood,
			/** @type {boolean} */ isTriangular = pattern.isTriangular,
			/** @type {number} */ triangularNeighbourhood = pattern.triangularNeighbourhood,
			/** @type {boolean} */ isVonNeumann = pattern.isVonNeumann,
			/** @type {number} */ generationsStates = pattern.multiNumStates;

		// check for _none_ rule
		if (pattern.isNone) {
			canonicalName = this.noneRuleName;
		} else {
			// check for Margolus or PCA rule
			if (isMargolus || isPCA) {
				if (isMargolus) {
					canonicalName = "M";
				} else {
					canonicalName = this.pcaRulePrefix.toUpperCase() + ",";
				}
				for (i = 0; i < 16; i += 1) {
					canonicalName += ruleArray[i];
					if (i < 15) {
						canonicalName += ",";
					}
				}
			} else {
				// check for triangular rules
				if (isTriangular) {
					canonicalName = this.createTriangularRuleMap(pattern, birthPart, survivalPart, generationsStates, triangularNeighbourhood);
				} else {
					// create the masks
					mask = 511;
					if (isHex) {
						if (hexNeighbourhood === this.hexTripod) {
							mask = 114;
						} else {
							mask = 254;
						}
					} else {
						if (isVonNeumann) {
							mask = 186;
						}
					}

					// clear the rule array
					tempArray.fill(0);
					ruleArray.fill(0);

					// create swap array for hex
					for (i = 0; i < tempArray.length; i += 1) {
						if (isHex) {
							swapArray[i] = i;
						} else {
							swapArray[i] = (i & 448) >> 6 | i & 56 | (i & 7) << 6;
						}
					}

					// check for base64 map rules
					if (base64 !== "") {
						// create the canonical name
						canonicalName = "MAP";

						// decode the base64 string
						for (i = 0; i < fullchars; i += 1) {
							canonicalName += base64[i];
							c = this.base64Characters.indexOf(base64[i]);
							tempArray[j] = c >> 5;
							j += 1;
							tempArray[j] = (c >> 4) & 1;
							j += 1;
							tempArray[j] = (c >> 3) & 1;
							j += 1;
							tempArray[j] = (c >> 2) & 1;
							j += 1;
							tempArray[j] = (c >> 1) & 1;
							j += 1;
							tempArray[j] = c & 1;
							j += 1;
						}

						// decode final character
						c = this.base64Characters.indexOf(base64[i]);
						tempArray[j] = c >> 5;
						j += 1;
						tempArray[j] = (c >> 4) & 1;
						canonicalName += this.base64Characters[c & ((1 << 5) | (1 << 4))];

						// copy into array using the neighbourhood mask
						for (i = 0; i < 512; i += 1) {
							k = 0;
							m = this.mapNeighbours;
							for (j = 8; j >= 0; j -= 1) {
								if ((mask & (1 << j)) !== 0) {
									if ((i & (1 << j)) !== 0) {
										k |= (1 << m);
									}
									m -= 1;
								}
							}
							ruleArray[swapArray[i]] = tempArray[k];
						}

						// check for generation states
						if (generationsStates !== -1) {
							canonicalName += "/" + generationsStates;
						}
					} else {
						// check for neighbourhoods that are totalistic only
						if (isVonNeumann) {
							// set the von Neumann birth rule
							birthName = this.setTotalisticRuleFromString(ruleArray, birthPart, false, mask);

							// set the von Neumann survival rule
							survivalName = this.setTotalisticRuleFromString(ruleArray, survivalPart, true, mask);
						} else {
							if (isHex) {
								// set the hex birth rule
								birthName = this.setHexRuleFromString(ruleArray, birthPart, false, mask);

								// set the hex survival rule
								survivalName = this.setHexRuleFromString(ruleArray, survivalPart, true, mask);
							} else {
								// set the Moore birth rule
								birthName = this.setRuleFromString(ruleArray, birthPart, false);

								// set the Moore survival rule
								survivalName = this.setRuleFromString(ruleArray, survivalPart, true);
							}
						}

						// create the canonical name
						if (generationsStates !== -1) {
							canonicalName = survivalName + "/" + birthName + "/" + generationsStates;
						} else {
							canonicalName = "B" + birthName + "/S" + survivalName;
						}
					}
				}
			}
		}

		// return the canonical name
		return canonicalName;
	};

	// create n-neighbour counts
	/** @returns {string} */
	PatternManager.prototype.minusN = function(/** @type {string} */ rule, /** @type {number} */ neighbours) {
		var	/** @type {number} */ i = 0,

			// digit to test
			/** @type {string} */ digit = "",

			// result
			/** @type {string} */ result = "";

		// check each neighbourhood value
		for (i = 0; i <= neighbours; i += 1) {
			// create digit to check
			digit = this.validRuleLetters[i];

			// check if digit exists
			if (rule.indexOf(digit) !== -1) {
				result += this.validRuleLetters[neighbours - i];
			}
		}

		// return result
		return result;
	};

	// invert neighbour counts
	/** @returns {string} */
	PatternManager.prototype.invertCounts = function(/** @type {string} */ rule) {
		var	/** @type {number} */ i = 0,

			// digit to test
			/** @type {string} */ digit = "",

			// result
			/** @type {string} */ result = "";

		// check each neighbourhood value
		for (i = 0; i < 9; i += 1) {
			// create digit to check
			digit = this.validRuleLetters[i];

			// check if digit exists
			if (rule.indexOf(digit) === -1) {
				// doesn't exist so add it to result
				result += digit;
			}
		}

		// return inverted counts
		return result;
	};

	// remove whitespace in a string
	/** @returns {string} */
	PatternManager.prototype.removeWhiteSpace = function(/** @type {string} */ string) {
		// result
		var	/** @type {string} */ result = string,

			// counter
			/** @type {number} */ i = 0;

		// check if there is a whitespace in the string
		if (string.indexOf(" ") !== -1) {
			// clear the result
			result = "";

			// remove every space
			while (i < string.length) {
				// check if the next character is a space
				if (string[i] !== " ") {
					// not space so add to result
					result += string[i];
				}
				i += 1;
			}
		}

		// return the string
		return result;
	};

	// return Wolfram RuleTable transition
	/** @returns {string} */
	PatternManager.prototype.wolframTransition = function(/** @type {number} */ transition, /** @type {number} */ from, /** @type {number} */ to) {
		var	/** @type {string} */ result = "",
			/** @type {number} */ nw = ((transition & 4) >> 2) * from,
			/** @type {number} */ n = ((transition & 2) >> 1) * from,
			/** @type {number} */ ne = (transition & 1) * from;

		result = "0" + n + ne + "00000" + nw + to + "\n";

		return result;
	};

	// generate WolframRuleTable
	PatternManager.prototype.generateWolframRuleTable = function(/** @type {Pattern} */ pattern, /** @type {number} */ number) {
		// create RuleTable header
		var	/** @type {string} */ ruleTable = "n_states:3\nneighborhood:Moore\nsymmetries:none\n",
			/** @type {number} */ i = 0,
			/** @type {Script} */ reader = null;

		// add the transitions
		for (i = 0; i < 8; i += 1) {
			if ((number & (1 << i)) === 0) {
				ruleTable += this.wolframTransition(i, 1, 2);
			}
		}

		for (i = 7; i >= 0; i -= 1) {
			if ((number & (1 << (7 - i))) !== 0) {
				ruleTable += this.wolframTransition(i, 2, 1);
			}
		}

		// tokenize the input
		reader = new Script(ruleTable, true);

		// now decode with the Table decoder
		this.decodeTable(pattern, reader);

		// create the colours
		reader = new Script(ViewConstants.wolframEmulationColours, true);
		this.decodeColours(pattern, reader);

		// mark using Wolfram emulation
		this.wolframEmulation = true;
	};

	// decode Wolfram rule
	/** @returns {boolean} */
	PatternManager.prototype.decodeWolfram = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule, /** @type {Uint8Array} */ ruleArray) {
		var	/** @type {boolean} */ valid = true,

			// rule number
			/** @type {number} */ number = 0,

			// new number
			/** @type {number} */ newNumber = 0,

			/** @type {number} */ originalNumber = 0,

			// digit value
			/** @type {number} */ digit = 0,

			// counter
			/** @type {number} */ i = 1;

		// check rule number
		while (i < rule.length && valid) {
			digit = this.decimalDigits.indexOf(rule[i]);
			if (digit !== -1) {
				number = number * 10 + digit;
			} else {
				this.failureReason = "Illegal character in Wolfram rule";
				valid = false;
			}

			i += 1;
		}

		// check if number is valid
		if (valid) {
			if (number < 0 || number > 255) {
				this.failureReason = "Wolfram rule number must be from 0-255";
				valid = false;
			} else {
				// check for odd rules
				if ((number & 1) !== 0) {
					// check for B0
					if ((number & 128) !== 0) {
						// save original number
						originalNumber = number;

						// reverse bits
						newNumber = 0;
						for (i = 0; i < 8; i += 1) {
							if (number & (1 << i)) {
								newNumber |= (1 << (7 - i));
							}
						}

						// negate bits
						number = 0;
						for (i = 0; i < 8; i += 1) {
							if ((newNumber & (1 << i)) == 0) {
								number |= (1 << i);
							}
						}

						// build the map
						this.createWolframMap(ruleArray, number);

						// save the rule number
						number = originalNumber;
						pattern.wolframRule = number;
					} else {
						// use RuleTable to emulate
						this.generateWolframRuleTable(pattern, number);
					}
				} else {
					// build the map
					this.createWolframMap(ruleArray, number);

					// save the rule number
					pattern.wolframRule = number;
				}

				// save the canonical name
				pattern.ruleName = "W" + number;
			}
		}

		return valid;
	};

	// add postfixes to canonical rule name
	PatternManager.prototype.addNamePostfixes = function(/** @type {Pattern} */ pattern, /** @type {string} */ base64, /** @type {boolean} */ ignoreAliases) {
		var	/** @type {string|null} */ aliasName = null,
			/** @type {string} */ nameLtL = "";

		// add the neighbourhood
		if (base64 === "") {
			if (pattern.isHex) {
				pattern.ruleName += "H";
				if (pattern.hexNeighbourhood === this.hexTripod) {
					pattern.ruleName += "T";
				}
			} else {
				if (pattern.isVonNeumann) {
					pattern.ruleName += "V";
				} else {
					if (pattern.isTriangular) {
						switch (pattern.triangularNeighbourhood) {
						case this.triangularAll:
							pattern.ruleName += this.triangularPostfix.toUpperCase();
							break;
						case this.triangularEdges:
							pattern.ruleName += this.triangularEdgesPostfix.toUpperCase();
							break;
						case this.triangularVertices:
							pattern.ruleName += this.triangularVerticesPostfix.toUpperCase();
							break;
						case this.triangularInner:
							pattern.ruleName += this.triangularInnerPostfix.toUpperCase();
							break;
						case this.triangularOuter:
							pattern.ruleName += this.triangularOuterPostfix.toUpperCase();
							break;
						case this.triangularBiohazard:
							pattern.ruleName += this.triangularBiohazardPostfix.toUpperCase();
							break;
						case this.triangularRadiation:
							pattern.ruleName += this.triangularRadiationPostfix.toUpperCase();
							break;
						}
					}
				}
			}
		}

		// see if there is an alias name for this rule
		if (!ignoreAliases) {
			aliasName = AliasManager.getAliasFromRule(pattern.ruleName);
		}

		if (aliasName === null) {
			// try alternate M1 form for M0 LtL rules
			if (pattern.isLTL && pattern.middleLTL === 0) {
				// build the rule string
				nameLtL = "R" + pattern.rangeLTL + ",C" + pattern.multiNumStates + ",M1,S" + pattern.SminLTL + ".." + pattern.SmaxLTL + ",B" + pattern.BminLTL + ".." + pattern.BmaxLTL + ",N";
				switch (pattern.neighborhoodLTL) {
					case this.mooreHROT:
						nameLtL += "M";
						break;
					case this.vonNeumannHROT:
						nameLtL += "N";
						break;
					case this.circularHROT:
						nameLtL += "C";
						break;
					case this.crossHROT:
						nameLtL += "+";
						break;
					case this.saltireHROT:
						nameLtL += "X";
						break;
					case this.starHROT:
						nameLtL += "*";
						break;
					case this.l2HROT:
						nameLtL += "2";
						break;
					case this.hexHROT:
						nameLtL += "H";
						break;
					case this.checkerHROT:
						nameLtL += "B";
						break;
					case this.alignedCheckerHROT:
						nameLtL += "D";
						break;
					case this.hashHROT:
						nameLtL += "#";
						break;
					case this.customHROT:
						nameLtL += "@" + pattern.customNeighbourhood + pattern.customGridType;
						break;
					case this.tripodHROT:
						nameLtL += "3";
						break;
					case this.asteriskHROT:
						nameLtL += "A";
						break;
					case this.triangularHROT:
						nameLtL += "L";
						break;
					case this.gaussianHROT:
						nameLtL += "G";
						break;
					case this.weightedHROT:
						nameLtL += "W" + pattern.customNeighbourhood + pattern.customGridType;
						break;
					case this.cornerEdgeHROT:
						nameLtL += "F" + pattern.cornerEdgeCanonical(pattern.rangeLTL);
						break;
				}

				// lookup alias
				aliasName = AliasManager.getAliasFromRule(nameLtL);
			}
		}

		// check for History
		if (pattern.isHistory) {
			pattern.ruleName += this.properHistoryPostfix;
		}

		// check for Super
		if (pattern.isSuper) {
			pattern.ruleName += this.properSuperPostfix;
		}

		// check for Extended
		if (pattern.isExtended) {
			pattern.ruleName += this.properExtendedPostfix;
		}

		// check for bounded grid
		if (pattern.gridType !== -1) {
			// add grid type
			pattern.ruleName += ":" + this.boundedGridTypes[pattern.gridType].toUpperCase();

			// add width
			pattern.ruleName += pattern.gridWidth;

			// check for sphere axis
			if (!pattern.gridSphereAxisTopLeft) {
				pattern.ruleName += "*";
			}

			// check for horizontal twist
			if (pattern.gridHorizontalTwist) {
				pattern.ruleName += "*";
			}

			// check for horizontal shift
			if (pattern.gridHorizontalShift) {
				if (pattern.gridHorizontalShift < 0) {
					pattern.ruleName += pattern.gridHorizontalShift;
				} else {
					pattern.ruleName += "+" + pattern.gridHorizontalShift;
				}
			}

			// add more if the grid type is not Sphere
			if (pattern.gridType !== 4) {
				// add the height
				pattern.ruleName += "," + pattern.gridHeight;

				// check for horizontal twist
				if (pattern.gridVerticalTwist) {
					pattern.ruleName += "*";
				}

				// check for horizontal shift
				if (pattern.gridVerticalShift) {
					if (pattern.gridVerticalShift < 0) {
						pattern.ruleName += pattern.gridVerticalShift;
					} else {
						pattern.ruleName += "+" + pattern.gridVerticalShift;
					}
				}

			}
		}

		// add the alias if present
		if (aliasName !== null) {
			// check for blank Conway rule
			if (aliasName === "") {
				aliasName = "Life";
			}

			// check for [R]History
			if (pattern.isHistory) {
				aliasName += this.properHistoryPostfix;
			}

			// check for [R]Super
			if (pattern.isSuper) {
				aliasName += this.properSuperPostfix;
			}

			// check for [R]Extended
			if (pattern.isExtended) {
				aliasName += this.properExtendedPostfix;
			}

			// save the alias name
			pattern.aliasName = aliasName;
		}
	};

	// validate base64 MAP string
	/** @returns {number} */
	PatternManager.prototype.validateMap = function(/** @type {string} */ base64, /** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ testLen = this.map512Length,
			/** @type {number} */ currentLen = base64.length;

		// compute the length
		if (currentLen >= testLen) {
			// Moore
			this.mapNeighbours = 8;
		} else {
			testLen = this.map128Length;
			if (currentLen >= testLen) {
				// Hex
				this.mapNeighbours = 6;
				pattern.isHex = true;
			} else {
				testLen = this.map32Length;
				if (currentLen >= testLen) {
					// von Neumann
					this.mapNeighbours = 4;
					pattern.isVonNeumann = true;
				} else {
					// invalid map length
					testLen = -1;
				}
			}
		}

		// check map characters
		if (testLen >= 0) {
			for (i = 0; i < testLen; i += 1) {
				if (this.base64Characters.indexOf(base64[i]) === -1) {
					testLen = -1;
				}
			}
		}

		return testLen;
	};

	// decode part of LTL rule
	/** @returns {number} */
	PatternManager.prototype.decodeLTLpart = function (/** @type {string} */ rule, /** @type {string} */ part, /** @type {number} */ lower, /** @type {number} */ upper, /** @type {string} */ partof, /** @type {Pattern} */ pattern) {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ partlen = part.length,
			/** @type {string} */ rulepart = rule.substring(this.index, this.index + partlen),
			// ASCII 0
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			/** @type {number} */ asciiNine = String("9").charCodeAt(0),
			/** @type {string} */ next,
			/** @type {number} */ nextCode,
			/** @type {number} */ range = pattern.rangeLTL;

		// check if the next character is the expected part
		if (rulepart !== part) {
			// check for comma
			if (part[0] === ",") {
				if (rulepart[0] === ",") {
					rulepart = rulepart.substring(1);
				}
				part = part.substring(1);
			}
			this.failureReason = "LtL expected '" + part.toUpperCase() + "' got '" + rulepart.toUpperCase() + "'";
			this.index = -1;
		} else {
			// remove comma from part if present
			if (part[0] === ",") {
				part = part.substring(1);
			}
			this.index += partlen;
			if (this.index < rule.length) {
				next = rule[this.index];
				nextCode = next.charCodeAt(0);
			} else {
				next = "";
				nextCode = -1;
			}

			// check for N part
			if (part === "n") {
				// check for neighborhood
				switch(next) {
					case "m":
						this.index += 1;
						result = this.mooreHROT;
						break;

					case "n":
						this.index += 1;
						result = this.vonNeumannHROT;
						break;

					case "c":
						this.index += 1;
						result = this.circularHROT;
						break;

					case "+":
						this.index += 1;
						result = this.crossHROT;
						break;

					case "x":
						this.index += 1;
						result = this.saltireHROT;
						break;

					case "*":
						this.index += 1;
						result = this.starHROT;
						break;

					case "2":
						this.index += 1;
						result = this.l2HROT;
						break;

					case "h":
						this.index += 1;
						result = this.hexHROT;
						break;

					case "b":
						this.index += 1;
						result = this.checkerHROT;
						break;

					case "d":
						this.index += 1;
						result = this.alignedCheckerHROT;
						break;

					case "#":
						this.index += 1;
						result = this.hashHROT;
						break;

					case "@":
						this.index += 1;
						result = this.readCustomNeighbourhood(rule, range, "LtL", pattern);
						if (result === -1) {
							this.index = -1;
						}
						break;

					case "3":
						this.index += 1;
						result = this.tripodHROT;
						break;

					case "a":
						this.index += 1;
						result = this.asteriskHROT;
						break;

					case "l":
						this.index += 1;
						result = this.triangularHROT;
						break;

					case "g":
						this.index += 1;
						result = this.gaussianHROT;
						break;

					case "w":
						this.index += 1;
						result = this.readWeightedNeighbourhood(rule, range, "LtL", pattern);
						if (result === -1) {
							this.index = -1;
						}
						break;

					case "f":
						this.index += 1;
						result = this.readCornerEdge(rule, range, "LtL", pattern);
						if (result === -1) {
							this.index = -1;
						}
						break;

					default:
						this.failureReason = "LtL 'N' [ABCDFGHLMNWX23*+#@] got 'N" + next.toUpperCase() + "'";
						this.index = -1;
						break;
				}
			} else {
				// check for digit
				if (nextCode < asciiZero || nextCode > asciiNine) {
					this.failureReason = "LtL '" + partof + part.toUpperCase() + "' needs a number";
					this.index = -1;
				} else {
					// read digits
					while (nextCode >= asciiZero && nextCode <= asciiNine) {
						result = 10 * result + (nextCode - asciiZero);
						this.index += 1;
						if (this.index < rule.length) {
							nextCode = rule[this.index].charCodeAt(0);
						} else {
							nextCode = -1;
						}
					}

					// check range
					if (lower !== -1) {
						if (result < lower) {
							this.failureReason = "LtL '" + partof + part.toUpperCase() + result + "' < " + lower;
							this.index = -1;
						}
					}
					if (upper !== -1) {
						if (result > upper) {
							this.failureReason = "LtL '" + partof + part.toUpperCase() + result + "' > " + upper;
							this.index = -1;
						}
					}
				}
			}
		}

		return result;
	};

	// determine the maximum neighbours in a neighbourhood
	// result excludes center cell
	/** @returns {number} */
	PatternManager.prototype.maxNeighbours = function(/** @type {number} */ range, /** @type {number} */ neighbourhood, /** @type {number} */ customCount) {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ r2 = 0;

		switch(neighbourhood) {
			case this.mooreHROT:
				result = (range * 2 + 1) * (range * 2 + 1) - 1;
				break;

			case this.vonNeumannHROT:
				result = 2 * range * (range + 1);
				break;

			case this.circularHROT:
				count = 0;
				r2 = range * range + range;
				for (i = -range; i <= range; i += 1) {
					width = 0;
					while ((width + 1) * (width + 1) + (i * i) <= r2) {
						width += 1;
					}
					count += 2 * width + 1;
				}
				result = count - 1;
				break;

			case this.crossHROT:
				result = range * 4;
				break;

			case this.saltireHROT:
				result = range * 4;
				break;

			case this.starHROT:
				result = range * 8;
				break;

			case this.l2HROT:
				count = 0;
				r2 = range * range;
				for (i = -range; i <= range; i += 1) {
					width = 0;
					while ((width + 1) * (width + 1) + (i * i) <= r2) {
						width += 1;
					}
					count += 2 * width + 1;
				}
				result = count - 1;
				break;

			case this.hexHROT:
				result = (range * 2 + 1) * (range * 2 + 1) - (range * (range + 1)) - 1;
				break;

			case this.checkerHROT:
				result = ((range * 2 + 1) * (range * 2 + 1) - 1) / 2;
				break;

			case this.alignedCheckerHROT:
				result = ((range * 2 + 1) * (range * 2 + 1) - 1) / 2;
				break;

			case this.hashHROT:
				result = range * 8;
				break;

			case this.customHROT:
				result = customCount;
				break;

			case this.tripodHROT:
				result = range * 3;
				break;

			case this.asteriskHROT:
				result = range * 6;
				break;

			case this.triangularHROT:
				result = (range * 4 + 1) * (range * 2 + 1) - (range * 2 * range) - 1;
				break;

			case this.gaussianHROT:
				result = (range + 1) * (range + 1) * (range + 1) * (range + 1);
				break;

			case this.weightedHROT:
				result = customCount;
				break;

			case this.cornerEdgeHROT:
				result = 8;
				break;
		}

		return result;
	};

	// decode LTL rule in Rr,Cc,Mm,Ssmin..smax,Bbmin..bmax,Nn format
	/** @returns {boolean} */
	PatternManager.prototype.decodeLTLMC = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule) {
		var	/** @type {number} */ value = 0,
			/** @type {boolean} */ result = false,
			/** @type {number} */ maxCells = 0;

		// reset string index
		this.index = 0;

		// decode R part
		value = this.decodeLTLpart(rule, "r", this.minRangeLTL, this.maxRangeLTL, "", pattern);
		if (this.index !== -1) {
			pattern.rangeLTL = value;

			// decode C part
			value = this.decodeLTLpart(rule, ",c", this.minStatesLTL, this.maxStatesLTL, "", pattern);
			if (this.index !== -1) {
				// ensure number of states is at least 2
				if (value < 2) {
					value = 2;
				}
				pattern.multiNumStates = value;

				// decode M part
				value = this.decodeLTLpart(rule, ",m", this.minMiddleLTL, this.maxMiddleLTL, "", pattern);
				if (this.index !== -1) {
					pattern.middleLTL = value;

					// decode S first part
					value = this.decodeLTLpart(rule, ",s", 0, -1, "", pattern);
					if (this.index !== -1) {
						pattern.SminLTL = value;

						// decode second S part
						value = this.decodeLTLpart(rule, "..", pattern.SminLTL, -1, "S", pattern);
						if (this.index !== -1) {
							pattern.SmaxLTL = value;

							// decode first B part
							value = this.decodeLTLpart(rule, ",b", 0, -1, "", pattern);
							if (this.index !== -1) {
								pattern.BminLTL = value;

								// decode second B part
								value = this.decodeLTLpart(rule, "..", pattern.BminLTL, -1, "B", pattern);
								if (this.index !== -1) {
									pattern.BmaxLTL = value;

									// decode N part
									value = this.decodeLTLpart(rule, ",n", -1, -1, "", pattern);
									if (this.index !== -1) {
										pattern.neighborhoodLTL = value;

										// mark rule valid
										result = true;
									}
								}
							}
						}
					}
				}
			}
		}

		// final validation
		if (result) {
			// check for trailing characters
			if (this.index !== rule.length) {
				result = false;
				this.failureReason = "LtL invalid characters after rule";
			} else {
				// check Smax and Bmax based on range and neighborhood
				maxCells = this.maxNeighbours(pattern.rangeLTL, pattern.neighborhoodLTL, pattern.customNeighbourCount);

				// adjust max cells by middle cell setting
				maxCells += pattern.middleLTL;
				if (pattern.BminLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'B" + pattern.BminLTL + "..' > " + maxCells;
				}
				if (pattern.BmaxLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'B.." + pattern.BmaxLTL + "' > " + maxCells;
				}
				if (pattern.SminLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'S" + pattern.SminLTL + "..' > " + maxCells;
				}
				if (pattern.SmaxLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'S.." + pattern.SmaxLTL + "' > " + maxCells;
				}
			}
		}

		return result;
	};

	// decode LTL rule in r,bmin,bmax,smin,smax format
	/** @returns {boolean} */
	PatternManager.prototype.decodeLTLnum = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule) {
		var	/** @type {number} */ value = 0,
			/** @type {boolean} */ result = false,
			/** @type {number} */ maxCells = 0;

		// reset string index
		this.index = 0;

		// set unspecified defaults: 2 states, whether middle is included (yes) and neighborhood (Moore)
		pattern.multiNumStates = 2;
		pattern.middleLTL = 1;
		pattern.neighborhoodLTL = this.mooreHROT;

		// decode R part
		value = this.decodeLTLpart(rule, "", this.minRangeLTL, this.maxRangeLTL, "", pattern);
		if (this.index !== -1) {
			pattern.rangeLTL = value;

			// decode first B part
			value = this.decodeLTLpart(rule, ",", 0, -1, "", pattern);
			if (this.index !== -1) {
				pattern.BminLTL = value;

				// decode second B part
				value = this.decodeLTLpart(rule, ",", pattern.BminLTL, -1, "B", pattern);
				if (this.index !== -1) {
					pattern.BmaxLTL = value;

					// decode S first part
					value = this.decodeLTLpart(rule, ",", 0, -1, "", pattern);
					if (this.index !== -1) {
						pattern.SminLTL = value;

						// decode second S part
						value = this.decodeLTLpart(rule, ",", pattern.SminLTL, -1, "S", pattern);
						if (this.index !== -1) {
							pattern.SmaxLTL = value;

							// mark rule valid
							result = true;
						}
					}
				}
			}
		}

		// final validation
		if (result) {
			// check for trailing characters
			if (this.index !== rule.length) {
				result = false;
				this.failureReason = "LtL invalid characters after rule";
			} else {
				// check Smax and Bmax based on range and neighborhood (which is always Moore)
				maxCells = (pattern.rangeLTL * 2 + 1) * (pattern.rangeLTL * 2 + 1);
				if (pattern.BminLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'B" + pattern.BminLTL + "..' > " + maxCells;
				}
				if (pattern.BmaxLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'B.." + pattern.BmaxLTL + "' > " + maxCells;
				}
				if (pattern.SminLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'S" + pattern.SminLTL + "..' > " + maxCells;
				}
				if (pattern.SmaxLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'S.." + pattern.SmaxLTL + "' > " + maxCells;
				}
			}
		}

		return result;
	};

	// decode LTL rule in RBTST format
	/** @returns {boolean} */
	PatternManager.prototype.decodeLTLRBTST = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule) {
		var	/** @type {number} */ value = 0,
			/** @type {boolean} */ result = false,
			/** @type {number} */ maxCells = 0;

		// reset string index
		this.index = 0;

		// set number of states to the default unless set by generations prefix
		if (pattern.multiNumStates === -1) {
			pattern.multiNumStates = 2;
		}

		// set unspecified defaults: whether middle is included (yes) and neighborhood (Moore)
		pattern.middleLTL = 1;
		pattern.neighborhoodLTL = this.mooreHROT;

		// decode R part
		value = this.decodeLTLpart(rule, "r", this.minRangeLTL, this.maxRangeLTL, "", pattern);
		if (this.index !== -1) {
			pattern.rangeLTL = value;

			// decode first B part
			value = this.decodeLTLpart(rule, "b", 0, -1, "", pattern);
			if (this.index !== -1) {
				pattern.BminLTL = value;

				// decode second B part
				value = this.decodeLTLpart(rule, "t", pattern.BminLTL, -1, "B", pattern);
				if (this.index !== -1) {
					pattern.BmaxLTL = value;

					// decode S first part
					value = this.decodeLTLpart(rule, "s", 0, -1, "", pattern);
					if (this.index !== -1) {
						pattern.SminLTL = value;

						// decode second S part
						value = this.decodeLTLpart(rule, "t", pattern.SminLTL, -1, "S", pattern);
						if (this.index !== -1) {
							pattern.SmaxLTL = value;

							// mark rule valid
							result = true;
						}
					}
				}
			}
		}

		// final validation
		if (result) {
			// check for trailing characters
			if (this.index !== rule.length) {
				result = false;
				this.failureReason = "LtL invalid characters after rule";
			} else {
				// check Smax and Bmax based on range and neighborhood (which is always Moore)
				maxCells = (pattern.rangeLTL * 2 + 1) * (pattern.rangeLTL * 2 + 1);
				if (pattern.BminLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'B" + pattern.BminLTL + "' > " + maxCells;
				}
				if (pattern.BmaxLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'B..T" + pattern.BmaxLTL + "' > " + maxCells;
				}
				if (pattern.SminLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'S" + pattern.SminLTL + "..' > " + maxCells;
				}
				if (pattern.SmaxLTL > maxCells) {
					result = false;
					this.failureReason = "LtL 'S..T" + pattern.SmaxLTL + "' > " + maxCells;
				}
			}
		}

		return result;
	};

	// decode HROT hex digits
	/** @returns {boolean} */
	PatternManager.prototype.readHexDigits = function(/** @type {string} */ rule, /** @type {string} */ which, /** @type {number} */ numDigits, /** @type {Pattern} */ pattern, /** @type {Allocator} */ allocator) {
		var	/** @type {boolean} */ result = false,
			/** @type {number} */ hexValue = 0,
			/** @type {Uint8Array} */ list = null,
			/** @type {string} */ allocName = "HROT.",
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ extra = 0;

		// check there are enough digits
		if (this.index + numDigits > rule.length) {
			this.failureReason = "HROT '" + which + "' needs " + numDigits + " hex digits";
		} else {
			i = 0;
			hexValue = 0;
			// check all of the digits are hex
			while (i < numDigits && hexValue !== -1) {
				hexValue = this.hexCharacters.indexOf(rule[this.index]);
				if (hexValue !== -1) {
					this.index += 1;
					i += 1;
				}
			}
			if (hexValue === -1) {
				this.failureReason = "HROT '" + which + "' expected hex got '" + rule[this.index] + "'";
			} else {
				// allocate array
				if (which === "B") {
					allocName += "births";
				} else {
					allocName += "survivals";
					extra = 1;
				}
				// 4 bits per digit plus zero entry
				list = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, (numDigits << 2) + 1 + extra, allocName));

				// populate array
				j = 0;
				list[j] = 0;
				j += 1;
				i -= 1;
				if (which === "S") {
					list[j] = 0;
					j += 1;
				}
				while (i >= 0) {
					hexValue = this.hexCharacters.indexOf(rule[this.index - numDigits + i]);
					i -= 1;
					list[j] = hexValue & 1;
					j += 1;
					list[j] = (hexValue >> 1) & 1;
					j += 1;
					list[j] = (hexValue >> 2) & 1;
					j += 1;
					list[j] = (hexValue >> 3) & 1;
					j += 1;
				}

				// save array in the pattern
				if (which === "B") {
					pattern.birthHROT = list;
				} else {
					pattern.survivalHROT = list;
				}
				result = true;
			}
		}

		return result;
	};

	// decode HROT number (returns -1 if number is invalid)
	/** @returns {number} */
	PatternManager.prototype.decodeHROTNumber = function(/** @type {string} */ rule, /** @type {string} */ partName) {
		var	/** @type {number} */ value = -1,
			// ASCII 0
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			/** @type {number} */ asciiNine = String("9").charCodeAt(0),
			/** @type {number} */ nextCode = 0;

		this.index += 1;
		if (this.index < rule.length) {
			nextCode = rule[this.index].charCodeAt(0);
			if (nextCode < asciiZero || nextCode > asciiNine) {
				this.failureReason = "HROT '" + partName + "' needs a number";
			} else {
				// read digits
				value = nextCode - asciiZero;
				this.index += 1;
				nextCode = -1;
				if (this.index < rule.length) {
					nextCode = rule[this.index].charCodeAt(0);
				}
				while (nextCode >= asciiZero && nextCode <= asciiNine) {
					value = 10 * value + (nextCode - asciiZero);
					this.index += 1;
					if (this.index < rule.length) {
						nextCode = rule[this.index].charCodeAt(0);
					} else {
						nextCode = -1;
					}
				}
			}
		} else {
			this.failureReason = "HROT '" + partName + "' needs a number";
		}
		return value;
	};

	// decode HROT number or # (returns -1 if numer is invalid or -2 if hash symbol)
	/** @returns {number} */
	PatternManager.prototype.decodeHROTNumberOrHash = function(/** @type {string} */ rule, /** @type {string} */ partName) {
		var	/** @type {number} */ value = -1;

		if (this.index < rule.length) {
			if (rule[this.index + 1] === "#") {
				this.index += 2;
				value = -2;
			} else {
				value = this.decodeHROTNumber(rule, partName);
			}
		}
		return value;
	};

	// decode HROT range
	/** @returns {boolean} */
	PatternManager.prototype.decodeHROTRange = function(/** @type {string} */ rule, /** @type {Uint8Array} */ list, /** @type {string} */ partName, /** @type {number} */ maxCount, /** @type {boolean} */ outer) {
		var	/** @type {boolean} */ result = true,
			/** @type {number} */ lower = -1,
			/** @type {number} */ upper = -1,
			/** @type {number} */ i = 0;

		// if not outer totalistic then include the middle in the count
		if (outer && partName === "S") {
			maxCount += 1;
		}

		// get lower range value
		lower = this.decodeHROTNumber(rule, partName);

		// if not present then clear error - it's valid for no range to be specified
		if (lower === -1) {
			this.failureReason = "";
		}

		// decode the upper range if present
		while (result && lower !== -1) {
			// check if next character is a "-"
			upper = -1;
			if (this.index < rule.length && rule[this.index] === "-") {
				upper = this.decodeHROTNumber(rule, partName);
				if (upper === -1) {
					this.failureReason = "HROT '" + partName + lower + "-' needs a number";
					result = false;
				}
			}
			if (result) {
				if (upper === -1) {
					upper = lower;
				}
				if (lower > upper) {
					this.failureReason = "HROT '" + partName + lower + "-" + upper + "' wrong order";
					result = false;
				}
				if (result) {
					if (partName === "S") {
						this.maxSurvivalHROT = upper;
						// algos include middle cell so if rule is outer totalistic add middle cell count for survival
						if (outer) {
							lower += 1;
							upper += 1;
						}
					} else {
						this.maxBirthHROT = upper;
					}

					if (lower > maxCount) {
						lower = maxCount;
					}
					if (upper > maxCount) {
						upper = maxCount;
					}
					for (i = lower; i <= upper; i += 1) {
						list[i] = 1;
					}
					lower = -1;
					if (this.index < rule.length && rule[this.index] === ",") {
						lower = this.decodeHROTNumber(rule, partName);
						if (lower === -1) {
							// no number so preserve command
							this.index -= 1;
							this.failureReason = "";
						}
					}
				}
			}
		}

		return result;
	};

	// read weighted HROT neighbourhood
	// rule parameter is lower case
	/** @returns {number} */
	PatternManager.prototype.readWeightedNeighbourhood = function(/** @type {string} */ rule, /** @type {number} */ range, /** @type {string} */ family, /** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = this.index,
			/** @type {number} */ l = rule.length,
			/** @type {number} */ j = 0,
			/** @type {number} */ needed1 = (range * 2 + 1) * (range * 2 + 1),
			/** @type {number} */ needed2 = needed1 + needed1,
			/** @type {number} */ value = 0,
			/** @type {number} */ numRead = 0,
			/** @type {number} */ numSW = 0,
			/** @type {number} */ neighbourLetter = 0,
			/** @type {Array<number>} */ weights = [],
			/** @type {Array<number>} */ stateWeights = [],
			/** @type {number} */ maxStateWeight = 0,
			/** @type {number} */ result = this.weightedHROT;

		// set default grid type
		pattern.customGridType = "";

		// check how long hex string is
		while (i < l && this.hexCharacters.indexOf(rule[i]) !== -1) {
			i += 1;
		}
		numRead = i - this.index;

		// check for length 1
		if (numRead === needed1) {
			while (this.index < i) {
				value = this.hexCharacters.indexOf(rule[this.index]);
				// check for negative
				if ((value & 8) !== 0) {
					value = -(value & 7);
				}
				weights[weights.length] = value;
				this.index += 1;
			}
		} else {
			// check for length 2
			if (numRead === needed2) {
				while (this.index < i) {
					value = this.hexCharacters.indexOf(rule[this.index]) << 4;
					this.index += 1;
					value |= this.hexCharacters.indexOf(rule[this.index]);
					this.index += 1;
					if ((value & 128) !== 0) {
						value = -(value & 127);
					}
					weights[weights.length] = value;
				}
			} else {
				// invalid number of digits
				this.failureReason = family + " 'NW' needs " + String(needed1) + " or " + String(needed2) + " hex digits";
				result = -1;
			}
		}

		// check for optional state weights
		if (result !== -1) {
			if (rule[this.index] === ",") {
				this.index += 1;
				i = this.index;

				// check how long hex string is
				while (i < l && this.hexCharacters.indexOf(rule[i]) !== -1) {
					i += 1;
				}
				numSW = i - this.index;

				if (numSW !== pattern.multiNumStates) {
					this.failureReason = family + " 'NW' needs " + String(pattern.multiNumStates) + " state weights";
					result = -1;
				} else {
					// read state weights and compute the maximum
					for (i = 0; i < pattern.multiNumStates; i += 1) {
						value = this.hexCharacters.indexOf(rule[this.index]);
						this.index += 1;
						stateWeights[stateWeights.length] = value;
						if (value > maxStateWeight) {
							maxStateWeight = value;
						}
					}
				}
			} else {
				// no state weights so set maximum to 1
				maxStateWeight = 1;
			}
		}

		// check for hex grid type postfix
		if (result !== -1) {
			if (this.index < l) {
				if (rule[this.index] === "h") {
					pattern.customGridType = "H";
					this.index += 1;
					neighbourLetter = 1;
				} else {
					if (rule[this.index] === "l") {
						pattern.customGridType = "L";
						this.index += 1;
						neighbourLetter = 1;
					}
				}
			}
		}

		// check if string is valid
		if (result !== -1) {
			// sum weights ignoring negatives for maximum neighbour count
			value = 0;
			for (j = 0; j < weights.length; j += 1) {
				if (weights[j] > 0) {
					value += weights[j] * maxStateWeight;
				}
			}
			if (stateWeights.length > 0) {
				pattern.customNeighbourhood = rule.substring(this.index - (numRead + numSW + 1) - neighbourLetter, this.index - neighbourLetter).toLowerCase();
			} else {
				pattern.customNeighbourhood = rule.substring(this.index - numRead - neighbourLetter, this.index - neighbourLetter).toLowerCase();
			}
			pattern.customNeighbourCount = value;
			pattern.weightedNeighbourhood = weights;
			pattern.weightedStates = stateWeights;
		}

		// clear settings if decode failed
		if (result === -1) {
			pattern.customNeighbourhood = "";
			pattern.customNeighbourCount = -1;
			pattern.weightedNeighbourhood = null;
			pattern.weightedStates = null;
		}

		return result;
	};

	// read number from string
	/** @returns {number} */
	PatternManager.prototype.readNumberFromIndex = function(/** @type {string} */ str, /** @type {number} */ l) {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ code = 0,
			/** @type {boolean} */ readDigit = false,
			/** @type {boolean} */ finished = false;

		while (!finished && this.index < l) {
			code = str.charCodeAt(this.index);
			if (code >= 48 && code <= 57) {
				readDigit = true;
				result = result * 10 + (code - 48);
				this.index += 1;
			} else {
				finished = true;
			}
		}

		if (!readDigit) {
			result = -1;
		}

		return result;
	};

	// read corner edge neighbourhood
	// rule parameter is lower case
	/** @returns {number} */
	PatternManager.prototype.readCornerEdge = function(/** @type {string} */ rule, /** @type {number} */ range, /** @type {string} */ family, /** @type {Pattern} */ pattern) {
		var	/** @type {number} */ l = rule.length,
			/** @type {string} */ item = "",
			/** @type {number} */ corner = -1,
			/** @type {number} */ edge = -1,
			/** @type {number} */ result = -1;

		// check if corner or edge are specified
		if (this.index >= l) {
			pattern.cornerRange = range;
			pattern.edgeRange = range;
			result = this.cornerEdgeHROT;
			return result;
		}

		// check for C or E
		item = rule[this.index].toUpperCase();
		this.index += 1;

		while (item === "C" || item === "E") {
			if (item === "C") {
				if (corner === -1) {
					corner = this.readNumberFromIndex(rule, l);
					if (corner === -1) {
						corner = range;
					}
					if (corner < 1 || corner > this.maxRangeHROT) {
						this.failureReason = family + " 'NF' invalid corner range";
						return result;
					}
				} else {
					this.failureReason = family + " 'NF' duplicate 'C'";
					return result;
				}
			} else {
				if (edge === -1) {
					edge = this.readNumberFromIndex(rule, l);
					if (edge === -1) {
						edge = range;
					}
					if (edge < 1 || edge > this.maxRangeHROT) {
						this.failureReason = family + " 'NF' invalid edge range";
						return result;
					}
				} else {
					this.failureReason = family + " 'NF' duplicate 'E'";
					return result;
				}
			}
			if (this.index < l) {
				item = rule[this.index].toUpperCase();
				this.index += 1;
			} else {
				item = "";
			}
		}

		// step back if last character was not valid
		if (item !== "") {
			this.index -= 1;
		}

		// save settings
		if (corner === -1) {
			pattern.cornerRange = range;
		} else {
			pattern.cornerRange = corner;
		}

		if (edge === -1) {
			pattern.edgeRange = range;
		} else {
			pattern.edgeRange = edge;
		}

		// report as valid neighbourhood
		result = this.cornerEdgeHROT;
		return result;
	};

	// read custom HROT neighbourhood
	// rule parameter is lower case
	/** @returns {number} */
	PatternManager.prototype.readCustomNeighbourhood = function(/** @type {string} */ rule, /** @type {number} */ range, /** @type {string} */ family, /** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = this.index,
			/** @type {number} */ l = rule.length,
			/** @type {number} */ numRead = 0,
			/** @type {number} */ neededLength = ((range * 2 + 1) * (range * 2 + 1) - 1) / 4,
			/** @type {number} */ next = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ result = this.customHROT;

		// set default grid type
		pattern.customGridType = "";

		// read hex characters
		while (i < l && numRead < neededLength && result !== -1) {
			next = this.hexCharacters.indexOf(rule[i]);
			if (next >= 0) {
				i += 1;
				numRead += 1;
				count += this.bitCount(next);
			} else {
				result = -1;
			}
		}

		// check if enough digits were read
		if (numRead !== neededLength) {
			result = -1;
		}

		// check if string is valid
		if (result === -1) {
			this.failureReason = family + " 'N@' needs " + String(neededLength) + " hex digits";
			pattern.customNeighbourhood = "";
			pattern.customNeighbourCount = -1;
		} else {
			pattern.customNeighbourhood = rule.substring(this.index, this.index + numRead).toLowerCase();
			pattern.customNeighbourCount = count;
			this.index += numRead;

			// check for hex grid type postfix
			if (i < l) {
				if (rule[i] === "h") {
					pattern.customGridType = "H";
					this.index += 1;
				} else {
					if (rule[i] === "l") {
						pattern.customGridType = "L";
						this.index += 1;
					}
				}
			}
		}

		return result;
	};

	// create HROT arrays from Bmin to Bmax and Smin to Smax
	PatternManager.prototype.setupHROTfromLTL = function(/** @type {Pattern} */ pattern, /** @type {Allocator} */ allocator) {
		var	/** @type {number} */ range = pattern.rangeLTL,
			/** @type {number} */ maxCount = 0,
			/** @type {number} */ i = 0;

		// copy the range and neighborhood
		pattern.rangeHROT = range;
		pattern.neighborhoodHROT = pattern.neighborhoodLTL;
		maxCount = this.maxNeighbours(range, pattern.neighborhoodLTL, pattern.customNeighbourCount);
		maxCount += pattern.middleLTL;

		// allocate the survival and birth arrays
		pattern.survivalHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, maxCount + 2, "HROT.survivals"));
		pattern.birthHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, maxCount + 1, "HROT.births"));

		// populate the arrays
		for (i = pattern.SminLTL; i <= pattern.SmaxLTL; i += 1) {
			pattern.survivalHROT[i] = 1;
		}
		for (i = pattern.BminLTL; i <= pattern.BmaxLTL; i += 1) {
			pattern.birthHROT[i] = 1;
		}

		// check for alternate rule
		if (this.altSpecified) {
			// allocate the alternate survival and birth arrays
			pattern.altSurvivalHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, maxCount + 2, "HROT.altSurvivals"));
			pattern.altBirthHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, maxCount + 1, "HROT.altBirths"));

			// populate the arrays
			for (i = pattern.altSminLTL; i <= pattern.altSmaxLTL; i += 1) {
				pattern.altSurvivalHROT[i] = 1;
			}
			for (i = pattern.altBminLTL; i <= pattern.altBmaxLTL; i += 1) {
				pattern.altBirthHROT[i] = 1;
			}
		}

		// mark pattern as HROT
		pattern.isHROT = true;
	};

	// decode HROT rule in Rr,Cc,S,B(,Nn)(,P) format
	/** @returns {boolean} */
	PatternManager.prototype.decodeHROTMulti = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule, /** @type {Allocator} */ allocator) {
		var	/** @type {number} */ value = 0,
			/** @type {boolean} */ result = false,
			/** @type {number} */ maxCount = 0,
			/** @type {number} */ saveIndex = 0,
			/** @type {boolean} */ outer = true,
			/** @type {number} */ hoodIndex = rule.indexOf(",n"),
			/** @type {number} */ probIndex = rule.indexOf(",p");

		// reset string index
		this.index = 0;

		// reset maximum S and B seen
		this.maxBirthHROT = 0;
		this.maxSurvivalHROT = 0;

		// decode R part
		if (rule[this.index] !== "r") {
			this.failureReason = "HROT expected 'R' got '" + rule[this.index].toUpperCase() + "'";
		} else {
			// read range
			value = this.decodeHROTNumber(rule, "R");
			if (value !== -1) {
				// check range
				if (value < this.minRangeHROT) {
					this.failureReason = "HROT 'R' < " + this.minRangeHROT;
				} else {
					if (value > this.maxRangeHROT) {
						this.failureReason = "HROT 'R' > " + this.maxRangeHROT;
					} else {
						// save result
						pattern.rangeHROT = value;
						result = true;
					}
				}
			}
		}

		// decode states
		if (result) {
			result = false;
			if (this.index < rule.length) {
				// check for comma
				if (rule[this.index] !== ",") {
					this.failureReason = "HROT expected ',' got " + rule[this.index].toUpperCase();
				} else {
					// check for c
					this.index += 1;
					if (this.index < rule.length) {
						if (rule[this.index] !== "c") {
							this.failureReason = "HROT expected 'C' got " + rule[this.index].toUpperCase();
						} else {
							value = this.decodeHROTNumber(rule, "C");
							if (value !== -1) {
								if (value < this.minStatesHROT) {
									this.failureReason = "HROT 'C" + value + "' < " + this.minStatesHROT;
								} else {
									if (value > this.maxStatesHROT) {
										this.failureReason = "HROT 'C" + value  + "' > " + this.maxStatesHROT;
									} else {
										// ensure at least 2 states
										if (value < 2) {
											value = 2;
										}
										pattern.multiNumStates = value;
										result = true;
									}
								}
							}
						}
					} else {
						this.failureReason = "HROT expected 'C'";
					}
				}
			} else {
				this.failureReason = "HROT expected ','";
			}
		}

		// find neighbourhood next since the neighbour count is needed for validation
		if (result) {
			saveIndex = this.index;
			this.index = hoodIndex;

			// default rule to outer totalistic
			outer = true;

			// decode optional neighborhood
			pattern.neighborhoodHROT = this.mooreHROT;
			if (this.index !== -1 && this.index < rule.length && rule[this.index] === ",") {
				// comma found so check for neighborhood
				result = false;
				this.index += 1;
				if (this.index < rule.length) {
					if (rule[this.index] === "n") {
						// check for neighborhood
						this.index += 1;
						if (this.index < rule.length) {
							switch(rule[this.index]) {
								case "m":
									pattern.neighborhoodHROT = this.mooreHROT;
									this.index += 1;
									result = true;
									break;

								case "n":
									pattern.neighborhoodHROT = this.vonNeumannHROT;
									this.index += 1;
									result = true;
									break;

								case "c":
									pattern.neighborhoodHROT = this.circularHROT;
									this.index += 1;
									result = true;
									break;

								case "+":
									pattern.neighborhoodHROT = this.crossHROT;
									this.index += 1;
									result = true;
									break;

								case "x":
									pattern.neighborhoodHROT = this.saltireHROT;
									this.index += 1;
									result = true;
									break;

								case "*":
									pattern.neighborhoodHROT = this.starHROT;
									this.index += 1;
									result = true;
									break;

								case "2":
									pattern.neighborhoodHROT = this.l2HROT;
									this.index += 1;
									result = true;
									break;

								case "h":
									pattern.neighborhoodHROT = this.hexHROT;
									this.index += 1;
									result = true;
									break;

								case "b":
									pattern.neighborhoodHROT = this.checkerHROT;
									this.index += 1;
									result = true;
									break;

								case "d":
									pattern.neighborhoodHROT = this.alignedCheckerHROT;
									this.index += 1;
									result = true;
									break;

								case "#":
									pattern.neighborhoodHROT = this.hashHROT;
									this.index += 1;
									result = true;
									break;

								case "@":
									this.index += 1;
									pattern.neighborhoodHROT = this.readCustomNeighbourhood(rule, pattern.rangeHROT, "HROT", pattern);
									if (pattern.neighborhoodHROT !== -1) {
										result = true;
									}
									break;

								case "3":
									pattern.neighborhoodHROT = this.tripodHROT;
									this.index += 1;
									result = true;
									break;

								case "a":
									pattern.neighborhoodHROT = this.asteriskHROT;
									this.index += 1;
									result = true;
									break;

								case "l":
									pattern.neighborhoodHROT = this.triangularHROT;
									this.index += 1;
									result = true;
									break;

								case "g":
									pattern.neighborhoodHROT = this.gaussianHROT;
									// gaussian is totalistic (not outer totalistic)
									outer = false;
									this.index += 1;
									result = true;
									break;

								case "w":
									this.index += 1;
									pattern.neighborhoodHROT = this.readWeightedNeighbourhood(rule, pattern.rangeHROT, "HROT", pattern);
									if (pattern.neighborhoodHROT !== -1) {
										// weighted is totalistic (not outer totalistic)
										outer = false;
										result = true;
									}
									break;

								case "f":
									this.index += 1;
									pattern.neighborhoodHROT = this.readCornerEdge(rule, pattern.rangeHROT, "HROT", pattern);
									if (pattern.neighborhoodHROT !== -1) {
										result = true;
									}
									break;

								default:
									this.failureReason = "HROT 'N' [ABCDFGHLMNWX23*+#@] got '" + rule[this.index].toUpperCase() + "'";
									break;
							}
						} else {
							this.failureReason = "HROT 'N' needs a neighborhood";
						}
					} else {
						this.failureReason = "HROT expected 'N' got '" + rule[this.index].toUpperCase() + "'";
					}
				} else {
					this.failureReason = "HROT expected 'N'";
				}

				// save index after neighbourhood
				hoodIndex = this.index;
			}

			// check neighborhood counts for the neighborhood
			maxCount = this.maxNeighbours(pattern.rangeHROT, pattern.neighborhoodHROT, pattern.customNeighbourCount);

			// go back to earlier rule position to continue decoding
			this.index = saveIndex;
		}

		// decode survivals
		if (result) {
			result = false;
			if (this.index < rule.length) {
				// check for comma
				if (rule[this.index] !== ",") {
					this.failureReason = "HROT expected ',' got " + rule[this.index].toUpperCase();
				} else {
					// check for s
					this.index += 1;
					if (this.index < rule.length) {
						if (rule[this.index] !== "s") {
							this.failureReason = "HROT expected 'S' got " + rule[this.index].toUpperCase();
						} else {
							// read and save survivals
							pattern.survivalHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, maxCount + 2, "HROT.survivals"));
							result = this.decodeHROTRange(rule, pattern.survivalHROT, "S", maxCount, outer);
						}
					} else {
						this.failureReason = "HROT expected 'S'";
					}
				}
			} else {
				this.failureReason = "HROT expected ','";
			}
		}

		// decode births
		if (result) {
			result = false;
			if (this.index < rule.length) {
				// check for comma
				if (rule[this.index] !== ",") {
					this.failureReason = "HROT expected ',' got " + rule[this.index].toUpperCase();
				} else {
					// check for b
					this.index += 1;
					if (this.index < rule.length) {
						if (rule[this.index] !== "b") {
							this.failureReason = "HROT expected 'B' got " + rule[this.index].toUpperCase();
						} else {
							// read and save survivals
							pattern.birthHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, maxCount + 1, "HROT.births"));
							result = this.decodeHROTRange(rule, pattern.birthHROT, "B", maxCount, outer);
						}
					} else {
						this.failureReason = "HROT expected 'B'";
					}
				}
			} else {
				this.failureReason = "HROT expected ','";
			}
		}

		// final validation
		if (result) {
			// check for trailing characters
			if (hoodIndex !== -1) {
				this.index = hoodIndex;
			}

			// check for probabilistic
			pattern.probabilisticHROT = false;
			pattern.probabilisticBirths = -1;
			pattern.probabilisticSurvivals = -1;
			pattern.probabilisticImmunities = -1;

			if (probIndex !== -1) {
				if (probIndex === this.index) {
					pattern.probabilisticHROT = true;
					this.index += 2;

					// check for optional births and survivals chances
					if (this.index < rule.length) {
						this.index -= 1;
						value = this.decodeHROTNumberOrHash(rule, "P");
						if (value !== -1) {
							if ((value < 0 || value > 100) && (value !== -2)) {
								this.failureReason = "HROT P values need to be from 0 to 100 or #";
							} else {
								pattern.probabilisticBirths = value;
								pattern.probabilisticSurvivals = value;

								// check for comma
								if (this.index < rule.length) {
									if (rule[this.index] === ",") {
										value = this.decodeHROTNumberOrHash(rule, "P");
										if (value !== -1) {
											if ((value < 0 || value > 100) && (value !== -2)) {
												this.failureReason = "HROT P values need to be from 0 to 100 or #";
											} else {
												pattern.probabilisticBirths = value;

												// check for comma
												if (this.index < rule.length) {
													if (rule[this.index] === ",") {
														value = this.decodeHROTNumberOrHash(rule, "P");
														if (value !== -1) {
															if ((value < 0 || value > 100) && (value !== -2)) {
																this.failureReason = "HROT P values need to be from 0 to 100 or #";
															} else {
																pattern.probabilisticImmunities = value;
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

			if (this.index !== rule.length) {
				result = false;
				this.failureReason = "HROT invalid characters after rule";
			}

			// check maximum survival count
			if (this.maxSurvivalHROT > maxCount) {
				result = false;
				this.failureReason = "HROT 'S" + this.maxSurvivalHROT + "' > " + maxCount;
			}

			// check maximum birth count
			if (result) {
				if (this.maxBirthHROT > maxCount) {
					result = false;
					this.failureReason = "HROT 'B" + this.maxBirthHROT + "' > " + maxCount;
				}
			}
		}

		if (result) {
			pattern.isHROT = true;
		}

		return result;
	};

	// decode HROT rule in r<num>b<hex>s<hex> format
	/** @returns {boolean} */
	PatternManager.prototype.decodeHROTHex = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule, /** @type {Allocator} */ allocator) {
		var	/** @type {number} */ value = 0,
			/** @type {boolean} */ result = false,
			// ASCII 0
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			/** @type {number} */ asciiNine = String("9").charCodeAt(0),
			/** @type {number} */ nextCode = 0,
			/** @type {number} */ numHexDigits = 0;

		// reset string index
		this.index = 0;

		// set number of states to the default unless set by generations prefix
		if (pattern.multiNumStates === -1) {
			pattern.multiNumStates = 2;
		}

		// decode R part
		if (rule[this.index] !== "r") {
			this.failureReason = "HROT expected 'R' got '" + rule[this.index].toUpperCase() + "'";
		} else {
			// read range
			nextCode = -1;
			this.index += 1;
			// check for digit
			if (this.index < rule.length) {
				nextCode = rule[this.index].charCodeAt(0);
			}
			if (nextCode < asciiZero || nextCode > asciiNine) {
				this.failureReason = "HROT 'R' needs a number";
			} else {
				// read digits
				value = nextCode - asciiZero;
				this.index += 1;
				nextCode = -1;
				if (this.index < rule.length) {
					nextCode = rule[this.index].charCodeAt(0);
				}
				while (nextCode >= asciiZero && nextCode <= asciiNine) {
					value = 10 * value + (nextCode - asciiZero);
					this.index += 1;
					if (this.index < rule.length) {
						nextCode = rule[this.index].charCodeAt(0);
					} else {
						nextCode = -1;
					}
				}
				// check range
				if (value < this.minRangeHROT) {
					this.failureReason = "HROT 'R' < " + this.minRangeHROT;
				} else {
					if (value > this.maxRangeHROT) {
						this.failureReason = "HROT 'R' > " + this.maxRangeHROT;
					} else {
						// save result
						pattern.rangeHROT = value;
						result = true;

						// compute hex digits
						numHexDigits = value * (value + 1);
					}
				}
			}
		}

		// decode births
		if (result) {
			result = false;
			if (this.index < rule.length) {
				// check for B
				if (rule[this.index] !== "b") {
					this.failureReason = "HROT expected 'B' got " + rule[this.index].toUpperCase() + "'";
				} else {
					// check for hex part
					this.index += 1;
					result = this.readHexDigits(rule, "B", numHexDigits, pattern, allocator);
				}
			} else {
				this.failureReason = "HROT expected 'B'";
			}
		}

		// decode survivals
		if (result) {
			result = false;
			if (this.index < rule.length) {
				// check for S
				if (rule[this.index] !== "s") {
					this.failureReason = "HROT expected 'S' got " + rule[this.index].toUpperCase() + "'";
				} else {
					// check for hex part
					this.index += 1;
					result = this.readHexDigits(rule, "S", numHexDigits, pattern, allocator);
				}
			} else {
				this.failureReason = "HROT expected 'S'";
			}
		}

		// decode optional z
		if (result) {
			if (this.index < rule.length) {
				// check for Z
				if (rule[this.index] === "z") {
					// set the survival on zero element
					pattern.survivalHROT[1] = 1;
					this.index += 1;
				}
			}
		}

		// final validation
		if (result) {
			// check for trailing characters
			if (this.index !== rule.length) {
				result = false;
				this.failureReason = "HROT invalid characters after rule";
			} else {
				// default to Moore
				pattern.neighborhoodHROT = this.mooreHROT;
				pattern.isHROT = true;
			}
		}

		return result;
	};

	// convert array to multi string for HROT
	/** @returns {string} */
	PatternManager.prototype.asMulti = function(/** @type {Uint8Array} */ list, /** @type {number} */ offset) {
		var	/** @type {number} */ length = list.length,
			/** @type {number} */ start = -1,
			/** @type {string} */ result = "",
			/** @type {number} */ i = 0;

		// read the array looking for ranges
		while (i < length) {
			// check for set value
			if (list[i] === 1) {
				// if no current run then set as start of run
				if (start === -1) {
					start = i;
				}
			} else {
				// zero so check if current run being processed
				if (start !== -1) {
					// output current run
					if (result !== "") {
						result += ",";
					}
					result += start + offset;
					if ((i - 1) !== start) {
						result += "-" + (i - 1 + offset);
					}

					// reset run
					start = -1;
				}

			}
			// next item
			i += 1;
		}
		// check if still processing a run
		if (start !== -1) {
			if (result !== "") {
				result += ",";
			}
			result += start + offset;
			if ((i - 1) !== start) {
				result += "-" + (i - 1 + offset);
			}
		}

		// return string
		return result;
	};

	// decode rule string and return whether valid
	/** @return {boolean} */
	PatternManager.prototype.decodeRuleString = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule, /** @type {Allocator} */ allocator, /** @type {boolean} */ ignoreAliases) {
		// check for alternate rules
		var	/** @type {number} */ altIndex = -1,
			/** @type {Pattern} */ firstPattern = null,
			/** @type {string|null} */ alias = null,
			/** @type {string|null} */ aliasName = "",
			/** @type {string|null} */ alias1 = null,
			/** @type {string|null} */ alias2 = null,
			/** @type {boolean} */ nestedAlternate = false,
			/** @type {boolean} */ result = false;

		// mark not using Wolfram RuleTable emulation
		this.wolframEmulation = false;

		// check if the rule is an alias
		if (!ignoreAliases) {
			alias = AliasManager.getRuleFromAlias(rule);
			if (alias !== null) {
				// get the canonical form of the alias
				aliasName = AliasManager.getAliasFromRule(alias);

				// get the rule
				rule = alias;
			}
		}

		// check if the rule has an alternate
		altIndex = rule.indexOf(this.altRuleSeparator);

		// check if the rule has an alternate
		if (altIndex === -1) {
			// single rule so decode
			result = this.decodeRuleStringPart(pattern, rule, allocator, this.ruleArray, ignoreAliases);
			if (result) {
				// check for triangular rule
				if (pattern.isTriangular) {
					this.createTriMap(pattern, this.ruleTriangularArray, this.ruleAltTriangularArray);
				}
			}
		} else {
			// expand any aliases in the rule
			nestedAlternate = false;
			alias1 = AliasManager.getRuleFromAlias(rule.substring(0, altIndex));
			if (alias1 !== null) {
				if (alias1.indexOf(this.altRuleSeparator) !== -1) {
					nestedAlternate = true;
				}
			}

			alias2 = AliasManager.getRuleFromAlias(rule.substring(altIndex + 1));
			if (alias2 !== null) {
				if (alias2.indexOf(this.altRuleSeparator) !== -1) {
					nestedAlternate = true;
				}
			}

			// check there is only one separator
			if ((rule.substring(altIndex + 1).indexOf(this.altRuleSeparator) === -1) && !nestedAlternate) {
				// decode first rule
				result = this.decodeRuleStringPart(pattern, rule.substring(0, altIndex), allocator, this.ruleAltArray, ignoreAliases);
				if (result) {
					// save the first pattern details
					firstPattern = new Pattern(pattern.name, this);
					firstPattern.copySettingsFrom(pattern);

					// if succeeded then decode alternate rule
					pattern.resetSettings();
					result = this.decodeRuleStringPart(pattern, rule.substring(altIndex + 1), allocator, this.ruleArray, ignoreAliases);
					if (result) {
						// check the two rules are from the same family
						this.failureReason = pattern.isSameFamilyAs(firstPattern);
						if (this.failureReason === "") {
							// check for B0 in either rule
							if ((pattern.isHROT && ((pattern.birthHROT[0] !== 0) || (firstPattern.birthHROT[0] !== 0))) || (!pattern.isTriangular && (this.ruleArray[0] || this.ruleAltArray[0])) || (pattern.isTriangular && ((pattern.birthTriMask & 1) !== 0) || ((firstPattern.birthTriMask & 1) !== 0))) {
								this.failureReason = "Alternate not supported with B0";
								if (pattern.isHROT) {
									pattern.ruleName = firstPattern.originalRuleName;
								}
								result = false;
							} else {
								// create rule map for triangular rule
								if (pattern.isTriangular) {
									this.createTriMap(firstPattern, this.ruleAltTriangularArray, null);
									this.createTriMap(pattern, this.ruleTriangularArray, null);
								}
								// add the alternate alias names if at least one is set or the whole rule was an alias
								if (aliasName !== "") {
									pattern.aliasName = /*** @type {!string} */ (aliasName);
								} else {
									if (pattern.aliasName !== "" || firstPattern.aliasName !== "") {
										if (pattern.aliasName === "") {
											pattern.aliasName = pattern.ruleName;
										}
										if (firstPattern.aliasName === "") {
											firstPattern.aliasName = firstPattern.ruleName;
										}
										pattern.aliasName = firstPattern.aliasName + this.altRuleSeparator + pattern.aliasName;
									}
								}

								// add the alternate rule name
								pattern.ruleName = firstPattern.ruleName + this.altRuleSeparator + pattern.ruleName;

								// check for alternate rule alias
								aliasName = AliasManager.getAliasFromRule(pattern.ruleName);
								if (aliasName !== null) {
									pattern.aliasName = aliasName;
								}

								// if HROT then copy arrays across
								if (pattern.isHROT || pattern.isLTL) {
									pattern.copyMultiSettingsFrom(firstPattern, allocator);
								}

								// flag that alternate rule specified
								this.altSpecified = true;
							}
						} else {
							// rules were incompatible
							pattern.originalRuleName = firstPattern.originalRuleName;
							result = false;
						}
					}
				}
			} else {
				this.failureReason = "Only one alternate allowed";
			}
		}

		return result;
	};

	// decode PCA rule
	/** @returns {boolean} */
	PatternManager.prototype.decodePCA = function(/** @type {string} */ rule, /** @type {Uint8Array} */ ruleArray) {
		var	/** @type {boolean} */ valid = true,
			/** @type {number} */ index = 0,
			/** @type {number} */ length = rule.length,
			/** @type {number} */ item = 0,
			/** @type {number} */ itemIndex = 0,
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),
			/** @type {string} */ nextChar = "",
			/** @type {string} */ prefix = this.pcaRulePrefix;

		// check initial character is M
		if (rule.substring(0, prefix.length) !== prefix) {
			this.failureReason = "PCA rule must start with " + prefix.toUpperCase();
			valid = false;
		} else {
			index += prefix.length;
			item = -1;

			// check for comma
			if (rule[index] !== ",") {
				// comma missing so validation will fail later since < 16 values read
				valid = true;
			} else {
				// read 16 numbers
				index += 1;
				nextChar = "";
				while (valid && itemIndex < 16 && index < length) {
					if (index < length) {
						nextChar = rule[index];
						index += 1;
						if (nextChar >= "0" && nextChar <= "9") {
							if (item === -1) {
								item = 0;
							}
							item = item * 10 + nextChar.charCodeAt(0) - asciiZero;
						} else {
							if (nextChar === ",") {
								if (item > 15) {
									this.failureReason = "Value must be from 0 to 15";
									valid = false;
								} else {
									ruleArray[itemIndex] = item;
									itemIndex += 1;
									item = -1;
								}
							} else {
								this.failureReason = "Illegal character found in rule";
								valid = false;
							}
						}
					}
				}
			}

			// check if final entry valid
			if (valid) {
				if (item === -1) {
					if (itemIndex === 16) {
						this.failureReason = "Extra characters found after rule";
					} else {
						this.failureReason = "Need 16 values";
					}
					valid = false;
				} else {
					if (item > 15) {
						this.failureReason = "Value must be from 0 to 15";
						valid = false;
					} else {
						ruleArray[itemIndex] = item;
						itemIndex += 1;
						if (itemIndex !== 16) {
							this.failureReason = "Need 16 values";
							valid = false;
						}
					}
				}
			}
		}

		return valid;
	};

	// decode Margolus rule
	/** @returns {boolean} */
	PatternManager.prototype.decodeMargolus = function(/** @type {string} */ rule, /** @type {Uint8Array} */ ruleArray) {
		var	/** @type {boolean} */ valid = true,
			/** @type {number} */ index = 0,
			/** @type {number} */ length = rule.length,
			/** @type {number} */ item = 0,
			/** @type {number} */ itemIndex = 0,
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),
			/** @type {string} */ nextChar = "";

		// check initial character is M
		if (rule[index] !== "m") {
			this.failureReason = "Margolus rule must start with M";
			valid = false;
		} else {
			index += 1;
			// check for optional "S,D"
			if (rule.substring(index, index + 3) === "s,d") {
				index += 3;
			}

			// read 16 numbers
			nextChar = "";
			item = -1;
			while (valid && itemIndex < 16 && index < length) {
				if (index < length) {
					nextChar = rule[index];
					index += 1;
					if (nextChar >= "0" && nextChar <= "9") {
						if (item === -1) {
							item = 0;
						}
						item = item * 10 + nextChar.charCodeAt(0) - asciiZero;
					} else {
						if (nextChar === "," || nextChar === ";") {
							if (item > 15) {
								this.failureReason = "Value must be from 0 to 15";
								valid = false;
							} else {
								ruleArray[itemIndex] = item;
								itemIndex += 1;
								item = -1;
							}
						} else {
							this.failureReason = "Illegal character found in rule";
							valid = false;
						}
					}
				}
			}

			// check if final entry valid
			if (valid) {
				if (item === -1) {
					if (itemIndex === 16) {
						this.failureReason = "Extra characters found after rule";
					} else {
						this.failureReason = "Need 16 values";
					}
					valid = false;
				} else {
					if (item > 15) {
						this.failureReason = "Value must be from 0 to 15";
						valid = false;
					} else {
						ruleArray[itemIndex] = item;
						itemIndex += 1;
						if (itemIndex !== 16) {
							this.failureReason = "Need 16 values";
							valid = false;
						}
					}
				}
			}
		}

		return valid;
	};

	// decode rule string and return whether valid
	/** @returns {boolean} */
	PatternManager.prototype.decodeRuleStringPart = function(/** @type {Pattern} */ pattern, /** @type {string} */ rule, /** @type {Allocator} */ allocator, /** @type {Uint8Array} */ ruleArray, /** @type {boolean} */ ignoreAliases) {
		// whether the rule contains a slash
		var	/** @type {number} */ slashIndex = -1,

			// whether the rule contains a B part
			/** @type {number} */ bIndex = -1,

			// whether the rule contains an S part
			/** @type {number} */ sIndex = -1,

			// whether the rule contains a second slash for Generations
			/** @type {number} */ generationsIndex = -1,

			// whether rule is valid
			/** @type {boolean} */ valid = false,

			// length of MAP part
			/** @type {number} */ mapLength = -1,

			// birth part of rule
			birthPart = null,

			// survival part of rule
			survivalPart = null,

			// generations part of rule
			generationsPart = null,

			// alias
			alias = null,

			// valid rule letters
			/** @type {string} */ validRuleLetters = this.validRuleLetters,

			// valid character index
			/** @type {number} */ validIndex = -1,

			// hex tripod postfix length
			/** @type {number} */ hexTripodLength = this.hexTripodPostfix.length,

			// hex index
			/** @type {number} */ hexIndex = -1,

			// hex postfix length
			/** @type {number} */ hexLength = this.hexPostfix.length,

			// triangular index
			/** @type {number} */ triangularIndex = -1,

			// triangular postfix length
			/** @type {number} */ triangularLength = this.triangularPostfix.length,

			// triangular Edges postfix length
			/** @type {number} */ triangularEdgesLength = this.triangularEdgesPostfix.length,

			// triangular Vertices postfix length
			/** @type {number} */ triangularVerticesLength = this.triangularVerticesPostfix.length,

			// triangular Inner postfix length
			/** @type {number} */ triangularInnerLength = this.triangularInnerPostfix.length,

			// triangular Outer postfix length
			/** @type {number} */ triangularOuterLength = this.triangularOuterPostfix.length,

			// triangular Biohazard postfix length
			/** @type {number} */ triangularBiohazardLength = this.triangularBiohazardPostfix.length,

			// triangular Radiation postfix length
			/** @type {number} */ triangularRadiationLength = this.triangularRadiationPostfix.length,

			// von neumann index
			/** @type {number} */ vonNeumannIndex = -1,

			// von neumann postfix length
			/** @type {number} */ vonNeumannLength = this.vonNeumannPostfix.length,

			// base64 map string
			/** @type {string} */ base64 = "",

			// PCA prefix
			/** @type {string} */ prefix = this.pcaRulePrefix,

			// offset
			/** @type {number} */ offset = 0,

			// original name
			/** @type {string} */ tempName = "",

			// counter
			/** @type {number} */ i = 0;

		// zero the first element of the rule array so later B0 checks don't fail
		ruleArray[0] = 0;

		// check if the rule is an alias
		if (!ignoreAliases) {
			alias = AliasManager.getRuleFromAlias(rule);
			if (alias !== null) {
				// check for blank rule
				if (rule === "") {
					pattern.ruleName = "Life";
				}
				rule = alias;
			}
		}

		// check for MAP
		if (rule.substring(0, 3).toLowerCase() === "map") {
			// decode MAP
			base64 = rule.substring(3);

			// check for base64 padding
			validIndex = base64.indexOf("/");
			if (validIndex === -1) {
				// no slash version
				if (base64.substring(base64.length - 2) === "==") {
					// remove padding
					base64 = base64.substring(0, base64.length - 2);
				}
			} else {
				// slash version
				if (base64.substring(validIndex - 2, validIndex) === "==") {
					// remove padding
					base64 = base64.substring(0, validIndex - 2) + base64.substring(validIndex);
				}
			}
			mapLength = this.validateMap(base64, pattern);

			if (mapLength >= 0) {
				valid = true;

				// check for a trailer
				generationsPart = base64.substring(mapLength);
				base64 = base64.substring(0, mapLength);

				// check for generations
				if (generationsPart[0] === "/") {
					i = 1;
					pattern.multiNumStates = 0;

					// check for and ignore G or C so "23/3/2", "B3/S23/G2" and "B3/S23/C2" are all supported
					if (i < generationsPart.length && (generationsPart[i].toLowerCase() === "g" || generationsPart[i].toLowerCase() === "c")) {
						i += 1;
					}

					// read generations digits
					validIndex = 0;
					while (i < generationsPart.length && validIndex !== -1) {
						// check each character is a valid digit
						validIndex = this.decimalDigits.indexOf(generationsPart[i]);
						if (validIndex !== -1) {
							// add the digit to the number of generations states
							pattern.multiNumStates = pattern.multiNumStates * 10 + validIndex;
						} else {
							// mark as invalid
							this.failureReason = "Illegal character in generations number";
							pattern.multiNumStates = -1;
							valid = false;
						}
						i += 1;
					}

					// check if generations states are valid
					if (pattern.multiNumStates !== -1 && (pattern.multiNumStates < 2 || pattern.multiNumStates > 256)) {
						// mark as invalid
						this.failureReason = "Generations number must be 2-256";
						pattern.multiNumStates = -1;
						valid = false;
					}
				} else {
					if (generationsPart !== "") {
						// illegal trailing characters
						i = generationsPart.length;
						this.failureReason = "MAP length must be " + this.map32Length + ", " + this.map128Length + " or " + this.map512Length + " not " + (i + mapLength);
						valid = false;
					}
				}
			} else {
				// illegal map
				if (base64.length === this.map512Length || base64.length === this.map128Length || base64.length === this.map32Length) {
					this.failureReason = "MAP contains illegal base64 character";
				} else {
					this.failureReason = "MAP length must be " + this.map32Length + ", " + this.map128Length + " or " + this.map512Length + " not " + base64.length;
				}
			}
		} else {
			// convert to lower case
			rule = rule.toLowerCase();

			// remove whitespace
			rule = this.removeWhiteSpace(rule);

			// check for PCA
			if (rule.substring(0, prefix.length) === prefix) {
				valid = this.decodePCA(rule, ruleArray);
				if (valid) {
					pattern.isPCA = true;
					pattern.multiNumStates = 16;
				}
			} else {
				// check for Margolus
				if (rule[0] === "m") {
					valid = this.decodeMargolus(rule, ruleArray);
					if (valid) {
						pattern.isMargolus = true;
					}
				} else {
					// check for generations prefix
					valid = true;
					if (rule[0] === "g") {
						i = 1;
						pattern.multiNumStates = 0;

						// read generations digits
						validIndex = 0;
						while (i < rule.length && validIndex !== -1) {
							// check each character is a valid digit
							validIndex = this.decimalDigits.indexOf(rule[i]);
							if (validIndex !== -1) {
								// add the digit to the number of generations states
								pattern.multiNumStates = pattern.multiNumStates * 10 + validIndex;
								i += 1;
							}
						}

						// check if digits were present
						if (i > 1) {
							// check if generations states are valid
							if (pattern.multiNumStates < 2 || pattern.multiNumStates > 256) {
								// mark as invalid
								this.failureReason = "Generations number must be 2-256";
								pattern.multiNumStates = -1;
								valid = false;
							} else {
								// if the next character is a / then remove it so "G3S23B3" and "G3/S23/B3" are both supported
								if (i < rule.length && rule[i] === "/") {
									i += 1;
								}
								// remove prefix from rule
								rule = rule.substring(i);
								valid = true;
							}
						}
					}

					// if valid then keep decoding
					if (valid) {
						// find final g
						validIndex = rule.lastIndexOf("g");
						if (validIndex !== -1 && validIndex !== (rule.length - 1)) {
							// ignore if previous character is slash since this will be handled later
							if (!(validIndex > 0 && rule[validIndex - 1] === "/")) {
								// attempt to decode generations states
								i = validIndex + 1;
								pattern.multiNumStates = 0;

								// read generations digits
								validIndex = 0;
								while (i < rule.length && validIndex !== -1) {
									// check each character is a valid digit
									validIndex = this.decimalDigits.indexOf(rule[i]);
									if (validIndex !== -1) {
										// add the digit to the number of generations states
										pattern.multiNumStates = pattern.multiNumStates * 10 + validIndex;
										i += 1;
									}
								}

								// check if digits were present
								if (i === rule.length) {
									// check if generations states are valid
									if (pattern.multiNumStates < 2 || pattern.multiNumStates > 256) {
										// mark as invalid
										this.failureReason = "Generations number must be 2-256";
										pattern.multiNumStates = -1;
										valid = false;
									} else {
										// remove postfix from rule
										rule = rule.substring(0, rule.lastIndexOf("g"));
										valid = true;
									}
								} else {
									// ignore since wasn't generations postfix
									pattern.multiNumStates = -1;
								}
							}
						}
					}

					// if rule still valid then continue decoding
					if (valid) {
						valid = false;
						// check for LTL or HROT rule
						if (rule[0] === "r" || ((rule[0] >= "1" && rule[0] <= "9") && rule.indexOf(",") !== -1)) {
							if (rule[0] === "r") {
								// check for Wojtowicz format LTL
								if (rule.indexOf(".") !== -1) {
									valid = this.decodeLTLMC(pattern, rule);
								} else {
									// check for Goucher format LTL (t with no n)
									if (rule.indexOf("t") !== -1 && rule.indexOf("n") === -1) {
										valid = this.decodeLTLRBTST(pattern, rule);
									} else {
										// check for multi format HROT
										if (rule.indexOf(",") !== -1) {
											valid = this.decodeHROTMulti(pattern, rule, allocator);
										} else {
											// try Goucher format HROT
											valid = this.decodeHROTHex(pattern, rule, allocator);
										}
									}
								}
							} else {
								// check for Evans format LTL
								valid = this.decodeLTLnum(pattern, rule);
							}
							if (valid) {
								// set canonical name
								if (pattern.isHROT) {
									// normalize range for edge/corner rules
									if (pattern.neighborhoodHROT === this.cornerEdgeHROT) {
										if (pattern.cornerRange > pattern.rangeHROT) {
											pattern.rangeHROT = pattern.cornerRange;
										}
										if (pattern.edgeRange > pattern.rangeHROT) {
											pattern.rangeHROT = pattern.edgeRange;
										}
									}

									// HROT
									offset = (pattern.neighborhoodHROT === this.weightedHROT || pattern.neighborhoodHROT === this.gaussianHROT) ? 0 : -1;
									pattern.ruleName = "R" + pattern.rangeHROT + ",";
									pattern.ruleName += "C" + pattern.multiNumStates + ",";
									pattern.ruleName += "S" + this.asMulti(pattern.survivalHROT, offset) + ",";
									pattern.ruleName += "B" + this.asMulti(pattern.birthHROT, 0);
									if (pattern.neighborhoodHROT !== this.mooreHROT) {
										pattern.ruleName += ",N";
										switch(pattern.neighborhoodHROT) {
											case this.vonNeumannHROT:
												pattern.ruleName += "N";
												break;

											case this.circularHROT:
												pattern.ruleName += "C";
												break;

											case this.crossHROT:
												pattern.ruleName += "+";
												break;

											case this.saltireHROT:
												pattern.ruleName += "X";
												break;

											case this.starHROT:
												pattern.ruleName += "*";
												break;

											case this.l2HROT:
												pattern.ruleName += "2";
												break;

											case this.hexHROT:
												pattern.ruleName += "H";
												break;

											case this.checkerHROT:
												pattern.ruleName += "B";
												break;

											case this.alignedCheckerHROT:
												pattern.ruleName += "D";
												break;

											case this.hashHROT:
												pattern.ruleName += "#";
												break;

											case this.customHROT:
												pattern.ruleName += "@" + pattern.customNeighbourhood + pattern.customGridType;
												break;

											case this.tripodHROT:
												pattern.ruleName += "3";
												break;

											case this.asteriskHROT:
												pattern.ruleName += "A";
												break;

											case this.triangularHROT:
												pattern.ruleName += "L";
												break;

											case this.gaussianHROT:
												pattern.ruleName += "G";
												break;

											case this.weightedHROT:
												pattern.ruleName += "W" + pattern.customNeighbourhood + pattern.customGridType;
												break;

											case this.cornerEdgeHROT:
												pattern.ruleName += "F" + pattern.cornerEdgeCanonical(pattern.rangeHROT);
												break;
										}
									}
									if (pattern.probabilisticHROT) {
										pattern.ruleName += ",P";
										if (pattern.probabilisticSurvivals !== -1) {
											pattern.ruleName += (pattern.probabilisticSurvivals === -2 ? "#": pattern.probabilisticSurvivals);
											if (pattern.probabilisticBirths !== -1) {
												pattern.ruleName += "," + (pattern.probabilisticBirths === -2 ? "#" : pattern.probabilisticBirths);
												if (pattern.probabilisticImmunities !== -1) {
													pattern.ruleName += "," + (pattern.probabilisticImmunities === -2 ? "#" : pattern.probabilisticImmunities);
												}
											}
										}
									}
								} else {
									// normalize range for edge/corner rules
									if (pattern.neighborhoodLTL === this.cornerEdgeHROT) {
										if (pattern.cornerRange > pattern.rangeLTL) {
											pattern.rangeLTL = pattern.cornerRange;
										}
										if (pattern.edgeRange > pattern.rangeLTL) {
											pattern.rangeLTL = pattern.edgeRange;
										}
									}

									// LTL
									pattern.isLTL = true;
									pattern.ruleName = "R" + pattern.rangeLTL + ",C" + pattern.multiNumStates + ",M" + pattern.middleLTL + ",S" + pattern.SminLTL + ".." + pattern.SmaxLTL + ",B" + pattern.BminLTL + ".." + pattern.BmaxLTL + ",N";
									switch (pattern.neighborhoodLTL) {
										case this.mooreHROT:
											pattern.ruleName += "M";
											break;

										case this.vonNeumannHROT:
											pattern.ruleName += "N";
											break;

										case this.circularHROT:
											pattern.ruleName += "C";
											break;

										case this.crossHROT:
											pattern.ruleName += "+";
											break;

										case this.saltireHROT:
											pattern.ruleName += "X";
											break;

										case this.starHROT:
											pattern.ruleName += "*";
											break;

										case this.l2HROT:
											pattern.ruleName += "2";
											break;

										case this.hexHROT:
											pattern.ruleName += "H";
											break;

										case this.checkerHROT:
											pattern.ruleName += "B";
											break;

										case this.alignedCheckerHROT:
											pattern.ruleName += "D";
											break;

										case this.hashHROT:
											pattern.ruleName += "#";
											break;

										case this.customHROT:
											pattern.ruleName += "@" + pattern.customNeighbourhood + pattern.customGridType;
											break;

										case this.tripodHROT:
											pattern.ruleName += "3";
											break;

										case this.asteriskHROT:
											pattern.ruleName += "A";
											break;

										case this.triangularHROT:
											pattern.ruleName += "L";
											break;

										case this.gaussianHROT:
											pattern.ruleName += "G";
											break;

										case this.weightedHROT:
											pattern.ruleName += "W" + pattern.customNeighbourhood + pattern.customGridType;
											break;

										case this.cornerEdgeHROT:
											pattern.ruleName += "F" + pattern.cornerEdgeCanonical(pattern.rangeLTL);
											break;
									}

									// adjust the survival range if the center cell is not included
									if (pattern.middleLTL === 0) {
										pattern.SminLTL += 1;
										pattern.SmaxLTL += 1;
									}
								}
							}
						} else {
							// check for Wolfram rule
							if (rule[0] === "w") {
								// decode Wolframe rule
								valid = this.decodeWolfram(pattern, rule, ruleArray);
							} else {
								// check for triangular rules
								triangularIndex = rule.lastIndexOf(this.triangularPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;
									pattern.triangularNeighbourhood = this.triangularAll;

									// remove the postfix
									rule = rule.substring(0, rule.length - triangularLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularRuleLetters;
								}

								// check for triangular Edges rules
								triangularIndex = rule.lastIndexOf(this.triangularEdgesPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularEdgesLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;
									pattern.triangularNeighbourhood = this.triangularEdges;

									// remove the postfix
									rule = rule.substring(0, rule.length - triangularEdgesLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularEdgesRuleLetters;
								}

								// check for triangular Vertices rules
								triangularIndex = rule.lastIndexOf(this.triangularVerticesPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularVerticesLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;
									pattern.triangularNeighbourhood = this.triangularVertices;

									// remove the postfix
									rule = rule.substring(0, rule.length - triangularVerticesLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularVerticesRuleLetters;
								}

								// check for triangular Inner rules
								triangularIndex = rule.lastIndexOf(this.triangularInnerPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularInnerLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;
									pattern.triangularNeighbourhood = this.triangularInner;

									// remove the postfix
									rule = rule.substring(0, rule.length - triangularInnerLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularInnerRuleLetters;
								}

								// check for triangular Outer rules
								triangularIndex = rule.lastIndexOf(this.triangularOuterPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularOuterLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;
									pattern.triangularNeighbourhood = this.triangularOuter;

									// remove the postfix
									rule = rule.substring(0, rule.length - triangularOuterLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularOuterRuleLetters;
								}

								// check for triangular Biohazard rules
								triangularIndex = rule.lastIndexOf(this.triangularBiohazardPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularBiohazardLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;
									pattern.triangularNeighbourhood = this.triangularBiohazard;

									// remove the postfix
									rule = rule.substring(0, rule.length - triangularBiohazardLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularBiohazardRuleLetters;
								}

								// check for triangular Radiation rules
								triangularIndex = rule.lastIndexOf(this.triangularRadiationPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularRadiationLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;
									pattern.triangularNeighbourhood = this.triangularRadiation;

									// remove the postfix
									rule = rule.substring(0, rule.length - triangularRadiationLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularRadiationRuleLetters;
								}

								// check for Hex tripod rules
								hexIndex = rule.lastIndexOf(this.hexTripodPostfix);
								if ((hexIndex !== -1) && (hexIndex === rule.length - hexTripodLength)) {
									// rule is a hex type
									pattern.isHex = true;
									pattern.hexNeighbourhood = this.hexTripod;

									// remove the postfix
									rule = rule.substring(0, rule.length - hexTripodLength);

									// update the valid rule letters to hex digits
									validRuleLetters = this.validHexTripodRuleLetters;
								}

								// check for Hex rules
								hexIndex = rule.lastIndexOf(this.hexPostfix);
								if ((hexIndex !== -1) && (hexIndex === rule.length - hexLength)) {
									// rule is a hex type
									pattern.isHex = true;
									pattern.hexNeighbourhood = this.hexAll;

									// remove the postfix
									rule = rule.substring(0, rule.length - hexLength);

									// update the valid rule letters to hex digits
									validRuleLetters = this.validHexRuleLetters;
								}

								// check for Von Neumann rules
								vonNeumannIndex = rule.lastIndexOf(this.vonNeumannPostfix);
								if ((vonNeumannIndex !== -1) && (vonNeumannIndex === rule.length - vonNeumannLength)) {
									// rule is a vonNeumann type
									pattern.isVonNeumann = true;

									// remove the postfix
									rule = rule.substring(0, rule.length - vonNeumannLength);

									// update the valid rule letters to vonNeumann digits
									validRuleLetters = this.vonNeumannDigits;
								}

								// check if the rule contains a slash
								slashIndex = rule.indexOf("/");

								// if no slash then check for underscore
								if (slashIndex === -1) {
									slashIndex = rule.indexOf("_");
								}

								// check for Generations rule
								if (slashIndex !== -1) {
									// check for second slash
									generationsIndex = rule.lastIndexOf("/");
									if (generationsIndex === -1) {
										// check for underscore
										generationsIndex = rule.lastIndexOf("_");
									}

									// check if this is a second slash
									if (generationsIndex !== slashIndex) {
										// generations found
										generationsPart = rule.substring(generationsIndex + 1);

										// remove the generations part
										rule = rule.substring(0, generationsIndex);

										// check for triangular rules
										triangularIndex = rule.lastIndexOf(this.triangularPostfix);
										if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularLength)) {
											// rule is a triangular type
											pattern.isTriangular = true;
											pattern.triangularNeighbourhood = this.triangularAll;

											// remove the postfix
											rule = rule.substring(0, rule.length - triangularLength);

											// update the valid rule letters to triangular letters
											validRuleLetters = this.validTriangularRuleLetters;
										}

										// check for triangular Edges rules
										triangularIndex = rule.lastIndexOf(this.triangularEdgesPostfix);
										if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularEdgesLength)) {
											// rule is a triangular type
											pattern.isTriangular = true;
											pattern.triangularNeighbourhood = this.triangularEdges;

											// remove the postfix
											rule = rule.substring(0, rule.length - triangularEdgesLength);

											// update the valid rule letters to triangular letters
											validRuleLetters = this.validTriangularEdgesRuleLetters;
										}

										// check for triangular Vertices rules
										triangularIndex = rule.lastIndexOf(this.triangularVerticesPostfix);
										if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularVerticesLength)) {
											// rule is a triangular type
											pattern.isTriangular = true;
											pattern.triangularNeighbourhood = this.triangularVertices;

											// remove the postfix
											rule = rule.substring(0, rule.length - triangularVerticesLength);

											// update the valid rule letters to triangular letters
											validRuleLetters = this.validTriangularVerticesRuleLetters;
										}

										// check for Hex rules
										hexIndex = rule.lastIndexOf(this.hexPostfix);
										if ((hexIndex !== -1) && (hexIndex === rule.length - hexLength)) {
											// rule is a hex type
											pattern.isHex = true;

											// remove the postfix
											rule = rule.substring(0, rule.length - hexLength);

											// update the valid rule letters to hex digits
											validRuleLetters = this.validHexRuleLetters;
										}

										// check for Von Neumann rules
										vonNeumannIndex = rule.lastIndexOf(this.vonNeumannPostfix);
										if ((vonNeumannIndex !== -1) && (vonNeumannIndex === rule.length - vonNeumannLength)) {
											// rule is a vonNeumann type
											pattern.isVonNeumann = true;

											// remove the postfix
											rule = rule.substring(0, rule.length - vonNeumannLength);

											// update the valid rule letters to vonNeumann digits
											validRuleLetters = this.vonNeumannDigits;
										}
									}
								}

								// check for "_none_" rule
								if (rule === this.noneRuleName) {
									// mark rule as none and allow all states
									pattern.isNone = true;
									pattern.multiNumStates = 256;
									valid = true;
								} else {
									// check if the rule contains a B and/or S
									bIndex = rule.indexOf("b");
									sIndex = rule.indexOf("s");

									// check if there was a slash to divide birth from survival
									if (slashIndex === -1) {
										// no slash so B or S must exist and one must be at the start of the string
										if (bIndex === 0 || sIndex === 0) {
											// check if birth exists
											if (sIndex === -1) {
												birthPart = rule;
												survivalPart = "";
											} else {
												// check if only survival exists
												if (bIndex === -1) {
													survivalPart = rule;
													birthPart = "";
												} else {
													// both exist so determine whether B or S is first
													if ((bIndex < sIndex) && sIndex !== -1) {
														// cut the string using S
														birthPart = rule.substring(bIndex + 1, sIndex);
														survivalPart = rule.substring(sIndex + 1);
													} else {
														// cut the rule using B
														survivalPart = rule.substring(sIndex + 1, bIndex);
														birthPart = rule.substring(bIndex + 1);
													}
												}
											}
										} else {
											// invalid rule name
											this.failureReason = "Unsupported rule name";
										}
									} else {
										// slash exists so set left and right rule
										if (bIndex === -1 && sIndex !== -1) {
											// only S specified
											bIndex = slashIndex;
										} else if (bIndex !== -1 && sIndex === -1) {
											// only B specified
											sIndex = slashIndex;
										}
										// get the birth and survival parts
										if (bIndex < sIndex) {
											birthPart = rule.substring(0, slashIndex);
											survivalPart = rule.substring(slashIndex + 1);
										} else {
											birthPart = rule.substring(slashIndex + 1);
											survivalPart = rule.substring(0, slashIndex);
										}
									}

									// remove "b" or "s" if present
									if (bIndex !== -1 && birthPart) {
										if (birthPart[0] === "b") {
											birthPart = birthPart.substring(1);
										}
									}
									if (sIndex !== -1 && survivalPart) {
										if (survivalPart[0] === "s") {
											survivalPart = survivalPart.substring(1);
										}
									}

									// if generations then check it is valid
									if (generationsPart !== null) {
										i = 0;
										// check generations has not already been specified
										if (pattern.multiNumStates !== -1) {
											this.failureReason = "Generations defined twice";
											birthPart = null;
										} else {
											pattern.multiNumStates = 0;

											// check for and ignore G or C so "23/3/2", "B3/S23/G2" and "B3/S23/C2" are all supported
											if (i < generationsPart.length && (generationsPart[i].toLowerCase() === "g" || generationsPart[i].toLowerCase() === "c")) {
												i += 1;
											}

											// read generations digits
											validIndex = 0;
											while (i < generationsPart.length && validIndex !== -1) {
												// check each character is a valid digit
												validIndex = this.decimalDigits.indexOf(generationsPart[i]);
												if (validIndex !== -1) {
													// add the digit to the number of generations states
													pattern.multiNumStates = pattern.multiNumStates * 10 + validIndex;
												} else {
													// mark as invalid
													this.failureReason = "Illegal character in generations number";
													pattern.multiNumStates = -1;
													birthPart = null;
												}
												i += 1;
											}

											// check if generations states are valid
											if (pattern.multiNumStates !== -1 && (pattern.multiNumStates < 2 || pattern.multiNumStates > 256)) {
												// mark as invalid
												this.failureReason = "Generations number must be 2-256";
												pattern.multiNumStates = -1;
												birthPart = null;
											}
										}
									}

									// check if rule split correctly
									if (birthPart !== null && survivalPart !== null) {
										// mark as potentially valid
										valid = true;

										// check the birth part is valid
										i = 0;
										while (i < birthPart.length) {
											validIndex = validRuleLetters.indexOf(birthPart[i]);
											if (validIndex === -1) {
												this.failureReason = "Illegal character in birth specification";
												valid = false;
												i = birthPart.length;
											} else {
												i += 1;
											}
										}

										// check the survival part is valid
										if (valid) {
											i = 0;
											while (i < survivalPart.length) {
												validIndex = validRuleLetters.indexOf(survivalPart[i]);
												if (validIndex === -1) {
													this.failureReason = "Illegal character in survival specification";
													valid = false;
													i = survivalPart.length;
												} else {
													i += 1;
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

		// check for unsupported B0 HROT neighbourhoods
		if (valid && pattern.hasHROTB0() && (pattern.neighborhoodHROT === this.weightedHROT || pattern.neighborhoodHROT === this.gaussianHROT)) {
			this.failureReason = "B0 currently not supported";
			valid = false;
		}

		// if valid then create the rule
		if (valid && pattern.wolframRule === -1 && !this.wolframEmulation && pattern.isLTL === false && pattern.isHROT === false) {
			// create the canonical name and the rule map
			tempName = this.createRuleMap(pattern, String(birthPart), String(survivalPart), base64, ruleArray);
			if (this.failureReason === "") {
				pattern.ruleName = tempName;
			} else {
				valid = false;
			}

			// if 2 state generations then use standard engine
			if (pattern.multiNumStates === 2) {
				pattern.multiNumStates = -1;
			}
		}

		if (valid) {
			// add any postfixes
			this.addNamePostfixes(pattern, base64, ignoreAliases);
		} else {
			// remove rule type
			pattern.isLTL = false;
			pattern.isHROT = false;
			pattern.multiNumStates = -1;
			pattern.isNone = true;
		}

		// return whether rule is valid
		return valid;
	};

	// decode an RLE string into a pattern
	/** @returns {number} */
	PatternManager.prototype.decodeRLEString = function(/** @type {Pattern} */ pattern, /** @type {string} */ string, /** @type {boolean} */ save, /** @type {Allocator} */ allocator) {
		// index of next character
		var	/** @type {number} */ index = 0,

			// index at end of string (-1 since the string will have an extra space added to it for lookahead)
			/** @type {number} */ end = string.length - 1,

			// flag if finished
			/** @type {boolean} */ finished = false,

			// flag if valid
			/** @type {boolean} */ valid = true,

			// current and next character
			/** @type {string} */ current,
			/** @type {string} */ next,

			// width of pattern
			/** @type {number} */ width = 0,

			// position in pattern
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,

			// state number for cell (or -1 if not a cell)
			/** @type {number} */ stateNum = -1,

			// run counter
			/** @type {number} */ runCount = 0,

			// mapping from ASCII to state number
			/** @type {number} */ codeA = String("A").charCodeAt(0) - 1,
			/** @type {number} */ codep = String("p").charCodeAt(0) - 1,

			// state counts
			/** @type {Uint32Array} */ stateCount = this.stateCount;

		// reset max state read
		pattern.maxStateRead = -1;

		// get the first character
		next = string[index];

		// process string until finished
		while (!finished) {
			// get the current and next characters
			current = next;
			next = string[index + 1];

			// set not processing a cell
			stateNum = -1;

			// determine what the character was
			switch (current) {
			// comment
			case "#":
				// skip to end of line
				index += 1;
				while (next !== '\n' && index < end) {
					index += 1;
					next = string[index];
				}
				if (index < end) {
					next = string[index + 1];
				} else {
					if (index === end) {
						index -= 1;
					}
				}
				break;

			// digit
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
				// check for leading zero
				if (current === "0" && runCount === 0) {
					this.failureReason = "Leading zero in count";
					pattern.invalid = true;
					finished = true;
				}

				// add to run count
				runCount = (runCount * 10) + parseInt(current, 10);
				break;

			// 2-state off cell
			case "b":
				// state 0 cell
				stateNum = 0;
				break;

			// 2-state on cell
			case "o":
				// state 1 cell
				stateNum = 1;
				break;

			// multi-state off cell
			case ".":
				// state 0 cell
				stateNum = 0;
				break;

			// Niemiec z cell
			case "z":
				// map to [R]Super state 19
				stateNum = 19;
				pattern.isSuper = true;
				pattern.isNiemiec = true;
				break;

			// end of line
			case "$":
				// ensure at least one row
				if (runCount === 0) {
					runCount = 1;
				}

				// move down required number of rows
				y += runCount;
				runCount = 0;

				// update width
				if (x > width) {
					width = x;
				}

				// reset to start of row
				x = 0;
				break;

			// end of pattern
			case "!":
				// ensure at least one row
				if (runCount === 0) {
					runCount = 1;
				}

				// move down required number of rows
				y += runCount;
				runCount = 0;

				// update width
				if (x > width) {
					width = x;
				}

				// mark finished decoding
				finished = true;
				break;

			// other characters
			default:
				// mark as potentially invalid
				valid = false;

				// check if single digit extended state
				if (current >= "A" && current <= "X") {
					valid = true;
					stateNum = current.charCodeAt(0) - codeA;
				} else {
					// check if dual digit extended state
					if (current >= "p" && current < "y") {
						// check next digit
						if (next >= "A" && next <= "X") {
							// get the two digit state number
							valid = true;
							stateNum = (current.charCodeAt(0) - codep) * 24 + (next.charCodeAt(0) - codeA);

							// eat the second digit
							index += 1;
							next = string[index + 1];
						} else {
							// check for Niemiec
							if (current === "x") {
								valid = true;
								pattern.isSuper = true;
								pattern.isNiemiec = true;

								// map to [R]Super state 15
								stateNum = 15;
							}
						}
					} else {
						if (current === "y") {
							// check next digit
							if (next >= "A" && next <= "O") {
								// get the two digit state number
								valid = true;
								stateNum = (current.charCodeAt(0) - codep) * 24 + (next.charCodeAt(0) - codeA);

								// eat the second digit
								index += 1;
								next = string[index + 1];
							} else {
								// check for Niemiec
								valid = true;
								pattern.isSuper = true;
								pattern.isNiemiec = true;

								// map to [R]Super state 17
								stateNum = 17;
							}
						}

					}
				}
				break;
			}

			// check whether a cell was detected
			if (stateNum >= 0) {
				// ensure at least one cell
				if (runCount === 0) {
					runCount = 1;
				}

				// update state used flags and counts if not saving
				if (!save) {
					// check if this is the first time the state was seen
					if (stateCount[stateNum] === 0) {
						pattern.numUsedStates += 1;
					}

					// count the number of cells in this state
					stateCount[stateNum] += runCount;

					// save maximum state found
					if (stateNum >= pattern.numStates) {
						pattern.numStates = stateNum + 1;
					}
				}

				// always save maximum state found (raw)
				if (stateNum >= pattern.maxStateRead) {
					pattern.maxStateRead = stateNum;
				}

				// add cells to the row if saving and not state 0
				if (stateNum > 0 && save) {
					while (runCount > 0) {
						// save multi-state cell
						if (pattern.multiNumStates === -1) {
							// save cell normally
							pattern.multiStateMap[y][x] = stateNum;
						} else {
							// check for 2 state LTL or HROT
							if (pattern.multiNumStates === 2) {
								if (stateNum === 1) {
									pattern.multiStateMap[y][x] = LifeConstants.aliveStart;
								} else {
									pattern.multiStateMap[y][x] = 0;
								}
							} else {
								// check state is valid
								if (stateNum < pattern.multiNumStates) {
									pattern.multiStateMap[y][x] = stateNum;
								} else {
									pattern.multiStateMap[y][x] = 1;
								}
							}
						}

						// update 2d map if normal state 1, [R]History, [R]Extended or [R]Super odd states, Generations state 1
						if ((!(pattern.isHistory || pattern.isExtended || pattern.isSuper) && pattern.multiNumStates === -1 && stateNum === 1) || ((pattern.isHistory || pattern.isSuper) && (stateNum & 1)) || (pattern.multiNumStates !== -1 && stateNum === 1)) {
							pattern.lifeMap[y][x >> 4] |= 1 << (~x & 15);
						}

						// next cell
						x += 1;
						runCount -= 1;
					}
				} else {
					// state 0 or not saving so just skip
					x += runCount;
					runCount = 0;
				}
			}

			// check if processing was valid
			if (!valid) {
				// check if the characters were whitespace
				if (current === " " || current === "\t"  || current === "\r" || current === "\n") {
					// whitespace is allowed unless a count is in progress
					if (runCount === 0) {
						// all ok
						valid = true;
					} else {
						this.failureReason = "Illegal whitespace in pattern";
						pattern.invalid = true;
						finished = true;
					}
				} else {
					// invalid character found so mark pattern as invalid
					this.failureReason = "Illegal character in pattern: " + current;
					pattern.invalid = true;
					finished = true;
					this.illegalState = true;
				}
			}

			// go to next character
			index += 1;

			// terminate if at end of string
			if (index === end) {
				// check if finished
				if (!finished) {
					// ensure at least one row
					if (runCount === 0) {
						runCount = 1;
					}

					// move down required number of rows
					y += runCount;
					runCount = 0;

					// update width
					if (x > width) {
						width = x;
					}
				}

				// mark as finished
				finished = true;
			}
		}

		// check if not saving
		if (!save) {
			// ensure pattern is at least one cell big so empty patterns are valid
			if (width === 0) {
				// allocate at least one cell for empty patterns
				width = 1;
				y = 1;
			}

			// save width and height
			pattern.width = width;
			pattern.height = y;

			// check if small enough to save
			if (width > this.maxWidth || y > this.maxHeight) {
				// flag pattern too large
				pattern.tooBig = true;
				pattern.patternFormat = "RLE";
			} else {
				// allocate 2d cell array
				pattern.lifeMap = Array.matrix(Type.Uint16, y, ((width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");

				// allocate multi-state array
				pattern.multiStateMap = Array.matrix(Type.Uint8, y, width, 0, allocator, "Pattern.multiStateMap");

				// set decoder used
				pattern.patternFormat = "RLE";
			}
		}

		// check if the pattern is valid
		if (pattern.invalid) {
			index = -1;
		}

		// return the index
		return index;
	};

	// set the pattern originator
	PatternManager.prototype.setOriginator = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// end of line index
		var	/** @type {number} */ endIndex = source.indexOf("\n");

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// set the originator
		pattern.originator = source.substring(0, endIndex).trim();
	};

	// skip whitespace
	/** @returns {number} */
	PatternManager.prototype.skipWhitespace = function(/** @type {string} */ source, /** @type {number} */ index, /** @type {number} */ endIndex) {
		// index of next non-whitespace character
		var	/** @type {number} */ result = index,

			// terminator
			/** @type {boolean} */ found = false,

			// counter
			/** @type {number} */ i = index;

		while (i < endIndex && !found) {
			if (source[i] === " ") {
				i += 1;
			} else {
				found = true;
			}
		}

		// return index of next non-whitespace character
		result = i;
		return result;
	};

	// read Generation
	PatternManager.prototype.readGeneration = function(/** @type {string} */ source) {
		// find the end of line
		var	/** @type {number} */ newLine = source.indexOf("\n"),

			// generation number
			/** @type {number} */ generation = 0,

			// digit value
			/** @type {number} */ digit = 0,

			// whether character found
			/** @type {boolean} */ found = false,

			// whether minus found
			/** @type {boolean} */ minus = false,

			// counter
			/** @type {number} */ i = 0;

		// check if there was a new line
		if (newLine === -1) {
			newLine = source.length;
		}

		// check for the equals
		while (i < newLine && !found) {
			if (source[i] === "=") {
				found = true;
			} else {
				// skip whitespace
				if (source[i] !== " ") {
					found = true;
				} else {
					// next character
					i += 1;
				}
			}
		}

		// check if found
		if (found && source[i] === "=") {
			// skip equals sign
			i += 1;

			// skip any whitespace
			i = this.skipWhitespace(source, i, newLine);

			// check for minus
			if (i < newLine && source[i] === "-") {
				minus = true;
				i += 1;
			}

			// check each digit
			found = false;
			while (i < newLine && !found) {
				// read the digit
				digit = this.decimalDigits.indexOf(source[i]);

				// check if the digit was a number
				if (digit !== -1) {
					generation = (generation * 10) + digit;
					i += 1;
				} else {
					found = true;
				}
			}

			// save the generation
			this.genDefined = true;
			if (minus) {
				generation = -generation;
			}
			this.generation = generation;
		}
	};

	// read Position
	PatternManager.prototype.readPosition = function(/** @type {string} */ source, /** @type {boolean} */ needEquals) {
		// find the end of line
		var	/** @type {number} */ newLine = source.indexOf("\n"),

			// x and y position
			/** @type {number} */ posX = 0,
			/** @type {number} */ posY = 0,

			// whether x and y are negative
			/** @type {boolean} */ negX = false,
			/** @type {boolean} */ negY = false,

			// digit value
			/** @type {number} */ digit = 0,

			// whether character found
			/** @type {boolean} */ found = false,

			// counter
			/** @type {number} */ i = 0;

		// check if there was a new line
		if (newLine === -1) {
			newLine = source.length;
		}

		// check for the equals if required
		if (needEquals) {
			while (i < newLine && !found) {
				if (source[i] === "=") {
					found = true;
				} else {
					// skip whitespace
					if (source[i] !== " ") {
						found = true;
					} else {
						// next character
						i += 1;
					}
				}
			}
			if (found && source[i] === "=") {
				// skip equals sign
				i += 1;
			}
		} else {
			// no equals needed
			found = true;
		}

		// check if found
		if (found) {
			// skip any whitespace
			i = this.skipWhitespace(source, i, newLine);

			// check for negative
			if (i < newLine) {
				if (source[i] === "-") {
					negX = true;
					i += 1;
				}

				// check each digit
				found = false;
				while (i < newLine && !found) {
					// read the digit
					digit = this.decimalDigits.indexOf(source[i]);

					// check if the digit was a number
					if (digit !== -1) {
						posX = (posX * 10) + digit;
						i += 1;
					} else {
						found = true;
					}
				}

				// mark position found
				this.posDefined = true;

				// save the x position 
				if (negX) {
					this.posX = -posX;
				} else {
					this.posX = posX;
				}

				// skip whitespace
				i = this.skipWhitespace(source, i, newLine);

				// check for comma
				if (i < newLine) {
					if (source[i] === ",") {
						i += 1;
						// skip whitespace
						i = this.skipWhitespace(source, i, newLine);

						// check for negative
						if (i < newLine) {
							if (source[i] === "-") {
								negY = true;
								i += 1;
							}

							// check each digit
							found = false;
							while (i < newLine && !found) {
								// read the digit
								digit = this.decimalDigits.indexOf(source[i]);

								// check if the digit was a number
								if (digit !== -1) {
									posY = (posY * 10) + digit;
									i += 1;
								} else {
									found = true;
								}
							}

							// save the y position
							if (negY) {
								this.posY = -posY;
							} else {
								this.posY = posY;
							}
						}
					}
				}
			}
		}
	};

	// check for extended RLE command
	PatternManager.prototype.checkExtendedCommand = function(/** @type {string} */ source, /** @type {number} */ index) {
		// check if string starts with extended prefix
		var	/** @type {number} */ exists = source.indexOf(this.extendedPrefix, index),
			/** @type {number} */ eolIndex = source.indexOf("\n", index),
			origExists = exists;

		if (exists !== -1) {
			// check if Pos command exists
			exists = source.indexOf(this.posCommand, exists);
			if (exists !== -1 && exists < eolIndex) {
				// attempt to read the Position
				this.readPosition(source.substring(exists + this.posCommand.length), true);
			}

			// check if Gen command exists
			exists = origExists;
			exists = source.indexOf(this.genCommand, exists);
			if (exists !== -1 && exists < eolIndex) {
				this.readGeneration(source.substring(exists + this.genCommand.length));
			}
		}
	};

	// set the pattern name
	PatternManager.prototype.setName = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// end of line index
		var	/** @type {number} */ endIndex = source.indexOf("\n");

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// set the name
		pattern.name = source.substring(0, endIndex).trim();
	};

	// add a line from the source to the title
	/** @returns {number} */
	PatternManager.prototype.addToTitle = function(/** @type {Pattern} */ pattern, /** @type {string} */ prefix, /** @type {string} */ source, /** @type {number} */ index, /** @type {boolean} */ afterRLE) {
		// end of line index
		var	/** @type {number} */ endIndex = source.indexOf("\n", index),
			/** @type {string} */ text = "";

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// get the line of text and remove final whitespace
		text = source.substring(index, endIndex);

		// add to title with leading and trailing whitespace removed
		pattern.titleConcat.push(text.trim());

		// remove trailing whitespace
		text = (prefix + text).replace(/[ \t]+$/g, "");

		// add to raw titles
		if (afterRLE) {
			pattern.afterTitleConcat.push(text);
		} else {
			pattern.beforeTitleConcat.push(text);
		}

		// return the length added
		return endIndex + 1 - index;
	};

	// read value from string
	/** @returns {number} */
	PatternManager.prototype.readValueFromString = function(/** @type {string} */ source) {
		// digit value
		var	/** @type {number} */ digit = 0,

			// total value
			/** @type {number} */ value = 0;

		// add space for peekahead
		source += " ";

		// check if next character is a digit
		digit = this.decimalDigits.indexOf(source[this.index]);
		if (digit !== -1) {
			value = 0;

			// keep going until a non-digit is found
			while (digit !== -1) {
				value = (value * 10) + digit;
				this.index += 1;
				digit = this.decimalDigits.indexOf(source[this.index]);
			}
		}

		// return value
		return value;
	};

	// decode sphere and set width to -1 if invalid
	PatternManager.prototype.decodeSphere = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// read width
		var	/** @type {number} */ width = this.readValueFromString(source),

			// set height to width
			/** @type {number} */ height = width,

			// check for diagonal axis
			/** @type {boolean} */ topLeft = true,

			// next character
			/** @type {string} */ chr = source[this.index];

		// save width and height
		pattern.gridWidth = width;
		pattern.gridHeight = height;

		// save axis
		if (chr === "*") {
			topLeft = false;
			this.index += 1;
		}
		pattern.gridSphereAxisTopLeft = topLeft;

		// if width and height are zero then removed bounded grid
		if (width === 0 && height === 0) {
			pattern.gridType = -1;
		}
	};

	// decode torus and set width to -1 if invalid
	PatternManager.prototype.decodeTorus = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// read width
		var	/** @type {number} */ width = this.readValueFromString(source),

			// height
			/** @type {number} */ height = -1,

			// shift values
			/** @type {number} */ shiftWidth = 0,
			/** @type {number} */ shiftHeight = 0,

			// maxmimum allowed shift (this is the specified value, actual value is % width or height)
			/** @type {number} */ maxRange = this.maximumShift,

			// next character
			/** @type {string} */ chr = "";

		// check if valid
		if (width !== -1) {
			source += " ";

			// read next character
			chr = source[this.index];

			// check for shift
			if (chr === "-" || chr === "+") {
				// read shift
				this.index += 1;
				shiftWidth = this.readValueFromString(source);

				// check if shift was present
				if (shiftWidth === -1) {
					// flag invalid
					width = -1;
				} else {
					// set shift width
					if (chr === "-") {
						shiftWidth = -shiftWidth;
					}
				}
			}

			// check for comma
			if (source[this.index] === ",") {
				this.index += 1;

				// read height
				height = this.readValueFromString(source);
				if (height === -1) {
					width = -1;
				} else {
					// check for shift
					chr = source[this.index];
					if (chr === "-" || chr === "+") {
						// read shift
						this.index += 1;
						shiftHeight = this.readValueFromString(source);

						// check if shift was present
						if (shiftHeight === -1) {
							// flag invalid
							width = -1;
						} else {
							// set shift height
							if (chr === "-") {
								shiftHeight = -shiftHeight;
							}
						}
					}
				}
			} else {
				// comma missing so make height the same as width
				height = width;
			}
		}

		// check for shift range
		if (shiftWidth < -maxRange || shiftWidth > maxRange || shiftHeight < -maxRange || shiftHeight > maxRange) {
			width = -1;
		}

		// convert shifts to modulo
		if (shiftWidth !== 0 && width > 0) {
			shiftWidth %= width;
		}

		if (shiftHeight !== 0 && height > 0) {
			shiftHeight %= height;
		}

		// if both shifts are specified make invalid
		if (shiftWidth !== 0 && shiftHeight !== 0) {
			width = -1;
		}

		// if width and height are zero then remove bounded grid
		if (width === 0 && height === 0) {
			pattern.gridType = -1;
		}

		// if shift is specified with infinite width or height then make invalid
		if ((shiftWidth !== 0 || shiftHeight !== 0) && (width === 0 || height === 0)) {
			width = -1;
		}

		// save read values
		pattern.gridWidth = width;
		pattern.gridHeight = height;
		pattern.gridHorizontalShift = shiftWidth;
		pattern.gridVerticalShift = shiftHeight;
	};

	// decode klein bottle and set width to -1 if invalid
	PatternManager.prototype.decodeKlein = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// read width
		var	/** @type {number} */ width = this.readValueFromString(source),

			// height
			/** @type {number} */ height = -1,

			// shift values
			/** @type {number} */ shiftWidth = 0,
			/** @type {number} */ shiftHeight = 0,

			// twists
			/** @type {boolean} */ horizontalTwist = false,
			/** @type {boolean} */ verticalTwist = false,

			// next character
			/** @type {string} */ chr = "";

		// check if valid
		if (width !== -1) {
			source += " ";

			// read next character
			chr = source[this.index];

			// check for twist
			if (chr === "*") {
				horizontalTwist = true;

				// next character
				this.index += 1;
				chr = source[this.index];
			}

			// check for shift
			if (chr === "-" || chr === "+") {
				// read shift
				this.index += 1;
				shiftWidth = this.readValueFromString(source);

				// check if shift was present
				if (shiftWidth === -1) {
					// flag invalid
					width = -1;
				} else {
					// set shift width
					if (chr === "-") {
						shiftWidth = -shiftWidth;
					}
				}
			}

			// check for comma
			if (source[this.index] === ",") {
				this.index += 1;

				// read height
				height = this.readValueFromString(source);
				if (height === -1) {
					width = -1;
				} else {
					// check for twist
					chr = source[this.index];
					if (chr === "*") {
						verticalTwist = true;

						// next character
						this.index += 1;
						chr = source[this.index];
					}

					// check for shift
					if (chr === "-" || chr === "+") {
						// read shift
						this.index += 1;
						shiftHeight = this.readValueFromString(source);

						// check if shift was present
						if (shiftHeight === -1) {
							// flag invalid
							width = -1;
						} else {
							// set shift height
							if (chr === "-") {
								shiftHeight = -shiftHeight;
							}
						}
					}
				}
			} else {
				// comma missing so make height the same as width
				height = width;
			}
		}

		// if both twists are specified make invalid
		if (horizontalTwist && verticalTwist) {
			width = -1;
		}

		// if both shifts are specified make invalid
		if (shiftWidth !== 0 && shiftHeight !== 0) {
			width = -1;
		}

		// shift can only be on the twisted edge
		if ((horizontalTwist && shiftHeight !== 0) || (verticalTwist && shiftWidth !== 0)) {
			width = -1;
		}

		// if no twists specified then the default if vertical in which case do not allow horizontal shift
		if (!horizontalTwist && !verticalTwist && shiftWidth !== 0) {
			width = -1;
		}

		// shift only valid if side is even
		if ((shiftWidth !== 0 && (width & 1) !== 0) || (shiftHeight !== 0 && (height & 1) !== 0)) {
			width = -1;
		}

		// if width and height are zero then removed bounded grid
		if (width === 0 && height === 0) {
			pattern.gridType = -1;
		} else {
			// if width or height are zero then make invalid
			if (width === 0 || height === 0) {
				width = -1;
			}
		}

		// one twist must be specified
		if (!horizontalTwist && !verticalTwist) {
			verticalTwist = true;	
		}

		// if shifts are set then set them to 1
		if (shiftWidth !== 0) {
			shiftWidth = 1;
		}

		if (shiftHeight !== 0) {
			shiftHeight = 1;
		}

		// save read values
		pattern.gridWidth = width;
		pattern.gridHeight = height;
		pattern.gridHorizontalShift = shiftWidth;
		pattern.gridVerticalShift = shiftHeight;
		pattern.gridHorizontalTwist = horizontalTwist;
		pattern.gridVerticalTwist = verticalTwist;
	};

	// decode cross-surface and set width to -1 if invalid
	PatternManager.prototype.decodeCrossSurface = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// read width
		var	/** @type {number} */ width = this.readValueFromString(source),

			// height
			/** @type {number} */ height = -1;

		// check if valid
		if (width !== -1) {
			source += " ";

			// check for comma
			if (source[this.index] === ",") {
				this.index += 1;

				// read height
				height = this.readValueFromString(source);
				if (height === -1) {
					width = -1;
				}
			} else {
				// comma missing so make height the same as width
				height = width;
			}
		}

		// if width and height are zero then removed bounded grid
		if (width === 0 && height === 0) {
			pattern.gridType = -1;
		} else {
			// if width or height are zero then make invalid
			if (width === 0 || height === 0) {
				width = -1;
			}
		}

		// save width and height
		pattern.gridWidth = width;
		pattern.gridHeight = height;
	};

	// decode plane and set width to -1 if invalid
	PatternManager.prototype.decodePlane = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// read width
		var	/** @type {number} */ width = this.readValueFromString(source),

			// height
			/** @type {number} */ height = -1;

		// check if valid
		if (width !== -1) {
			source += " ";

			// check for comma
			if (source[this.index] === ",") {
				this.index += 1;

				// read height
				height = this.readValueFromString(source);
				if (height === -1) {
					width = -1;
				}
			} else {
				// comma missing so make height the same as width
				height = width;
			}
		}

		// if width and height are zero then make remove bounded grid
		if (width === 0 && height === 0) {
			pattern.gridType = -1;
		}

		// save width and height
		pattern.gridWidth = width;
		pattern.gridHeight = height;
	};

	// decode bounded grid definition
	/** @returns {boolean} */
	PatternManager.prototype.decodeBoundedGrid = function(/** @type {Pattern} */ pattern, /** @type {string} */ source) {
		// whether definition is valid
		var	/** @type {boolean} */ valid = true;

		// remove whitespace from the grid
		source = this.removeWhiteSpace(source).toLowerCase();

		// check if any characters exist
		if (source !== "") {
			// check the grid type
			valid = false;

			pattern.gridType = this.boundedGridTypes.indexOf(source[0]);
			if (pattern.gridType !== -1) {
				// next character
				this.index = 1;

				// check for twist in other type than klein-bottle
				if (!(pattern.gridType === 2 || pattern.gridType === 4) && source.indexOf("*") !== -1) {
					pattern.gridWidth = -1;
				} else {
					// decode based on type
					switch (pattern.gridType) {
					case 0:
						// plane
						this.decodePlane(pattern, source);
						break;

					case 1:
						// tube/torus
						this.decodeTorus(pattern, source);
						break;

					case 2:
						// klein-bottle
						this.decodeKlein(pattern, source);
						break;

					case 3:
						// cross-surface
						this.decodeCrossSurface(pattern, source);
						break;

					case 4:
						// sphere
						this.decodeSphere(pattern, source);
						break;

					default:
						// others are invalid
						pattern.gridWidth = -1;
					}
				}
			}

			// check for extra characters after bounded grid
			if (this.index !== source.length) {
				pattern.gridWidth = -1;
			}

			// check if decoded successfully
			if (pattern.gridWidth !== -1) {
				valid = true;
			} else {
				// clear grid type
				pattern.gridType = -1;
				this.failureReason = "Invalid bounded grid definition '" + source.toUpperCase() + "'";
			}
		}

		// return valid flag
		return valid;
	};

	// decode a single name=value 
	/** @returns {Array} */
	PatternManager.prototype.decodeNameValue = function(/** @type {string} */ name, /** @type {number} */ index, /** @type {string} */ source, /** @type {number} */ length) {
		var	/** @type {number} */ value = 0,
			/** @type {boolean} */ valueFound = false,
			// ASCII 0
			/** @type {number} */ asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			/** @type {number} */ asciiNine = String("9").charCodeAt(0),
			/** @type {number} */ sourceCode = 0,
			result = null,
			/** @type {boolean} */ isMinus = false;

		// check for name 
		if (source[index] === name) {
			index += 1;

			// skip spaces
			while (index < length && source[index] === " ") {
				index += 1;
			}

			// check for = sign
			if (index < length && source[index] === "=") {
				index += 1;
			}

			// skip spaces
			while (index < length && source[index] === " ") {
				index += 1;
			}

			// decode number
			value = 0;
			valueFound = false;

			// check for minus
			isMinus = false;
			if (index < length && source[index] === "-") {
				index += 1;
				isMinus = true;
			}
			// decode digits
			if (index < length) {
				sourceCode = source[index].charCodeAt(0);
			}

			while (index < length && (sourceCode >= asciiZero && sourceCode <= asciiNine)) {
				value = 10 * value + (sourceCode - asciiZero);
				index += 1;
				valueFound = true;
				if (index < length) {
					sourceCode = source[index].charCodeAt(0);
				}
			}

			// save the width if found
			if (valueFound) {
				if (isMinus) {
					result = -value;
				} else {
					result = value;
				}
			}

			// skip whitespace
			while (index < length && source[index] === " ") {
				index += 1;
			}

			// skip comma
			if (index < length && source[index] === ",") {
				index += 1;
			}

			// skip whitespace
			while (index < length && source[index] === " ") {
				index += 1;
			}
		}

		return [result, index];
	};

	// decode specified size from RLE header
	PatternManager.prototype.decodeSpecifiedSize = function(/** @type {string} */ source, /** @type {number} */ length) {
		var	/** @type {Array} */ result,
			/** @type {number} */ index = 0;

		// check for specified width and height
		this.specifiedWidth = -999999;
		this.specifiedHeight = -999999;

		// check for x
		result = this.decodeNameValue("x", index, source, length);
		index = result[1];
		if (result[0]) {
			this.specifiedWidth = result[0];
		}

		// check for y
		result = this.decodeNameValue("y", index, source, length);
		index = result[1];
		if (result[0]) {
			this.specifiedHeight = result[0];
		}

		// check for h
		result = this.decodeNameValue("h", index, source, length);
		index = result[1];
		if (result[0]) {
			this.posX = result[0];
			this.posDefined = true;
		}

		// check for v
		result = this.decodeNameValue("v", index, source, length);
		index = result[1];
		if (result[0]) {
			this.posY = result[0];
		}
	};

	// decode rule
	/** @returns {number} */
	PatternManager.prototype.decodeRule = function(/** @type {Pattern} */ pattern, /** @type {string} */ source, /** @type {boolean} */ needPrefix, /** @type {Allocator} */ allocator) {
		// end of line index
		var	/** @type {number} */ endIndex = source.indexOf("\n"),

			// rule index
			/** @type {number} */ ruleIndex = source.indexOf("rule"),

			// bounded grid index
			/** @type {number} */ boundedIndex = -1,

			// colon index
			/** @type {number} */ colonIndex = -1,

			// history index
			/** @type {number} */ historyIndex = -1,

			// history postfix length
			/** @type {number} */ historyLength = this.historyPostfix.length,

			// super index
			/** @type {number} */ superIndex = -1,

			// super postfix length
			/** @type {number} */ superLength = this.superPostfix.length,

			// extended index
			/** @type {number} */ extendedIndex = -1,

			// extended postfix length
			/** @type {number} */ extendedLength = this.extendedPostfix.length,

			// whether to ignore aliases
			/** @type {boolean} */ ignoreAliases = false,

			// rule string
			/** @type {string} */ ruleString = "",
			/** @type {string} */ temp = "";

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// determine if prefix is required (optional x = 1, y = 1, and rule =)
		if (needPrefix) {
			// decode any specified size
			this.decodeSpecifiedSize(source, endIndex);
		} else {
			ruleIndex = -1;
		}

		// search for rule
		if (ruleIndex === -1 || (ruleIndex > endIndex)) {
			// no 'rule =' so check whether one was needed
			if (needPrefix) {
				// default to Conway's Life
				ruleString = "";
			} else {
				// get rule
				ruleString = source.substring(1, endIndex).trim();
			}
		} else {
			// remove 'rule ='
			ruleString = source.substring(ruleIndex + 4, endIndex).trim();
			if (ruleString[0] === "=") {
				ruleString = ruleString.substring(1).trim();
			}
		}

		// remove any final , from rule name
		if (ruleString !== "" && ruleString[ruleString.length - 1] === ",") {
			ruleString = ruleString.substring(0, ruleString.length - 1);
		}

		// set the pattern rule name
		pattern.originalRuleName = ruleString;
		pattern.ruleName = ruleString;

		// find the first colon
		colonIndex = ruleString.indexOf(this.boundedGridPrefix);

		// check for bounded grid
		boundedIndex = ruleString.lastIndexOf(this.boundedGridPrefix);
		if (boundedIndex !== -1) {
			// check if there is just one colon
			if (colonIndex === boundedIndex) {
				// check if rule is an alias including the colon
				if (AliasManager.getRuleFromAlias(pattern.ruleName) !== null) {
					boundedIndex = -1;
				}
			}
		}

		// check for bounded grid
		if (boundedIndex !== -1) {
			// decode the bounded grid definition
			if (!this.decodeBoundedGrid(pattern, ruleString.substring(boundedIndex + 1))) {
				// mark bounded index as invalid
				boundedIndex = -2;
			} else {
				// remove the bounded grid definition
				ruleString = ruleString.substring(0, boundedIndex).trim();
			}
		}

		// check for History rules
		historyIndex = ruleString.toLowerCase().lastIndexOf(this.historyPostfix);
		if ((historyIndex !== -1) && (historyIndex === ruleString.length - historyLength)) {
			// rule is a history type
			pattern.isHistory = true;

			// remove the postfix
			ruleString = ruleString.substring(0, ruleString.length - historyLength).trim();
		}

		// check for History when alternate rules defined
		historyIndex = ruleString.indexOf(this.altRuleSeparator);
		if (historyIndex !== -1) {
			// check for History just before separartor
			if (ruleString.toLowerCase().substring(0, historyIndex).trim().substring(historyIndex - historyLength) === this.historyPostfix) {
				// rule is a history type
				pattern.isHistory = true;

				// remove the postfix
				temp = ruleString.substring(0, historyIndex).trim();
				ruleString = temp.substring(0, temp.length - historyLength) + ruleString.substring(historyIndex);
			}
		}

		// check for Super rules
		if (!pattern.isHistory) {
			superIndex = ruleString.toLowerCase().lastIndexOf(this.superPostfix);
			if ((superIndex !== -1) && (superIndex === ruleString.length - superLength)) {
				// rule is a super type
				pattern.isSuper = true;

				// remove the postfix
				ruleString = ruleString.substring(0, ruleString.length - superLength).trim();
			}

			// check for Super when alternate rules defined
			superIndex = ruleString.indexOf(this.altRuleSeparator);
			if (superIndex !== -1) {
				// check for Super just before separartor
				if (ruleString.toLowerCase().substring(0, superIndex).trim().substring(superIndex - superLength) === this.superPostfix) {
					// rule is a super type
					pattern.isSuper = true;

					// remove the postfix
					temp = ruleString.substring(0, superIndex).trim();
					ruleString = temp.substring(0, temp.length - superLength) + ruleString.substring(superIndex);
				}
			}
		}

		// check for Extended rules
		if (!pattern.isHistory && !pattern.isSuper) {
			// add [R]Extended aliases
			if (ruleString.toLowerCase() === "stateinvestigator") {
				ruleString = "B3/S23Investigator";
				ignoreAliases = true;
			} else {
				if (ruleString.toLowerCase() === "leapinvestigator") {
					ruleString = "B2n3/S23-qInvestigator";
					ignoreAliases = true;
				} else {
					if (ruleString.toLowerCase() === "eightinvestigator") {
						ruleString = "B3/S238Investigator";
						ignoreAliases = true;
					} else {
						if (ruleString.toLowerCase() === "pedestrianinvestigator") {
							ruleString = "B38/S23Investigator";
							ignoreAliases = true;
						} else {
							if (ruleString.toLowerCase() === "merryinvestigator") {
								ruleString = "B3-eq4ciqt5ky/S2-c3-k4yz5i8Investigator";
								ignoreAliases = true;
							}
						}
					}
				}
			}

			extendedIndex = ruleString.toLowerCase().lastIndexOf(this.extendedPostfix);
			if ((extendedIndex !== -1) && (extendedIndex === ruleString.length - extendedLength)) {
				// rule is an extended type
				pattern.isExtended = true;

				// remove the postfix
				ruleString = ruleString.substring(0, ruleString.length - extendedLength).trim();
			}

			// check for Extended when alternate rules defined
			extendedIndex = ruleString.indexOf(this.altRuleSeparator);
			if (extendedIndex !== -1) {
				// check for Extended just before separartor
				if (ruleString.toLowerCase().substring(0, extendedIndex).trim().substring(extendedIndex - extendedLength) === this.extendedPostfix) {
					// rule is an extended type
					pattern.isExtended = true;

					// remove the postfix
					temp = ruleString.substring(0, extendedIndex).trim();
					ruleString = temp.substring(0, temp.length - extendedLength) + ruleString.substring(extendedIndex);
				}
			}
		}

		// decode the rule
		if (boundedIndex !== -2 && this.decodeRuleString(pattern, ruleString, allocator, ignoreAliases)) {
			// mark executable
			this.executable = true;
		} else {
			// could not decode so mark as extended format for display
			this.extendedFormat = true;
		}

		// check if no rule specified and no equals in header line
		if (ruleString === "" && source.indexOf("=") === -1) {
			// otherwise assume line is RLE Niemiec data
			endIndex = -1;
		}

		return endIndex + 1;
	};

	// reutrn a bounded grid name
	/** @returns {string} */
	PatternManager.prototype.boundedGridName = function(/** @type {number} */ gridIndex) {
		// result
		var	/** @type {string} */ result = "";

		// determine bounded grid name
		switch (gridIndex) {
		case 0:
			result = "Plane";
			break;
		case 1:
			result = "Torus";
			break;
		case 2:
			result = "Klein bottle";
			break;
		case 3:
			result = "Cross-surface";
			break;
		case 4:
			result = "Sphere";
			break;
		default:
			result = "(unknown)";
			break;
		}

		// return grid name
		return result;
	};

	// setup B0 for HROT patterns
	PatternManager.prototype.setupHROTB0 = function(/** @type {Pattern} */ pattern, /** @type {Allocator} */ allocator) {
		var	/** @type {Uint8Array} */ births = pattern.birthHROT,
			/** @type {Uint8Array} */ survivals = pattern.survivalHROT,
			/** @type {Uint8Array} */ altBirths = pattern.altBirthHROT,
			/** @type {Uint8Array} */ altSurvivals = pattern.altSurvivalHROT,
			/** @type {number} */ maxn = this.maxNeighbours(pattern.rangeHROT, pattern.neighborhoodHROT, pattern.customNeighbourCount),
			/** @type {number} */ i = 0,
			/** @type {Uint8Array} */ tempB = new Uint8Array(pattern.birthHROT.length),
			/** @type {Uint8Array} */ tempS = new Uint8Array(pattern.survivalHROT.length);

		// check for Smax
		if (survivals[maxn + 1]) {
			// B0 with Smax: rule -> NOT(reverse(bits))
			for (i = 0; i <= maxn; i += 1) {
				tempB[i] = 1 - survivals[maxn - i + 1];
				tempS[i + 1] = 1 - births[maxn - i];
			}
			for (i = 0; i <= maxn; i += 1) {
				births[i] = tempB[i];
				survivals[i + 1] = tempS[i + 1];
			}

			// clear alternating flag since no alternating required
			this.altSpecified = false;
		} else {
			// B0 without Smax needs two rules
			pattern.altBirthHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, pattern.birthHROT.length, "HROT.altBirths"));
			pattern.altSurvivalHROT = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, pattern.survivalHROT.length, "HROT.altSurvivals"));
			altBirths = pattern.altBirthHROT;
			altSurvivals = pattern.altSurvivalHROT;

			// odd rule -> reverse(bits)
			for (i = 0; i <= maxn; i += 1) {
				altBirths[i] = survivals[maxn - i + 1];
				altSurvivals[i + 1] = births[maxn - i];
			}

			// even rule -> NOT(bits)
			for (i = 0; i <= maxn; i += 1) {
				births[i] = 1 - births[i];
				survivals[i + 1] = 1 - survivals[i + 1];
			}

			// set alternating flag
			this.altSpecified = true;
		}
	};

	// clear illegal states
	PatternManager.prototype.clearIllegalStates = function(/** @type {Pattern} */ pattern, /** @type {number} */ maxStates) {
		var	/** @type {number} */ y = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ state = 0,
			/** @type {Array<Uint16Array>} */ stateMap = pattern.lifeMap,
			/** @type {Array<Uint8Array>} */ multiStateMap = pattern.multiStateMap,
			/** @type {Uint16Array} */ stateMapRow = null,
			/** @type {Uint8Array} */ multiStateMapRow = null;

		// check if state map exists
		if (stateMap !== null) {
			// handle 2-state HROT/LtL
			if (pattern.isHROT && pattern.multiNumStates === 2) {
				for (x = 2; x < 256; x += 1) {
					if (this.stateCount[x]) {
						this.stateCount[x] = 0;
						pattern.numUsedStates -= 1;
					}
				}
			} else {
				// handle everything else
				for (y = 0; y < multiStateMap.length; y += 1) {
					stateMapRow = stateMap[y];
					multiStateMapRow = multiStateMap[y];
					for (x = 0; x < multiStateMapRow.length; x += 1) {
						state = multiStateMapRow[x];
						if (state >= maxStates) {
							multiStateMapRow[x] = 0;
							stateMapRow[x >> 2] &= ~(1 << (~x & 15));
							if (this.stateCount[state] > 0) {
								this.stateCount[state] = 0;
								pattern.numUsedStates -= 1;
							}
						}
					}
				}
			}
		}
	};

	// validate [R] rule
	/** @returns {boolean} */
	PatternManager.prototype.validateRRule = function(/** @type {Pattern} */ pattern) {
		var	/** @type {string} */ ruleType = "[R]" + this.properHistoryPostfix,
			result = true;

		// create the rule type name
		if (pattern.isSuper) {
			ruleType = "[R]" + this.properSuperPostfix;
		} else {
			if (pattern.isExtended) {
				ruleType = "[R]" + this.properExtendedPostfix;
			}
		}

		// check for multistate rules
		if (pattern.multiNumStates !== -1) {
			if (pattern.isPCA) {
				this.failureReaons = ruleType + " not valid with PCA";
			} else {
				if (pattern.isHROT) {
					this.failureReason = ruleType + " not valid with HROT";
				} else {
					this.failureReason = ruleType + " not valid with Generations";
				}
			}
		}

		// check for PCA rule
		if (pattern.isPCA) {
			this.failureReason = ruleType + " not valid with PCA rule";
		}

		// check for none rule
		if (pattern.isNone) {
			this.failureReason = ruleType + " not valid with none rule";
		}

		// check for triangular neighbourhood
		if (pattern.isTriangular) {
			this.failureReason = ruleType + " not valid with triangular rule";
		}

		// check for Hex Tripod
		if (pattern.hexNeighbourhood === this.hexTripod) {
			this.failureReason = ruleType + " not valid with Hex Tripod";
		}

		// check for LTL
		if (pattern.isLTL) {
			this.failureReason = ruleType + " not valid with LtL";
		}

		// check for Margolus
		if (pattern.isMargolus) {
			this.failureReason = ruleType + " not valid with Margolus";
		}

		// check for Wolfram RuleTable emulation
		if (this.wolframEmulation) {
			this.failureReason = ruleType + " not valid with Wolfram emulation";
		}

		// if failure happened mark pattern as not executable and disable rule type
		if (this.failureReason !== "") {
			this.exectuable = false;
			result = false;
		}

		// return whether validation succeeded
		return result;
	};

	// decode a Life RLE pattern
	PatternManager.prototype.decodeRLE = function(/** @type {Pattern} */ pattern, /** @type {string} */ source, /** @type {Allocator} */ allocator) {
		// index in string
		var	/** @type {number} */ index = 0,

			// end of string
			/** @type {number} */ end = source.length,

			// end of pattern ! index
			/** @type {number} */ endPatIndex = -1,

			// end of line index 
			/** @type {number} */ endLineIndex = -1,

			// whether to add to title
			/** @type {boolean} */ addToComments = true,

			// current character
			/** @type {string} */ current = "",

			// whether decoded
			/** @type {boolean} */ decoded = false,

			// whether saw a rule definition
			/** @type {boolean} */ sawRule = false,

			// state used flags and counts
			/** @type {Uint32Array} */ stateCount = this.stateCount,

			// neighbourhood count
			/** @type {number} */ nCount = 0,

			// border for bounded grid
			/** @type {number} */ border = 4,

			// whether HROT pattern has B0
			/** @type {boolean} */ hasHROTB0 = false,

			// maximum state allowed
			/** @type {number} */ maxStates = 0,

			// counters
			/** @type {number} */ j = 0;

		// reset the pattern
		pattern.isMargolus = false;
		pattern.isNone = false;
		pattern.gridType = -1;
		pattern.width = 0;
		pattern.height = 0;
		pattern.tooBig = false;
		pattern.lifeMap = null;
		pattern.multiStateMap = null;
		pattern.invalid = false;
		pattern.isHistory = false;
		pattern.isSuper = false;
		pattern.isExtended = false;
		pattern.isNiemiec = false;
		pattern.isHex = false;
		pattern.wolframRule = -1;
		pattern.isVonNeumann = false;
		pattern.multiNumStates = -1;
		pattern.isLTL = false;
		pattern.rangeLTL = -1;
		pattern.middleLTL = 1;
		pattern.SminLTL = -1;
		pattern.SmaxLTL = -1;
		pattern.BminLTL = -1;
		pattern.BmaxLTL = -1;
		pattern.isHROT = false;
		pattern.birthHROT = null;
		pattern.survivalHROT = null;
		pattern.rangeHROT = -1;
		pattern.title = "";
		pattern.beforeTitle = "";
		pattern.afterTitle = "";
		pattern.numStates = 2;
		pattern.numUsedStates = 0;

		// clear the state used counts
		stateCount.fill(0);

		// add one to the string for lookahead
		source += " ";

		// read each line from the pattern
		while (index < end && !pattern.invalid) {
			// get current character
			current = source[index];

			// determine line type
			switch (current) {
			// found a command
			case "#":
				// check which command
				index += 1;
				current = source[index];
				index += 1;

				switch (current) {
					case "N":
						// set the name
						this.setName(pattern, source.substring(index));
						break;

					case "O":
						// the the originator
						this.setOriginator(pattern, source.substring(index));
						break;

					case "C":
						// check for eXtended command
						this.checkExtendedCommand(source, index);
						break;

					case "P":
						// check for position
						this.readPosition(source.substring(index), false);
						break;

					case "R":
						// check for rule
						if (!sawRule) {
							// decode rule (size is ignored and computed from the read pattern)
							index += this.decodeRule(pattern, source.substring(index), false, allocator);
							sawRule = true;
						} else {
							// skip to end of line
							endLineIndex = source.substring(index).indexOf("\n");
							if (endLineIndex === -1) {
								endLineIndex = source.substring(index).length;
							}
							index += endLineIndex;
						}

						// don't add #R lines to comments since they will be replaced by a valid RLE header
						addToComments = false;
						break;

					case "\n":
						// line is empty so step back to newline
						index -= 1;
						break;
				}

				// add to title
				if (addToComments) {
					if (current === "\n") {
						index += this.addToTitle(pattern, "#", source, index, decoded);
					} else {
						index += this.addToTitle(pattern, "#" + current, source, index, decoded);
					}
				} else {
					addToComments = true;
				}
				break;

			// newline
			case "\n":
				// ignore
				index += 1;
				break;

			// other characters should be size and rule definition or bitmap start
			default:
				if (current === "x" && index < end && (source[index + 1] === " " || source[index + 1] === "=") && !sawRule) {
					// decode rule (size is ignored and computed from the read pattern)
					index += this.decodeRule(pattern, source.substring(index), true, allocator);
					sawRule = true;
				} else {
					// check if already decoded
					if (decoded) {
						// add to title
						index += this.addToTitle(pattern, "", source, index, true);
					} else {
						// mark decoded
						decoded = true;

						// start of bitmap so attempt to size the pattern
						j = this.decodeRLEString(pattern, source.substring(index), false, allocator);
						if (j !== -1) {
							// looks valid so check if pattern is too big
							if (pattern.tooBig) {
								// pattern too big so skip to process any after comments
								index += j;
							} else {
								// pattern is good so decode the bitmap
								index += this.decodeRLEString(pattern, source.substring(index), true, allocator);
							}
						}
					}
				}
				break;
			}
		}

		// ensure all comments are read after pattern if it is invalid (so script commands can be captured)
		if (pattern.invalid) {
			endPatIndex = source.substring(index).indexOf("!");
			if (endPatIndex !== -1) {
				index += endPatIndex + 1;
				while (index < end) {
					index += this.addToTitle(pattern, "", source, index, true);
				}
			}
		}

		// check whether a rule definition was seen
		if (!sawRule) {
			// default to Conway's Life
			if (this.decodeRuleString(pattern, "", allocator, false)) {
				// mark executable
				this.executable = true;
			} else {
				// could not decode so mark as extended format for display
				this.extendedFormat = true;
			}
		}

		// if pattern is LtL then copy parameters to HROT engine
		if (pattern.isLTL) {
			this.setupHROTfromLTL(pattern, allocator);
		}

		// check for HROT B0 emulation
		hasHROTB0 = pattern.hasHROTB0();
		if (hasHROTB0) {
			this.setupHROTB0(pattern, allocator);
		}

		// check for hex HROT patterns
		if (pattern.isHROT && (pattern.neighborhoodHROT === this.hexHROT || pattern.neighborhoodHROT === this.tripodHROT || pattern.neighborhoodHROT === this.asteriskHROT || ((pattern.neighborhoodHROT === this.weightedHROT || pattern.neighborhoodHROT === this.customHROT) && pattern.customGridType === "H"))) {
			pattern.isHex = true;
		}

		// check for triangular HROT patterns
		if (pattern.isHROT && (pattern.neighborhoodHROT === this.triangularHROT || ((pattern.neighborhoodHROT === this.weightedHROT || pattern.neighborhoodHROT === this.customHROT) && pattern.customGridType === "L"))) {
			pattern.isTriangular = true;
		}

		// check bounded grid size
		if (pattern.gridType !== -1) {
			// check for LtL or HROT rules
			if (pattern.isHROT) {
				border = pattern.rangeHROT * 6;
			}
			if (pattern.isLTL) {
				border = pattern.rangeLTL * 6;
			}
			if (pattern.gridWidth >= this.maxWidth - border || pattern.gridHeight >= this.maxHeight - border) {
				// make invalid
				this.failureReason = "Bounded grid too big";
				this.executable = false;
				pattern.gridType = -1;
			}
		}

		// check for minimum bounded grid size for HROT/LtL rules
		if (pattern.isHROT && pattern.gridType !== -1) {
			if ((pattern.gridWidth !== 0 && (pattern.gridWidth < pattern.rangeHROT * 2)) || (pattern.gridHeight !== 0 && (pattern.gridHeight < pattern.rangeHROT * 2))) {
				this.failureReason = "Bounded grid too small (must be at least " + pattern.rangeHROT * 2 + ")";
				this.executable = false;
				pattern.gridType = -1;
			}
		}

		// check whether Spherical bounded grid has been specified for a Hexagonal rule
		if (pattern.isHex && pattern.gridType > 1 && this.failureReason === "") {
			this.failureReason = "Hexagonal rules only support Plane or Torus";
			this.executable = false;
			pattern.gridType = -1;
		}

		// check whether Spherical bounded grid has been specified for a Triangular rule
		if (pattern.isTriangular && pattern.gridType > 1 && this.failureReason === "") {
			this.failureReason = "Triangular rules only support Plane or Torus";
			this.executable = false;
			pattern.gridType = -1;
		}

		// check whether odd-numbered shifts in bounded grids are given for Triangular rules
		if (pattern.isTriangular && (pattern.gridType === 1 || pattern.gridType === 2)) {
			if ((pattern.gridHorizontalShift & 1) || (pattern.gridVerticalShift & 1)) {
				this.failureReason = "Triangular rules only support even shifts";
				this.executable = false;
				pattern.gridType = -1;
			}
		}

		// check whether odd-numbered shifts in bounded grids are given for Margolus rules
		if (pattern.isMargolus && (pattern.gridType === 1 || pattern.gridType === 2)) {
			if ((pattern.gridHorizontalShift & 1) || (pattern.gridVerticalShift & 1)) {
				this.failureReason = "Margolus rules only support even shifts";
				this.executable = false;
				pattern.gridType = -1;
			}
		}

		// Margolus rules only support plane or torus
		if ((pattern.isMargolus && pattern.gridType > 1) && this.failureReason === "") {
			this.failureReason = "Margolus rules only support Plane or Torus";
			this.executable = false;
			pattern.gridType = -1;
		}

		// PCA rules only support plane or torus
		if ((pattern.isPCA && pattern.gridType > 1) && this.failureReason === "") {
			this.failureReason = "PCA rules only support Plane or Torus";
			this.executable = false;
			pattern.gridType = -1;
		}

		// check whether LTL bounded grid type is valid
		if (pattern.isLTL && this.failureReason === "") {
			if (pattern.gridType > 1) {
				this.failureReason = "LtL only supports Plane or Torus";
				this.executable = false;
				pattern.gridType = -1;
			}
			if (pattern.gridType === 0 || pattern.gridType === 1) {
				if (pattern.gridWidth === 0 || pattern.gridHeight === 0) {
					this.failureReason = "LtL bounded grid must be finite";
					this.executable = false;
					pattern.gridType = -1;
				}
			}
		}

		// triangular rules can only have even width bounded grids
		if (pattern.isTriangular && pattern.gridType !== -1) {
			if ((pattern.gridWidth & 1) !== 0) {
				this.failureReason = "Bounded grid width must be even";
				this.executable = false;
				pattern.gridType = -1;
			} else {
				if ((pattern.gridHeight & 1) !== 0) {
					this.failureReason = "Bounded grid height must be even";
					this.executable = false;
					pattern.gridType = -1;
				}
			}
		}

		// PCA rules do not allow first value to be non-zero
		if (pattern.isPCA) {
			if (this.ruleArray[0] !== 0) {
				this.failureReason = "PCA first value must be 0";
				this.ruleArray[0] = 0;
				this.executable = false;
			}
		}

		// Margolus rules only allow first value to be either 0, or 15 if the last value is 0
		if (pattern.isMargolus) {
			if (this.ruleArray[0] === 15 && this.ruleArray[15] !== 0) {
				this.failureReason = "Margolus last value must be 0 when first is 15";
				this.executable = false;
			} else {
				if (this.ruleArray[0] !== 0 && this.ruleArray[0] !== 15) {
					this.failureReason = "Margolus first value must be 0 or 15";
					this.executable = false;
				}
			}
		}

		// check for HROT and Bounded Grid with shift
		if (pattern.isHROT && pattern.gridType !== -1 && (pattern.gridVerticalShift !== 0 || pattern.gridHorizontalShift !== 0)) {
			this.failureReason = "HROT does not support Bounded Grid shift";
			this.executable = false;
			pattern.gridType = -1;
		}

		// check for HROT B0 and > 2 states
		if (hasHROTB0 && pattern.multiNumStates > 2) {
			this.failureReason = "HROT Generations does not support B0";
			this.executable = false;
		}

		// check whether HROT bounded grid type is valid
		if (pattern.isHROT && this.failureReason === "") {
			if (pattern.gridType > 1) {
				this.failureReason = "HROT only supports Plane or Torus";
				this.executable = false;
				pattern.gridType = -1;
			}
			if (pattern.gridType === 0 || pattern.gridType === 1) {
				if (pattern.gridWidth === 0 || pattern.gridHeight === 0) {
					this.failureReason = "HROT bounded grid must be finite";
					this.executable = false;
					pattern.gridType = -1;
				}
			}
		}

		// validate Niemiec
		if (pattern.isNiemiec && (pattern.isHistory || pattern.isExtended)) {
			if (pattern.isHistory) {
				this.failureReason = "[R]History not valid with Niemiec states"
			} else {
				this.failureReason = "[R]Investigator not valid with Niemiec states"
			}
			this.executable = false;
		}

		// validate [R]History
		if (pattern.isHistory && this.failureReason === "") {
			pattern.isHistory = this.validateRRule(pattern);
		}

		// validate [R]Extended
		if (pattern.isExtended && this.failureReason === "") {
			pattern.isExtended = this.validateRRule(pattern);
		}

		// validate [R]Super (note must come after [R]History and [R]Extended for Niemiec validation)
		if (pattern.isSuper && this.failureReason === "") {
			pattern.isSuper = this.validateRRule(pattern);
		}

		// check for generations and B0
		if (pattern.multiNumStates !== -1 && this.ruleArray[0] && !(pattern.isLTL || pattern.isHROT)) {
			this.failureReason = "Generations does not support B0";
			this.executable = false;
		}

		// check for Margolus and bounded grid
		if (pattern.isMargolus && pattern.gridType !== -1) {
			if (pattern.gridHeight !== -1 && ((pattern.gridHeight & 1) !== 0)) {
				this.failureReason = "Bounded grid height must be even";
				pattern.gridType = -1;
				this.executable = false;
			}
			if (pattern.gridWidth !== -1 && ((pattern.gridWidth & 1) !== 0)) {
				this.failureReason = "Bounded grid width must be even";
				pattern.gridType = -1;
				this.executable = false;
			}
		}

		// check for multiple neighbourhoods
		if (pattern.isHex) {
			nCount += 1;
		}
		if (pattern.isTriangular) {
			nCount += 1;
		}
		if (pattern.isVonNeumann) {
			nCount += 1;
		}
		if (nCount > 1) {
			this.failureReason = "Multiple neighbourhoods specified";
			this.executable = false;
			pattern.isHex = false;
			pattern.isTriangular = false;
			pattern.isVonNeumann = false;
		}

		// setup number of states for [R]Super patterns
		if (pattern.isSuper) {
			pattern.multiNumStates = 26;
		}

		// setup number of states for [R]Extended patterns
		if (pattern.isExtended) {
			pattern.multiNumStates = 21;
		}

		// check for illegal state numbers
		if (this.executable) {
			// check for [R]History
			if (pattern.isHistory) {
				maxStates = 7;
				if (pattern.numStates > maxStates) {
					this.failureReason = "Illegal state in pattern for [R]History";
					this.executable = false;
					this.illegalState = true;
				}
			} else {
				// check for [R]Super
				if (pattern.isSuper) {
					maxStates = 26;
					if (pattern.numStates > maxStates) {
						this.failureReason = "Illegal state in pattern for [R]Super";
						this.executable = false;
						this.illegalState = true;
					}
				} else {
					// check for [R]Extended
					if (pattern.isExtended) {
						maxStates = 21;
						if (pattern.numStates > maxStates) {
							this.failureReason = "Illegal state in pattern for [R]Investigator";
							this.executable = false;
							this.illegalState = true;
						}
					} else {
						// check for other rules
						if (pattern.multiNumStates !== -1) {
							maxStates = pattern.multiNumStates;
							if (pattern.numStates > maxStates) {
								if (pattern.isLTL) {
									this.failureReason = "Illegal state in pattern for LtL";
									this.illegalState = true;
								} else {
									if (pattern.isHROT) {
										this.failureReason = "Illegal state in pattern for HROT";
										this.illegalState = true;
									} else {
										if (pattern.isPCA) {
											this.failureReason = "Illegal state in pattern for PCA";
											this.illegalState = true;
										} else {
											this.failureReason = "Illegal state in pattern for Generations";
											this.illegalState = true;
										}
									}
								}
								this.executable = false;
							}
						}
					}
				}
			}

			// clear illegal states if present
			if (this.illegalState) {
				pattern.numStates = maxStates;
				this.clearIllegalStates(pattern, maxStates);
			}
		}
	};

	// decode rule table icons
	/** @returns {boolean} */
	PatternManager.prototype.decodeIcons = function(/** @type {Pattern} */ pattern, /** @type {Script} */ reader) {
		var	/** @type {boolean} */ valid = true,
			/** @type {boolean} */ xpmHeader = false,
			/** @type {number} */ width = 0,
			/** @type {number} */ height = 0,
			/** @type {number} */ numColours = 0,
			/** @type {number} */ charsPerPixel = 0,
			/** @type {string} */ nextToken = "",
			/** @type {string} */ colourChar = "",
			/** @type {string} */ colourValue = "",
			/** @type {number} */ colourNum = 0,
			/** @type {number} */ lineNo = 0,
			/** @type {boolean} */ isGreyScale = true,
			/** @type {number} */ builtIn = PatternConstants.ruleTableIconNone,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {Uint16Array} */ iconData = null,
			/** @type {Uint16Array} */ temp = null,
			/** @type {Array} */ xpmSections = [],
			colourList = {},
			colourValues = null;

		// skip newline and blank lines
		reader.skipToNextLine();

		// get next token
		nextToken = reader.getNextToken();
		if (nextToken !== "") {
			if (nextToken[0] === "@") {
				nextToken = "";
			}
		}

		// decode each XPM section
		while (valid && nextToken !== "") {
			// decode header
			while (valid && !xpmHeader && nextToken !== "") {
				// skip slash comment lines
				if (nextToken[0] === "/") {
					reader.skipToNextLine();
				} else {
					// check for XPM keyword
					if (nextToken.toLowerCase() === this.ruleTableIconsXPM) {
						reader.skipToNextLine();
					} else {
						// check for quoted line
						if (nextToken[0] === "\"") {
							// look for header
							nextToken = nextToken.substring(1);
							if (reader.isNumeric(nextToken)) {
								// decode value
								width = reader.asNumber(nextToken);

								// get height
								if (reader.nextTokenIsNumeric()) {
									height = reader.getNextTokenAsNumber();

									// get number of colours
									if (reader.nextTokenIsNumeric()) {
										numColours = reader.getNextTokenAsNumber();

										// get chars per pixel
										nextToken = reader.getNextToken();
										if (nextToken[nextToken.length - 1] === "\"") {
											nextToken = nextToken.substring(0, nextToken.length - 1);
											if (reader.isNumeric(nextToken)) {
												charsPerPixel = reader.asNumber(nextToken);
											}
										}
									}
								}
							}

							// check if header decoded
							if (width > 0 && height > 0 && charsPerPixel >= 1 && charsPerPixel <= 2 && height % width === 0) {
								// header valid so check width is supported
								if (!(width === 7 || width === 15 || width === 31)) {
									xpmHeader = false;
								} else {
									// switch to reading colours and icon data
									xpmHeader = true;
									lineNo = 0;
									iconData = new Uint16Array(width * height);
									colourValues = new Uint32Array(numColours);
								}
							} else {
								valid = false;
							}
						} else {
							// check for built-in icons
							switch (nextToken) {
								case "circles":
									builtIn = PatternConstants.ruleTableIconCircles;
									colourList = {};
									iconData = new Uint16Array(0);
									colourValues = [];
									break;
								case "diamonds":
									builtIn = PatternConstants.ruleTableIconDiamonds;
									colourList = {};
									iconData = new Uint16Array(0);
									colourValues = [];
									break;
								case "hexagons":
									builtIn = PatternConstants.ruleTableIconHexagons;
									colourList = {};
									iconData = new Uint16Array(0);
									colourValues = [];
									break;
								case "triangles":
									builtIn = PatternConstants.ruleTableIconTriangles;
									colourList = {};
									iconData = new Uint16Array(0);
									colourValues = [];
									break;
							}
						}
					}
				}

				// skip newline and blank lines
				while (reader.nextIsNewline()) {
					// skip newline
					reader.getNextToken();
				}
				nextToken = reader.getNextToken();
				if (nextToken !== "" && nextToken[0] === "@") {
					nextToken = "";
				}
			}

			// decode icons
			while (valid && xpmHeader && nextToken !== "") {
				// skip slash comment lines
				if (nextToken[0] === "/") {
					reader.skipToNextLine();
				} else {
					// find quoted line
					if (nextToken[0] === "\"") {
						valid = false;
						// check if reading colours
						if (lineNo < numColours) {
							// get colour character
							colourChar = nextToken.substring(1);
							if (colourChar.length === charsPerPixel) {
								if (colourList[colourChar] === undefined) {
									// read the c character
									nextToken = reader.getNextToken();
									if (nextToken === "c") {
										// read the colour value
										nextToken = reader.getNextToken();
										if (nextToken[nextToken.length - 1] === "\"") {
											colourValue = nextToken.substring(0, nextToken.length - 1);
											colourNum = parseInt(colourValue, 16);
											colourList[colourChar] = lineNo;
											colourValues[lineNo] = colourNum;
											// check for greyscale
											if (!(((colourNum >> 16) === ((colourNum >> 8) & 255)) && ((colourNum >> 16) === (colourNum & 255)))) {
												isGreyScale = false;
											}
											valid = true;

											// skip to end of line
											reader.skipToNextLine();
										}
									}
								}
							}
						} else {
							// reading icon data
							valid = false;
							if (nextToken[nextToken.length - 1] === "\"" && ((nextToken.length - 2) === (width * charsPerPixel))) {
								nextToken = nextToken.substring(1, nextToken.length - 1);
								// check each pixel
								i = 0;
								valid = true;
								while (valid && i < width) {
									colourChar = nextToken[i * charsPerPixel];
									if (charsPerPixel > 1) {
										colourChar += nextToken[i * charsPerPixel + 1];
									}
									if (colourList[colourChar] === undefined) {
										valid = false;
									} else {
										// check if more icons are present than specified
										if (lineNo >= height + numColours) {
											console.log("LifeViewer: unexpected icon data found after icon", height / width);

											// add space for a new icon
											temp = iconData;
											height += width;
											iconData = new Uint16Array(width * height);

											for (j = 0; j < temp.length; j += 1) {
												iconData[j] = temp[j];
											}
										}
										iconData[(lineNo - numColours) * width + i] = colourList[colourChar];
									}
									i += 1;
								}
							}
						}
					} else {
						// end of icon data
						if (lineNo === height + numColours) {
							xpmHeader = false;
							// save xpm section
							xpmSections[xpmSections.length] = {builtIn: builtIn, width: width, height: height, numColours: numColours, colours: colourValues.slice(), iconData: iconData.slice(), greyScale: isGreyScale};

							// reset for next section
							colourList = {};
							iconData = null;
							isGreyScale = true;
							builtIn = PatternConstants.ruleTableIconNone;
						} else {
							valid = false;
						}
						reader.stepBack();
					}
					lineNo += 1;
				}

				// skip newline and blank lines
				while (reader.nextIsNewline()) {
					// skip newline
					reader.getNextToken();
				}
				nextToken = reader.getNextToken();
				if (nextToken !== "" && nextToken[0] === "@") {
					nextToken = "";
				}
			}
		}

		// save icons if valid
		if (valid) {
			// save last section
			if (lineNo === height + numColours) {
				// save xpm section
				xpmSections[xpmSections.length] = {builtIn: builtIn, width: width, height: height, numColours: numColours, colours: colourValues.slice(), iconData: iconData.slice(), greyScale: isGreyScale};
				pattern.ruleTableIcons = xpmSections;
			} else {
				valid = false;
				pattern.ruleTableIcons = null;
			}
		} else {
			pattern.ruleTableIcons = null;
		}

		return valid;
	};

	// decode rule table names
	PatternManager.prototype.decodeNames = function(/** @type {Pattern} */ pattern, /** @type {Script} */ reader) {
		var	/** @type {number} */ states = pattern.numStates,
			/** @type {Array} */ names = [],
			/** @type {number} */ index = 0,
			/** @type {string} */ name = "",
			/** @type {boolean} */ valid = false;

		// skip newline and blank lines
		reader.skipToNextLine();

		// check if first token is a number
		if (reader.nextTokenIsNumeric()) {
			index = reader.getNextTokenAsNumber();
			if (index >= 0 && index < states) {
				valid = true;
			}
		}

		// read each line containing name definition
		while (valid) {
			valid = false;

			// read the name
			name = "";
			while ((!reader.nextIsNewline()) && reader.peekAtNextToken() !== "") {
				if (name === "") {
					name = reader.getNextToken();
				} else {
					name += " " + reader.getNextToken();
				}
			}

			// save the state name
			names[index] = name;

			// check for more entries
			reader.skipToNextLine();
			if (reader.nextTokenIsNumeric()) {
				index = reader.getNextTokenAsNumber();
				if (index >= 0 && index < states) {
					valid = true;
				}
			}
		}

		pattern.ruleTableNames = names;
	};

	// decode rule table colours
	PatternManager.prototype.decodeColours = function(/** @type {Pattern} */ pattern, /** @type {Script} */ reader) {
		var	/** @type {number} */ states = pattern.numStates,
			/** @type {Uint32Array} */ cols = pattern.ruleTreeColours,
			/** @type {number} */ num1 = 0,
			/** @type {number} */ num2 = 0,
			/** @type {number} */ num3 = 0,
			/** @type {number} */ num4 = 0,
			/** @type {number} */ num5 = 0,
			/** @type {number} */ num6 = 0,
			/** @type {boolean} */ valid = false;

		// skip newline and blank lines
		reader.skipToNextLine();

		// check if first token is a number
		if (reader.nextTokenIsNumeric()) {
			num1 = reader.getNextTokenAsNumber();
			valid = true;
		}

		// read each line containing colour definition
		while (valid) {
			// must be at least three more numbers (for R G B)
			valid = false;
			if (reader.nextTokenIsNumeric()) {
				num2 = reader.getNextTokenAsNumber();
				if (reader.nextTokenIsNumeric()) {
					num3 = reader.getNextTokenAsNumber();
					if (reader.nextTokenIsNumeric()) {
						num4 = reader.getNextTokenAsNumber();
						valid = true;
					}
				}
			}

			// check if mandatory set of numbers preset
			if (valid) {
				// check for optional two numbers (in case defining ramp)
				if (reader.nextTokenIsNumeric() && reader.forwardTokenIsNumeric(1)) {
					num5 = reader.getNextTokenAsNumber();
					num6 = reader.getNextTokenAsNumber();
					// validate ramp
					if (num1 >= 0 && num1 <= 255 && num2 >= 0 && num2 <= 255 && num3 >= 0 && num3 <= 255 && num4 >= 0 && num4 <= 255 && num5 >= 0 && num5 <= 255 && num6 >= 0 && num6 <= 255) {
						this.createColourRamp(cols, num1, num2, num3, num4, num5, num6);
					} else {
						valid = false;
					}
				} else {
					// validate R G B definition
					if (num1 >= 0 && num1 < states && num2 >= 0 && num2 <= 255 && num3 >= 0 && num3 <= 255 && num4 >= 0 && num4 <= 255) {
						// save colour entry
						cols[num1] = (num2 << 16) | (num3 << 8) | num4;
					} else {
						valid = false;
					}
				}
			}

			// check if valid
			if (valid) {
				// skip to next line
				reader.skipToNextLine();

				// look for next colour entry
				if (reader.nextTokenIsNumeric()) {
					num1 = reader.getNextTokenAsNumber();
				} else {
					valid = false;
				}
			}
		}
	};

	// pack a single transition
	/** @returns {boolean} */
	PatternManager.prototype.packTransition = function(/** @type {Array<Array<number>>} */ inputs, /** @type {number} */ output, /** @type {Pattern} */ pattern, /** @type {Array<number>} */ outputList, /** @type {Array<Array<Array<number>>>} */ lut, /** @type {Array} */ dedupe) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {boolean} */ duplicate = false,
			record = {},
			/** @const {number} */ nInputs = inputs.length,
			/** @const {number} */ nBits = 32,
			/** @const {number} */ iRule = outputList.length,
			/** @const {number} */ iBit = iRule % nBits,
			/** @const {number} */ mask = 1 << iBit,
			/** @type {Array<number>} */ possibles = null,
			/** @type {number} */ iRuleC = (iRule - iBit) / nBits, // compress index of rule
			/** @type {boolean} */ zeroInput = false,
			/** @type {number} */ numZeroInputs = 0;

		// check if the transition is a duplicate
		if (dedupe !== null) {
			i = 0;
			while (!duplicate && i < dedupe.length) {
				record = dedupe[i];
				// check against next record
				if (record.output === output) {
					// outputs match so check inputs
					j = 0;
					duplicate = true;
					while (duplicate && j < inputs.length) {
						if (this.compareArrays(inputs[j], record.inputs[j]) !== 0) {
							duplicate = false;
						}
						j += 1;
					}
				}
				i += 1;
			}
		}

		// add the output to the result
		if (!duplicate) {
			// add to the dedupe list
			if (dedupe !== null) {
				record = {inputs: [], output: output};
				record.inputs = inputs.slice();
				dedupe[dedupe.length] = record;
			}

			// add to the result
			outputList[outputList.length] = output;

			// add a new compressed rule if required
			if (iRuleC >= pattern.ruleTableCompressedRules) {
				for (i = 0; i < nInputs; i += 1) {
					for (j = 0; j < pattern.ruleTableStates; j += 1) {
						lut[i][j][lut[i][j].length] = 0;
					}
				}
				pattern.ruleTableCompressedRules += 1;
			}

			// populate the LUT and check for B0
			for (i = 0; i < nInputs; i += 1) {
				possibles = inputs[i];
				zeroInput = false;
				for (j = 0; j < possibles.length; j += 1) {
					lut[i][possibles[j]][iRuleC] |= mask;
					if (possibles[j] === 0) {
						zeroInput = true;
					}
				}

				if (zeroInput) {
					numZeroInputs += 1;
				}
			}

			// check for B0
			if (output !== 0 && numZeroInputs === nInputs) {
				this.ruleTableB0 = true;
			}
		}

		return duplicate;
	};

	// get the next permutation of an array of arrays (ignoring the first element)
	/** @returns {boolean} */
	PatternManager.prototype.nextPermutation = function(/** @type {Array} */ source) {
		var	/** @type {number} */ l = source.length,
			/** @type {number} */ i = l - 2,
			/** @type {number} */ j = l - 1,
			/** @type {number} */ h = 0,
			/** @type {Array} */ swap = null,
			/** @type {boolean} */ result = false;

		// only process arrays with 2 or more elements
		if (l > 1) {
			// find the decreasing element
			while ((i >= 0) && (this.compareArrays(source[i], source[i + 1]) >= 0)) {
				i -= 1;
			}
			if (i > 0) {
				result = true;
				// find next larger number
				while ((j >= i) && (this.compareArrays(source[j], source[i]) <= 0)) {
					j -= 1;
				}
				swap = source[i];
				source[i] = source[j];
				source[j] = swap;

				// reverse elements
				h = ((l - (i + 1)) / 2) | 0;
				for (j = 0; j < h; j += 1) {
					swap = source[l - j - 1];
					source[l - j - 1] = source[i + 1 + j];
					source[i + 1 + j] = swap;
				}
			}
		}

		return result;
	};

	// compare arrays of arrays function
	/** @type {function(Array,Array):number} */
	PatternManager.prototype.compareArrays = function(a, b) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ aLen = a.length;

		if (aLen === b.length) {
			while (i < aLen && a[i] === b[i]) {
				i += 1;
			}
			if (i === aLen) {
				return 0;
			}
			return a[i] - b[i];
		}
		return aLen - b.length;
	};

	// pack transitions for rule table
	PatternManager.prototype.packTransitions = function(/** @type {number} */ symmetry, /** @type {number} */ nSymmetries, /** @type {number} */ nInputs, /** @type {Array} */ transitionTable, /** @type {Pattern} */ pattern) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {Array<Array<number>>} */ inputs = [],
			/** @type {Array<Array<number>>} */ permutedInputs = [],
			/** @type {Array<Array<number>>} */ remap = [],
			/** @type {number} */ output = 0,
			/** @type {Array<number>} */ outputList = [],
			/** @type {Array<Array<Array<number>>>} */ lut = [],
			/** @type {number} */ numDups = 0,
			/** @type {Array} */ dedupe = [];

		// allocate the LUT
		for (i = 0; i < nInputs; i += 1) {
			lut[i] = [];
			for (j = 0; j < pattern.ruleTableStates; j += 1) {
				lut[i][j] = [];
			}
		}

		// clear the compressed count
		pattern.ruleTableCompressedRules = 0;

		// process each transition
		for (i = 0; i < transitionTable.length; i += 1) {
			inputs = transitionTable[i].inputs;
			output = transitionTable[i].output;

			// check which symmetry is required
			if (symmetry === 0) {
				// none - permuted inputs are sequential
				this.packTransition(inputs, output, pattern, outputList, lut, null);
			} else if (symmetry === nSymmetries - 1) {
				// permute - start with sorted list (from element 1 onwards)
				permutedInputs = inputs.slice(1).sort(this.compareArrays);
				for (j = 0; j < permutedInputs.length; j += 1) {
					inputs[j + 1] = permutedInputs[j];
				}
				do {
					this.packTransition(inputs, output, pattern, outputList, lut, null);
					// permute from element 1 onwards
				} while (this.nextPermutation(inputs));
			} else {
				// other symmetry - get the remaps for the given symmetry
				remap = this.ruleTableSymmetryRemap[pattern.ruleTableNeighbourhood][symmetry - 1];
				// check for duplicates within this input set
				dedupe = [];
				for (j = 0; j < remap.length; j += 1) {
					for (k = 0; k < inputs.length; k += 1) {
						permutedInputs[k] = inputs[remap[j][k]];
					}
					if (this.packTransition(permutedInputs, output, pattern, outputList, lut, dedupe)) {
						numDups += 1;
					}
				}
			}
		}

		// save the LUT
		pattern.ruleTableLUT = [];
		for (i = 0; i < nInputs; i += 1) {
			pattern.ruleTableLUT[i] = [];
			for (j = 0; j < pattern.ruleTableStates; j += 1) {
				pattern.ruleTableLUT[i][j] = new Uint32Array(lut[i][j].length);
				pattern.ruleTableLUT[i][j].set(lut[i][j]);
			}
		}

		// save the outputs
		pattern.ruleTableOutput = new Uint8Array(outputList.length);
		pattern.ruleTableOutput.set(outputList);
		pattern.ruleTableDups = numDups;
	};

	// decode rule table table
	/** @returns {boolean} */
	PatternManager.prototype.decodeTable = function(/** @type {Pattern} */ pattern, /** @type {Script} */ reader) {
		var	/** @type {string} */ nextToken = "",
			/** @type {number} */ states = -1,
			/** @type {number} */ neighbourhood = -1,
			/** @type {number} */ symmetry = -1,
			/** @type {number} */ nInputs = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {string} */ varName = "",
			/** @type {Array<number>} */ varValues = [],
			/** @type {number} */ readState = 0,
			/** @type {string} */ readVar = "",
			variables = {},
			boundVariableIndices = {},
			/** @type {number} */ numVars = 0,
			/** @type {Array<Array<number>>} */ inputs = [],
			/** @type {number} */ output = 0,
			/** @type {number} */ charVal = 0,
			/** @type {Array} */ transitionTable = [],
			/** @type {Array<string>} */ lineTokens = [],
			/** @type {Int32Array} */ lineValues = null,
			/** @type {string} */ currentToken = "",
			/** @type {Array<string>} */ boundVars = [],
			/** @type {number} */ varCount = 0,
			/** @type {boolean} */ found = false,
			/** @type {boolean} */ valid = false;

		// reset B0 flag
		this.ruleTableB0 = false;

		// read first three lines
		i = 0;
		valid = true;
		while (valid && i < 3) {
			nextToken = reader.getNextTokenSkipNewline();
			switch (nextToken.toLowerCase()) {

			// n_states
			case this.ruleTableStates:
				valid = false;
				if (reader.getNextToken() === ":") {
					if (reader.nextTokenIsNumeric()) {
						states = reader.getNextTokenAsNumber() | 0;
						if (states >= 2 && states <= 256) {
							valid = true;
						} else {
							this.failureReason = this.ruleTableStates + " must be from 2 to 256";
						}
					} else {
						this.failureReason = this.ruleTableStates + " must be numeric";
					}
				} else {
					this.failureReason = this.ruleTableStates + " missing :";
				}
				break;

			// neighborhood
			case this.ruleTableNeighbours:
				valid = false;
				if (reader.getNextToken() === ":") {
					nextToken = reader.getNextToken();

					// search for the neighbourhood
					found = false;
					j = 0;
					while (!found && j < this.ruleTableNeighbourhoods.length) {
						if (nextToken.toLowerCase() === this.ruleTableNeighbourhoods[j]) {
							neighbourhood = j;
							nInputs = this.ruleTableInputs[j];
							found = true;

							// allocate the line values array
							lineValues = new Int32Array(nInputs + 1);
						} else {
							j += 1;
						}
					}
					valid = found;
					if (!found) {
						this.failureReason = this.ruleTableNeighbours + " invalid";
					}
				} else {
					this.failureReason = this.ruleTableNeighbours + " missing :";
				}
				break;

			// symmetries
			case this.ruleTableSymmetries:
				valid = false;
				// must have already read neighbourhood
				if (neighbourhood !== -1) {
					if (reader.getNextToken() === ":") {
						nextToken = reader.getNextToken();

						// search the neighbourhood symmetries
						found = false;
						j = 0;
						while (!found && j < this.ruleTableSymmetriesList[neighbourhood].length) {
							if (nextToken.toLowerCase() === this.ruleTableSymmetriesList[neighbourhood][j]) {
								symmetry = j;
								found = true;
							} else {
								j += 1;
							}
						}
						valid = found;
						if (!found) {
							this.failureReason = this.ruleTableSymmetries + " invalid";
						}
					} else {
						this.failureReason = this.ruleTableSymmetries + " missing :";
					}
				} else {
					this.failureReason = this.ruleTableSymmetries + " must follow " + this.ruleTableNeighbours;
				}
				break;

			default:
				// anything else is an error
				valid = false;
				break;
			}

			// next line
			i += 1;
		}

		// check if mandatory settings were read
		if (states === -1 || neighbourhood === -1 || symmetry === -1) {
			if (this.failureReason === "") {
				if (states === -1) {
					this.failureReason = "missing " + this.ruleTableStates;
				} else {
					if (neighbourhood === -1) {
						this.failureReason = "missing " + this.ruleTableNeighbours;
					} else {
						this.failureReason = "missing " + this.ruleTableSymmetries;
					}
				}
			}
			valid = false;
		}

		// read each line
		reader.skipNewlines();
		nextToken = reader.getNextToken();
		if (nextToken !== "" && nextToken[0] === "@") {
			nextToken = "";
		}
		while (valid && nextToken !== "") {
			// check for variable
			if (nextToken.toLowerCase() === this.ruleTableVar) {
				valid = false;

				// get variable name
				varName = reader.getNextToken();

				// read the rest of the line
				varValues = [];

				// allow equals symbol to be omitted
				if (reader.peekAtNextToken() === "=") {
					reader.getNextToken();
				}
				valid = true;
				while (valid && !reader.nextIsNewline()) {
					// if the next token is a number then read it as a state
					if (reader.nextTokenIsNumeric()) {
						readState = reader.getNextTokenAsNumber();
						if (readState >= 0 && readState <= states) {
							varValues[varValues.length] = readState;
						} else {
							valid = false;
							this.failureReason = "out of range value: " + varName + "=" + readState;
						}
					} else {
						// next token is not numeric so should be a variable
						readVar = reader.getNextToken();

						// if the variable exists then copy its contents
						if (variables[readVar] !== undefined) {
							for (i = 0; i < variables[readVar].length; i += 1) {
								varValues[varValues.length] = variables[readVar][i];
							}
						} else {
							valid = false;
							this.failureReason = "var unknown assignment: " + varName + "=" + readVar;
						}
					}
				}

				// check if line decoded
				if (valid) {
					// save the variable
					variables[varName] = varValues;
					numVars += 1;
				}
			} else {
				// read transition line
				if (states <= 10 && numVars === 0 && reader.nextIsNewline()) {
					// single-digit format
					inputs = [];
					valid = false;
					if (nextToken.length === nInputs + 1) {
						// decode transitions
						i = 0;
						valid = true;
						while (valid && i < nInputs) {
							charVal = nextToken.charCodeAt(i);
							if (charVal >= 48 && charVal < 48 + states) {
								inputs[inputs.length] = [charVal - 48];
								i += 1;
							} else {
								this.failureReason = "expected only digits: " + nextToken;
								valid = false;
							}
						}
						if (valid) {
							charVal = nextToken.charCodeAt(i);
							if (charVal >= 48 && charVal < 48 + states) {
								output = charVal - 48;

								// add to transition table
								transitionTable[transitionTable.length] = {inputs: inputs, output: output};
							} else {
								this.failureReason = "expected only digits: " + nextToken;
								valid = false;
							}
						}
					}
				} else {
					// comma separated format
					valid = false;

					// read the tokens on the line
					lineTokens = [];
					lineTokens[0] = nextToken;
					if (reader.isNumeric(nextToken)) {
						lineValues[0] = parseInt(nextToken, 10);
					} else {
						lineValues[0] = -1;
					}
					i = 1;
					while (reader.moreTokensOnLine()) {
						if (i < nInputs + 1) {
							if (reader.nextTokenIsNumeric()) {
								lineValues[i] = reader.getNextTokenAsNumber();
								lineTokens[i] = "";
							} else {
								lineValues[i] = -1;
								lineTokens[i] = reader.getNextToken();
							}
						} else {
							lineTokens[i] = reader.getNextToken();
						}
						i += 1;
					}

					// check there are enough
					if (lineTokens.length === nInputs + 1) {
						// first pass: find variables that occur more than once
						// these are "bound" and must take the same value each time they apepar in this transition
						boundVars = [];
						// eslint-disable-next-line
						for (varName in variables) {
							varCount = 0;
							for (i = 0; i < lineTokens.length; i += 1) {
								if (varName === lineTokens[i]) {
									varCount += 1;
								}
							}
							if (varCount > 1) {
								boundVars[boundVars.length] = varName;
							}
						}

						// second pass: iterate through the possible states for the bound variables adding
						// a transition for each combination
						inputs = [];
						boundVariableIndices = {};
						for (i = 0; i < boundVars.length; i += 1) {
							boundVariableIndices[boundVars[i]] = 0;
						}

						valid = true;
						for (;;) {
							// output the transition for the current set of bound variables
							for (i = 0; i < nInputs; i += 1) {
								found = false;
								// check if the current token is numeric
								readState = lineValues[i];
								if (readState !== -1) {
									if (readState >= states) {
										this.failureReason = "state out of range: " + readState;
										valid = false;
									} else {
										inputs[i] = [readState];
									}
								} else {
									currentToken = lineTokens[i];

									// if there are bound variables see if this token is one
									if (boundVars.length) {
										j = 0;
										while (!found && j < boundVars.length) {
											if (boundVars[j] === currentToken) {
												found = true;
											} else {
												j += 1;
											}
										}
									}
									if (boundVars.length > 0 && found) {
										// bound variable
										inputs[i] = [variables[currentToken][boundVariableIndices[currentToken]]];
									} else if (variables[currentToken] !== undefined) {
										// unbound variable
										inputs[i] = variables[currentToken];
									} else {
										this.failureReason = "unknown variable: " + currentToken;
										valid = false;
									}
								}
							}

							// collect the output
							found = false;
							readState = lineValues[i];
							if (readState !== -1) {
								if (readState < 0 || readState >= states) {
									this.failureReason = "output state out of range: " + readState;
									valid = false;
								} else {
									output = readState;
								}
							} else {
								currentToken = lineTokens[i];
								if (boundVars.length > 0) {
									j = 0;
									while (!found && j < boundVars.length) {
										if (boundVars[j] === currentToken) {
											found = true;
										} else {
											j += 1;
										}
									}
								}
								if (boundVars.length > 0 && found) {
									// bound variable
									output = variables[currentToken][boundVariableIndices[currentToken]];
								} else if (variables[currentToken] !== undefined) {
									// unbound variable
									output = variables[currentToken];
								} else {
									this.failureReason = "unknown output variable: " + currentToken;
									valid = false;
								}
							}

							// create the transition table entry
							transitionTable[transitionTable.length] = {inputs: inputs.slice(), output: output};

							// move on to the next value of bound variables
							for (i = 0; i < boundVars.length; i += 1) {
								if (boundVariableIndices[boundVars[i]] < variables[boundVars[i]].length - 1) {
									boundVariableIndices[boundVars[i]] += 1;
									break;
								} else {
									boundVariableIndices[boundVars[i]] = 0;
								}

							}
							if (i >= boundVars.length) {
								break;
							}
						}
					}
				}
			}

			reader.skipNewlines();
			nextToken = reader.getNextToken();
			if (nextToken !== "" && nextToken[0] === "@") {
				// if the token was a new section then rewind one step in the reader
				reader.stepBack();
				nextToken = "";
			}
		}

		// check if decoded successfully
		if (valid) {
			if (pattern.allocator === null) {
				pattern.allocator = new Allocator();
			}

			// save rule information
			pattern.ruleTableStates = states;
			pattern.ruleTableNeighbourhood = neighbourhood;

			// check for hex grid
			if (neighbourhood === PatternConstants.ruleTableHex) {
				pattern.isHex = true;
			} else {
				pattern.isHex = false;
			}

			// create compressed LUT
			this.packTransitions(symmetry, this.ruleTableSymmetriesList[neighbourhood].length, nInputs, transitionTable, pattern);

			// mark pattern as valid
			pattern.numStates = pattern.ruleTableStates;
			this.failureReason = "";
			this.executable = true;
			this.extendedFormat = false;
			pattern.isNone = false;

			// create default colours
			this.createDefaultTreeColours(pattern, pattern.ruleTableStates);
		}

		return valid;
	};

	// create colour ramp
	PatternManager.prototype.createColourRamp = function(/** @type {Uint32Array} */ colours, /** @type {number} */ er, /** @type {number} */ eg, /** @type {number} */ eb, /** @type {number} */ sr, /** @type {number} */ sg, /** @type {number} */ sb) {
		var	/** @type {number} */ states = colours.length,
			/** @type {number} */ mix = 0,
			/** @type {number} */ i = 0;

		// state zero is black
		colours[0] = 0;

		// alive states fade
		for (i = 1; i < states; i += 1) {
			if (states === 2) {
				mix = 0;
			} else {
				mix = (i - 1) / (states - 2);
			}
			colours[i] = ((((sr * mix) + (er * (1 - mix))) | 0) << 16) | ((((sg * mix) + (eg * (1 - mix))) | 0) << 8) | (((sb * mix) + (eb * (1 - mix))) | 0);
		}
	};

	// create default rule tree colours
	PatternManager.prototype.createDefaultTreeColours = function(/** @type {Pattern} */ pattern, /** @type {number} */ states) {
		// allocate colour array
		pattern.ruleTreeColours = new Uint32Array(states);

		// create ramp
		this.createColourRamp(pattern.ruleTreeColours, 255, 0, 0, 255, 255, 0);
	};

	// determine if there is a hex neighbourhood definition for @TREE (will be in another section)
	/** @returns {boolean} */
	PatternManager.prototype.ruleTreeHex = function(/** @type {Script} */ reader) {
		var	/** @type {RegExp} */ reg = new RegExp(this.ruleTableNeighbours + " *: *" + this.ruleTableNeighbourhoods[PatternConstants.ruleTableHex]),
			/** @type {boolean} */ isHex = reg.test(reader.source);

		return isHex;
	};

	// check for B0 in @TREE
	PatternManager.prototype.checkRuleTreeB0 = function(/** @type {Uint32Array} */ a, /** @type {Uint8Array} */ b, /** @type {number} */ neighbours, /** @type {number} */ base) {
		if (neighbours === 4) {
			if (b[a[a[a[a[base]]]]] !== 0) {
				this.ruleTableB0 = true;
			}
		} else {
			if (b[a[a[a[a[a[a[a[a[base]]]]]]]]] !== 0) {
				this.ruleTableB0 = true;
			}
		}
	};

	// decode rule table tree
	/** @returns {boolean} */
	PatternManager.prototype.decodeTree = function(/** @type {Pattern} */ pattern, /** @type {Script} */ reader) {
		var	/** @type {string} */ nextToken = "",
			/** @type {number} */ states = -1,
			/** @type {number} */ neighbours = -1,
			/** @type {number} */ nodes = -1,
			/** @type {boolean} */ valid = false,
			/** @type {Uint32Array} */ dat = null,
			/** @type {number} */ datLen = 0,
			/** @type {Uint8Array} */ datb = null,
			/** @type {number} */ datBLen = 0,
			/** @type {Uint32Array} */ noff = null,
			/** @type {number} */ noffLen = 0,
			/** @type {Uint32Array} */ nodelev = null,
			/** @type {number} */ nodelevLen = 0,
			/** @type {number} */ lev = 0, // was 1000,
			/** @type {number} */ vcnt = 0,
			/** @type {number} */ v = 0,
			/** @type {number} */ i = 0;

		// reset B0 flag
		this.ruleTableB0 = false;

		// read first three lines
		i = 0;
		valid = true;
		while (valid && i < 3) {
			nextToken = reader.getNextTokenSkipNewline();
			switch (nextToken.toLowerCase()) {

			// num_states
			case this.ruleTreeStates:
				valid = false;
				if (reader.getNextToken() === "=") {
					if (reader.nextTokenIsNumeric()) {
						states = reader.getNextTokenAsNumber() | 0;
						if (states >= 2 && states <= 256) {
							valid = true;
						} else {
							this.failureReason = this.ruleTreeStates + " must be from 2 to 256";
						}
					} else {
						this.failureReason = this.ruleTreeStates + " must be numeric";
					}
				} else {
					this.failureReason = this.ruleTreeStates + " missing =";
				}
				break;

			// num_neighbors
			case this.ruleTreeNeighbours:
				valid = false;
				if (reader.getNextToken() === "=") {
					if (reader.nextTokenIsNumeric()) {
						neighbours = reader.getNextTokenAsNumber() | 0;
						if (neighbours === 4 || neighbours === 8) {
							valid = true;
						} else {
							this.failureReason = this.ruleTreeNeighbours + " must be 4 or 8";
						}
					} else {
						this.failureReason = this.ruleTreeNeighbours + " must be numeric";
					}
				} else {
					this.failureReason = this.ruleTreeNeighbours + " missing =";
				}
				break;

			// num_nodes
			case this.ruleTreeNodes:
				valid = false;
				if (reader.getNextToken() === "=") {
					if (reader.nextTokenIsNumeric()) {
						nodes = reader.getNextTokenAsNumber() | 0;
						if (nodes >= neighbours && nodes <= 100000000) {
							valid = true;
						} else {
							this.failureReason = this.ruleTreeNodes + " out of range";
						}
					} else {
						this.failureReason = this.ruleTreeNodes + " must be numeric";
					}
				} else {
					this.failureReason = this.ruleTreeNodes + " missing =";
				}
				break;

			default:
				// anything else is an error
				valid = false;
				break;

			}

			// next line
			i += 1;
		}

		// check if mandatory settings were read
		if (states === -1 || neighbours === -1 || nodes === -1) {
			if (this.failureReason === "") {
				if (states === -1) {
					this.failureReason = "missing " + this.ruleTreeStates;
				} else {
					if (neighbours === -1) {
						this.failureReason = "missing " + this.ruleTreeNeighbours;
					} else {
						this.failureReason = "missing " + this.ruleTreeNodes;
					}
				}
			}
			valid = false;
		}

		// allocate arrays
		if (valid) {
			dat = new Uint32Array(nodes * states);
			datb = new Uint8Array(nodes * states);
			noff = new Uint32Array(nodes);
			nodelev = new Uint32Array(nodes);
		}

		// read each line
		reader.skipNewlines();
		while (valid && reader.nextTokenIsNumeric()) {
			if (noffLen > nodes) {
				valid = false;
			} else {
				lev = reader.getNextTokenAsNumber();
				vcnt = 0;
				if (lev === 1) {
					noff[noffLen] = datBLen;
					noffLen += 1;
				} else {
					noff[noffLen] = datLen;
					noffLen += 1;
				}
				nodelev[nodelevLen] = lev;
				nodelevLen += 1;
			}

			// read the line of values
			while (valid && reader.nextTokenIsNumeric()) {
				v = reader.getNextTokenAsNumber();
				if (lev === 1) {
					if (v < 0 || v >= states) {
						this.failureReason = "bad state value in tree data: " + v;
						valid = false;
					} else {
						datb[datBLen] = v;
						datBLen += 1;
					}
				} else {
					if (v < 0 || v > noff.length) {
						this.failureReason = "bad node value in tree data: " + v;
						valid = false;
					} else {
						if (nodelev[v] !== lev - 1) {
							this.failureReason = "bad node pointer in tree data: " + lev;
							valid = false;
						} else {
							dat[datLen] = noff[v];
							datLen += 1;
						}
					}
				}
				vcnt += 1;
			}
			if (valid && (vcnt !== states)) {
				this.failureReason = "bad number of values on tree data line";
				valid = false;
			}
			reader.skipNewlines();
		}

		// perform final validation
		if (valid) {
			if ((datLen + datBLen) !== (nodes * states)) {
				this.failureReason = "bad count of values in tree data";
				valid = false;
			} else {
				if (lev !== neighbours + 1) {
					this.failureReason = "bad last node (wrong level)";
					valid = false;
				}
			}
		}

		// if valid then save parameters
		if (valid) {
			if (pattern.allocator === null) {
				pattern.allocator = new Allocator();
			}
			// save rule information
			pattern.ruleTreeNeighbours = neighbours;
			pattern.ruleTreeStates = states;
			pattern.ruleTreeNodes = nodes;
			pattern.ruleTreeBase = noff[noff.length - 1];
			pattern.ruleTreeA = dat.slice(0, datLen);
			pattern.ruleTreeB = datb.slice(0, datBLen);
			pattern.ruleTreeIsHex = this.ruleTreeHex(reader);
			pattern.isHex = pattern.ruleTreeIsHex;

			// mark pattern as valid
			pattern.numStates = pattern.ruleTreeStates;
			this.failureReason = "";
			this.executable = true;
			this.extendedFormat = false;
			pattern.isNone = false;

			// check for B0
			this.checkRuleTreeB0(pattern.ruleTreeA, pattern.ruleTreeB, pattern.ruleTreeNeighbours, pattern.ruleTreeBase);

			// create default colours
			this.createDefaultTreeColours(pattern, pattern.ruleTreeStates);
		}

		return valid;
	};

	// decode rule table
	PatternManager.prototype.decodeRuleTable = function(/** @type {Pattern} */ pattern, /** @type {string} */ ruleText) {
		var	/** @type {boolean} */ valid = false,
			/** @type {number} */ tableIndex = -1,
			/** @type {number} */ treeIndex = -1,
			/** @type {number} */ colourIndex = -1,
			/** @type {number} */ namesIndex = -1,
			/** @type {number} */ iconIndex = -1,
			/** @type {number} */ startIndex = -1,
			/** @type {number} */ endIndex = -1,
			// tokenize string keeping newlines as tokens
			/** @type {Script} */ reader = new Script(ruleText, true);

		// check if rule table rule exists
		pattern.manager.ruleLoaderDefinition = "";
		pattern.manager.failureReason = "";
		startIndex = reader.findTokenAtLineStart(this.ruleTableRuleName, -1);
		if (startIndex !== -1) {
			// get the rule name
			if (!reader.nextIsNewline()) {
				pattern.ruleTableName = reader.getNextTokenToEndOfLine();

				// search for a tree from current position
				treeIndex = reader.findTokenAtLineStart(this.ruleTableTreeName, -1);
				if (treeIndex !== -1) {
					valid = this.decodeTree(pattern, reader);
					if (valid) {
						pattern.ruleName = pattern.ruleTableName;
					} else {
						if (pattern.manager.failureReason === "") {
							pattern.manager.failureReason = "not valid";
						}
						pattern.manager.failureReason = this.ruleTableTreeName + " " + pattern.manager.failureReason;
					}
				} else {
					// search for a table from the start since the sections could be in any order
					tableIndex = reader.findTokenAtLineStart(this.ruleTableTableName, 0);
					if (tableIndex !== -1) {
						valid = this.decodeTable(pattern, reader);
						if (valid) {
							pattern.ruleName = pattern.ruleTableName;
						} else {
							if (pattern.manager.failureReason === "") {
								pattern.manager.failureReason = "not valid";
							}
							pattern.manager.failureReason = this.ruleTableTableName +" " + pattern.manager.failureReason;
						}
					} else {
						pattern.manager.failureReason = this.ruleTableTableName + " and " + this.ruleTableTreeName + " not found";
					}
				}

				// get current end token
				endIndex = reader.current - 1;

				// if valid then search for colours from start position since sections could be in any order
				if (valid) {
					colourIndex = reader.findTokenAtLineStart(this.ruleTableColoursName, 0);
					if (colourIndex !== -1) {
						this.decodeColours(pattern, reader);

						// check if end token is later than the current end
						if (reader.current - 1 > endIndex) {
							endIndex = reader.current - 1;
						}
					}
					// search for icons from start position
					iconIndex = reader.findTokenAtLineStart(this.ruleTableIconsName, 0);
					if (iconIndex !== -1) {
						this.decodeIcons(pattern, reader);

						// check if end token is later than the current end
						if (reader.current - 1 > endIndex) {
							endIndex = reader.current - 1;
						}
					}

					// search for names from start position
					namesIndex = reader.findTokenAtLineStart(this.ruleTableNamesName, 0);
					if (namesIndex !== -1) {
						this.decodeNames(pattern, reader);

						// check if end token is later than current end
						if (reader.current -1 > endIndex) {
							endIndex = reader.current - 1;
						}
					}
				}

				// save pattern definition if valid
				if (pattern.manager.failureReason === "") {
					pattern.manager.ruleLoaderDefinition = reader.getStringSection(startIndex, endIndex);
				}
			}
		}
	};

	// add a Super postfix to the rule name in the supplied pattern
	PatternManager.prototype.addSuperPostfix = function(/** @type {Pattern} */ pattern) {
		var 	/** @type {number} */ superIndex = 0;

		// check if the pattern already contains a Super postfix
		superIndex = pattern.ruleName.toLowerCase().lastIndexOf(this.superPostfix);
		if (superIndex === -1) {
			pattern.ruleName += "Super";
		}

		if (pattern.aliasName !== "") {
			superIndex = pattern.aliasName.toLowerCase().lastIndexOf(this.superPostfix);
			if (superIndex === -1) {
				pattern.aliasName += "Super";
			}
		}
	};

	// decode embedded rule table
	/** @returns {boolean} */
	PatternManager.prototype.decodeEmbeddedRuleTable = function(/** @type {Pattern} */ pattern) {
		var	/** @type {boolean} */ result = false,
			/** @type {number} */ ruleIndex = pattern.afterTitle.indexOf(this.ruleTableRuleName),
			/** @type {number} */ nextIndex = -1,
			/** @type {string} */ ruleName = pattern.ruleName,
			/** @type {number} */ boundedPrefix = ruleName.indexOf(this.boundedGridPrefix),
			/** @type {string} */ ruleString = "";

		// keep any error message
		pattern.originalFailure = this.failureReason;

		// process and then remove any bounded grid prefix
		if (boundedPrefix !== -1) {
			this.decodeBoundedGrid(pattern, ruleName.substring(boundedPrefix + 1));
			ruleName = ruleName.substring(0, boundedPrefix);
		}

		// check if there is a rule definition in the comments
		while (ruleIndex !== -1 && !result) {
			// check if there is another @RULE definition after this one
			nextIndex = pattern.afterTitle.indexOf(this.ruleTableRuleName, ruleIndex + 1);

			// isolate the current definition
			if (nextIndex === -1) {
				ruleString = pattern.afterTitle.substring(ruleIndex);
			} else {
				ruleString = pattern.afterTitle.substring(ruleIndex, nextIndex);
			}

			// attempt to decode the embedded rule table
			this.decodeRuleTable(pattern, ruleString);

			// check if it decoded and the name matches
			if ((pattern.ruleTreeStates !== -1 || pattern.ruleTableOutput !== null) && ruleName === pattern.ruleTableName) {
				result = true;
			} else {
				// rule table was invalid or the wrong rule name so check if there is another definition
				ruleIndex = nextIndex;

				// clear the current decoding since it is the wrong rule
				pattern.ruleTreeStates = -1;
				pattern.ruleTableOutput = null;
			}
		}

		return result;
	};

	// add a pattern to the list
	/** @returns {Pattern} */
	PatternManager.prototype.create = function(/** @type {string} */ name, /** @type {string} */ source, /** @type {Allocator} */ allocator, /** @type {null|function(Pattern,Array,View):void} */ succeedCallback, /** @type {null|function(Pattern,Array,View):void} */ failCallback, /** @type {Array} */ args, /** @type {View} */ view) {
		// create a pattern skeleton
		var	/** @type {Pattern} */ newPattern = new Pattern(name, this),
			/** @type {number} */ states = 0,
			/** @type {number} */ index = 0;

		// clear loading flag
		this.loadingFromRepository = false;

		// clear rule table B0 flag
		this.ruleTableB0 = false;

		// flag that no illegal states have been found
		this.illegalState = false;

		// flag that last pattern was not too big
		this.tooBig = false;

		// flag not in extended format
		this.extendedFormat = false;

		// flag not executable
		this.executable = false;

		// clear failure reason
		this.failureReason = "";

		// clear index
		this.index = 0;

		// clear extended RLE values
		this.genDefined = false;
		this.generation = 0;
		this.posDefined = false;
		this.posX = 0;
		this.posY = 0;

		// clear specified width and height
		this.specifiedWidth = -999999;
		this.specifiedHeight = -999999;

		// flag that no alternate rule specified
		this.altSpecified = false;

		// check for cells format
		if (source.substring(0, Cells.magic1.length) === Cells.magic1 || source.substring(0, Cells.magic2.length) === Cells.magic2 || source.substring(0, Cells.magic3.length) === Cells.magic3 || source.substring(0, Cells.magic4.length) === Cells.magic4 || source.substring(0, Cells.magic5.length) === Cells.magic5) {
			// decode Cells format
			this.decodeCells(newPattern, source, allocator);
			this.executable = true;
		}

		// check if decoded
		if (newPattern.lifeMap === null) {
			this.executable = false;

			// check for Life 1.05 format
			if (source.substring(0, Life105.magic.length) === Life105.magic) {
				// decode Life 1.05 format
				this.decode105(newPattern, source, true, allocator);
			} else {
				// check for Life 1.06 format
				if (source.substring(0, Life106.magic.length) === Life106.magic) {
					// decode Life 1.06 format
					this.decode106(newPattern, source, allocator);
					this.executable = true;
				} else {
					// assume RLE format
					if (source[0] === "#" || source[0] === "x") {
						this.decodeRLE(newPattern, source, allocator);

						// check if it decoded
						if (newPattern.lifeMap === null && !newPattern.tooBig && !newPattern.invalid) {
							// attempt Life 1.05 format with no header
							this.decode105(newPattern, source, false, allocator);
							this.extendedFormat = false;
							newPattern.multiStateMap = null;
							newPattern.isHistory = false;
							newPattern.isSuper = false;
							newPattern.isExtended = false;
							newPattern.numStates = 2;
							newPattern.numUsedStates = 0;
						}
					} else {
						// assume RLE no header
						this.decodeRLE(newPattern, source, allocator);
						if (newPattern.invalid) {
							newPattern = null;
						}
					}
				}
			}
		}

		// check if the new pattern was too big
		if (newPattern && newPattern.tooBig) {
			this.failureReason = "Pattern too big";
			newPattern.invalid = true;
			this.tooBig = true;
			this.executable = false;
		}

		// remove bounded grid postfix if present
		if (newPattern) {
			if (newPattern.gridType !== -1) {
				index = newPattern.ruleName.lastIndexOf(":");
				newPattern.boundedGridDef = newPattern.ruleName.substring(index);
				newPattern.ruleName = newPattern.ruleName.substring(0, index);
			} else {
				newPattern.boundedGridDef = "";
			}
		}

		// check if the HROT Gaussian range is too big
		if (newPattern && newPattern.isHROT && newPattern.neighborhoodHROT === this.gaussianHROT && newPattern.rangeHROT > this.maxRangeHROTGaussian) {
			this.failureReason = "HROT 'R' > " + this.maxRangeHROTGaussian;
			this.executable = false;
		}

		// check if the new pattern was decoded
		if (newPattern && newPattern.lifeMap === null && this.failureReason === "") {
			this.failureReason = "Invalid pattern";
			newPattern = null;
			this.executable = false;
		}

		// check if the RLE was valid
		if (newPattern && newPattern.invalid && !newPattern.tooBig) {
			this.executable = false;
		}

		// add terminating newline to comments if required
		if (newPattern) {
			// if pattern contained Niemiec states then ensure rule name contains Super postfix
			if (newPattern.isNiemiec && !(newPattern.isHistory || newPattern.isExtended)) {
				this.addSuperPostfix(newPattern);
			}

			if (newPattern.beforeTitle !== "") {
				if (newPattern.beforeTitle[newPattern.beforeTitle.length - 1] !== "\n") {
					newPattern.beforeTitle += "\n";
				}
			}
			if (newPattern.afterTitle !== "") {
				if (newPattern.afterTitle[newPattern.afterTitle.length - 1] !== "\n") {
					newPattern.afterTitle += "\n";
				}
			}

			// if triangular or hex and invalid then switch to square
			if (this.failureReason !== "" && (newPattern.isHex || newPattern.isTriangular)) {
				if (newPattern.ruleName.match(/[0-9]/) === null) {
					newPattern.isHex = false;
					newPattern.isTriangular = false;
				}
			}

			// unpack title if decoder used array for comments
			if (newPattern.title === "") {
				// join the array into a string
				newPattern.title = newPattern.titleConcat.join(" ");

				if (newPattern.afterTitleConcat.length > 0) {
					newPattern.afterTitle = newPattern.afterTitleConcat.join("\n") + "\n";
				} else {
					newPattern.afterTitle = "";
				}

				if (newPattern.beforeTitleConcat.length > 0) {
					newPattern.beforeTitle = newPattern.beforeTitleConcat.join("\n") + "\n";
				} else {
					newPattern.beforeTitle = "";
				}

				// clear the arrays
				newPattern.titleConcat = [];
				newPattern.afterTitleConcat = [];
				newPattern.beforeTitleConcat = [];
			}

			// check if a pattern was loaded
			if (this.failureReason !== "" && !this.tooBig && !this.illegalState && newPattern.ruleName !== "") {
				// check for alternating rules
				if (newPattern.ruleName.indexOf(this.altRuleSeparator) !== -1 && this.failureReason !== "Only one alternate allowed") {
					this.failureReason = "Alternating RuleLoader rules are not supported";
				} else {
					newPattern.originalFailure = this.failureReason;
					newPattern.originalRuleName = newPattern.ruleName;
					if (newPattern.gridType !== -1) {
						index = newPattern.ruleName.lastIndexOf(":");
						if (index !== -1) {
							newPattern.boundedGridDef = newPattern.ruleName.substring(index);
							newPattern.ruleName = newPattern.ruleName.substring(0, index);
						}
					} else {
						newPattern.boundedGridDef = "";
					}

					// reset pattern after failed decode
					newPattern.isMargolus = false;
					newPattern.isPCA = false;
					newPattern.isNone = false;
					newPattern.isHistory = false;
					newPattern.isSuper = false;
					newPattern.isExtended = false;
					newPattern.isNiemiec = false;
					newPattern.isHex = false;
					newPattern.isTriangular = false;
					newPattern.wolframRule = -1;
					newPattern.isVonNeumann = false;
					newPattern.isLTL = false;
					newPattern.wasHROT = newPattern.isHROT;
					newPattern.isHROT = false;

					// rule was not an alias or built-in so check if a rule table is specified in the comments
					if (!this.decodeEmbeddedRuleTable(newPattern)) {
						// no rule in comments so check rule tree cache
						RuleTreeCache.loadIfExists(newPattern);
					}

					// if the rule was found embedded or in the cache then check pattern states
					if ((newPattern.ruleTreeStates !== -1 || newPattern.ruleTableOutput !== null) && !this.wolframEmulation) {
						// check for pattern states
						if (newPattern.ruleTableOutput === null) {
							states = newPattern.ruleTreeStates;
						} else {
							states = newPattern.ruleTableStates;
						}
						newPattern.numStates = states;
						this.failureReason = "";
						this.executable = true;
						this.extendedFormat = false;
						newPattern.isNone = false;
					} else {
						// no rule found so attempt to load rule table from repository
						this.loadRuleTable(newPattern, succeedCallback, failCallback, args, view);
					}
				}
			}
		}

		// return the pattern
		return newPattern;
	};

	// get the rule table from an html page
	/** @return {string} */
	PatternManager.prototype.getRuleTable = function(/** @type {string} */ htmlPage) {
		var	/** @type {string} */ result = "",
			/** @type {number} */ i = htmlPage.indexOf(this.ruleTableRuleName),
			/** @type {number} */ k = 0;

		// attempt to locate the @RULE
		if (i === -1) {
			result = "";
		} else {
			// check if end tag was present
			k = htmlPage.indexOf(this.ruleSearchEndTag, i);
			if (k === -1) {
				// not present so just remove up to start tag
				if (i === 0) {
					result = htmlPage;
				} else {
					result = htmlPage.substring(i);
				}
			} else {
				// present so just keep start to end tag
				result = htmlPage.substring(i, k);
			}

			// convert <li> to "# " since this is what comments will have become
			result = result.replace(/<li>/g, "# ");

			// remove any html tags
			result = result.replace(/<[^<]*>/g, "");
		}

		return result;
	};

	// load event handler
	PatternManager.prototype.loadHandler = function(/** @type {PatternManager} */ me, /** @type {ProgressEvent} */ event, /** @type {XMLHttpRequest} */ xhr, /** @type {Pattern} */ pattern) {
		// rule table text
		var	/** @type {string} */ ruleText = "",
			/** @type {number} */ fetchTime = 0,
			/** @type {number} */ decodeTime = 0;

		// check if the load succeeeded
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				ruleText = me.getRuleTable(xhr.responseText);
				fetchTime = performance.now() - this.time;
				this.time = performance.now();
				if (ruleText === "") {
					pattern.manager.failureReason = this.ruleTableRuleName + " not found";
					RuleTreeCache.requestFailed(pattern);
				} else {
					// attempt to decode the rule table
					me.decodeRuleTable(pattern, ruleText);
					decodeTime = performance.now() - this.time;

					// if rule tree decoded successfully then add to cache
					if (pattern.ruleTreeStates !== -1 || pattern.ruleTableOutput !== null) {
						RuleTreeCache.add(pattern, fetchTime, decodeTime, ruleText.length, me.ruleLoaderDefinition, me.ruleTableB0);
					} else {
						RuleTreeCache.requestFailed(pattern);
					}
				}
			} else {
				// inform other requesters that this rule failed to load
				pattern.originalFailure += "\n\nRepository lookup failed with status " + xhr.status;
				RuleTreeCache.requestFailed(pattern);
			}
		}
	};

	// error event handler
	PatternManager.prototype.errorHandler = function(/** @type {PatternManager} */ me, /** @type {ProgressEvent} */ event, /** @type {Pattern} */ pattern) {
		// inform other requesters that this rule failed to load
		RuleTreeCache.requestFailed(pattern);
	};

	// load rule table from URI
	PatternManager.prototype.loadRuleTable = function(/** @type {Pattern} */ pattern, /** @type {null|function(Pattern,Array,View):void} */ succeedCallback, /** @type {null|function(Pattern,Array,View):void} */ failCallback, /** @type {Array} */ args, /** @type {View} */ view) {
		var	/** @type {PatternManager} */ me = this,
			/** @type {XMLHttpRequest} */ xhr = null,
			/** @type {string} */ ruleName = pattern.ruleName,
			/** @type {string} */ uri = "";

		// convert spaces to underscores for load
		ruleName = ruleName.replace(/ /g, "_");

		uri = "/wiki/Rule:" + ruleName;

		// start timing
		this.time = performance.now();

		// mark loading from repository
		this.loadingFromRepository = true;

		// set the allocator reference in the pattern
		if (view) {
			pattern.allocator = view.engine.allocator;
		} else {
			pattern.allocator = null;
		}

		// add this request to the list and check if there is already a request for this rule
		if (RuleTreeCache.addRequest(pattern, succeedCallback, failCallback, args, view)) {
			// nothing to do
		} else {
			// create a request
			xhr = new XMLHttpRequest();

			// check if a repository location if specified in meta settings
			if (DocConfig.repositoryLocation !== "") {
				uri = DocConfig.repositoryLocation + ruleName + DocConfig.rulePostfix;
			}

			// save rule name for use in error message
			this.ruleSearchName = ruleName;
			this.ruleSearchURI = uri;

			// register load and error events
			registerEvent(xhr, "load", function(/** @type {ProgressEvent} */ event) {me.loadHandler(me, event, xhr, pattern);}, false);
			registerEvent(xhr, "error", function(/** @type {ProgressEvent} */ event) {me.errorHandler(me, event, pattern);}, false);

			// attempt to get the requested resource
			xhr.open("GET", uri, true);
			xhr.send(null);
		}
	};
