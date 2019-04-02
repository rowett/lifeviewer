// Pattern decoder
// Supports: Cells, Life 1.05, Life 1.06, RLE pattern formats
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Uint8 Uint16 Uint8Array Uint16Array Uint32Array AliasManager LifeConstants */

	// Life 1.05 section
	/**
	 * @constructor
	 */
	function Life105Section(startX, startY, width, height, startPos, endPos) {
		this.startX = startX;
		this.startY = startY;
		this.width = width;
		this.height = height;
		this.startPos = startPos;
		this.endPos = endPos;
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
	},

	// pattern manager singleton
	PatternManager = {
		// base64 digits
		/** @const {string} */ base64Characters : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",

		// hex digits
		/** @const {string} */ hexCharacters : "0123456789abcdef",

		// number of base64 characters in 512bit (Moore) map string
		/** @const {number} */ map512Length : 86,

		// number of base64 characters in 128bit (hexagonal) map string
		/** @const {number} */ map128Length : 22,

		// number of base64 characters in 32bit (von Neumann) map string
		/** @const {number} */ map32Length : 6,

		// number of neighbours for MAP rule
		mapNeighbours : 8,

		// extended command prefix
		/** @const {string} */ extendedPrefix : "XRLE",

		// pos command
		/** @const {string} */ posCommand : "Pos",

		// gen command
		/** @const {string} */ genCommand : "Gen",

		// decode failure reason
		failureReason : "",

		// bounded grid prefix
		/** @const {string} */ boundedGridPrefix : ":",

		// valid bounded grid types
		/** @const {string} */ boundedGridTypes : "ptkcs",

		// vadlid rule characters (digits must come first)
		/** @const {string} */ validRuleLetters : "012345678ceaiknjqrytwz-",

		// decimal digits
		/** @const {string} */ decimalDigits : "0123456789",

		// valid triangular rule characters
		/** @const {string} */ validTriangularRuleLetters : "0123456789xyz",

		// valid hex rule characters
		/** @const {string} */ validHexRuleLetters : "0123456omp-",

		// hex digits
		/** @const {string} */ hexDigits : "0123456",

		// von neumann digits
		/** @const {string} */ vonNeumannDigits : "01234",

		// rule letters
		/** @const {Array<string>} */ ruleLetters : ["ce", "ceaikn", "ceaiknjqry", "ceaiknjqrytwz"],

		// rule hex letters
		/** @const {string} */ ruleHexLetters : "omp",

		// rule hex neighborhoods
		/** @const {Array<Array<number>>} */ ruleHexNeighbourhoods : [[[6, 36, 160, 192, 72, 10], [132, 96, 136, 66, 12, 34], [68, 40, 130]], [[38, 164, 224, 200, 74, 14], [44, 162, 196, 104, 138, 70, 100, 168, 194, 76, 42, 134], [140, 98]], [[166, 228, 232, 202, 78, 46], [172, 226, 204, 106, 142, 102], [108, 170, 198]]],

		// valid letters per digit
		/** @const {Array<string>} */ validLettersPerDigit : ["", "ce", "ceaikn", "ceaiknjqry", "ceaiknjqrytwz", "ceaiknjqry", "ceaikn", "ce", ""],

		// valid hex letters per digit
		/** @const {Array<string>} */ validHexLettersPerDigit : ["", "", "omp", "omp", "omp", "", ""],

		// maximum number of letters for each neighbour count
		/** @const {Array<number>} */ maxLetters : [0, 2, 6, 10, 13, 10, 6, 2, 0],

		// order of letters for canonical format
		/** @const {Array<Array<number>>} */ orderLetters: [[0], [0, 1], [2, 0, 1, 3, 4, 5], [2, 0, 1, 3, 6, 4, 5, 7, 8, 9] , [2, 0, 1, 3, 6, 4, 5, 7, 8, 10, 11, 9, 12], [2, 0, 1, 3, 6, 4, 5, 7, 8, 9], [2, 0, 1, 3, 4, 5], [0, 1], [0]],

		// rule neighbourhoods
		/** @const {Array<Array<number>>} */ ruleNeighbourhoods : [[1, 2], [5, 10, 3, 40, 33, 68], [69, 42, 11, 7, 98, 13, 14, 70, 41, 97], [325, 170, 15, 45, 99, 71, 106, 102, 43, 101, 105, 78, 108]],

		// negative bit in letters bitmask
		/** @const {number} */ negativeBit : 13,

		// maximum width and height of patterns
		/** @const {number} */ maxWidth : 16384,
		/** @const {number} */ maxHeight : 16384,

		// maxmimum states
		/** @const {number} */ maxStates : 256,

		// state count
		stateCount : new Uint32Array(256),

		// 8192 bit triangular rule
		ruleTriangularArray : new Uint8Array(8192),

		// 8192 bit triangular alternate rule
		ruleAltTriangularArray : new Uint8Array(8192),

		// 512 bit rule
		ruleArray : new Uint8Array(512),

		// 512 bit alternate rule
		ruleAltArray : new Uint8Array(512),

		// swap array
		swapArray : new Uint16Array(512),

		// whether pattern is executable
		executable : false,

		// whether pattern in extended RLE format
		extendedFormat : false,

		// lower case name of [R]History postfix
		/** @const {string} */ historyPostfix : "history",

		// lower case name of triangular postfix
		/** @const {string} */ triangularPostfix : "t",

		// lower case name of Hex postfix
		/** @const {string} */ hexPostfix : "h",

		// lower case name of Von-Neumann postfix
		/** @const {string} */ vonNeumannPostfix : "v",

		// flag if last pattern was too big
		tooBig : false,

		// generation number
		generation : 0,
		genDefined : false,

		// position x and y
		posX : 0,
		posY : 0,
		posDefined : false,

		// index in string
		index : 0,

		// LTL min and max range
		/** @const {number} */ minRangeLTL : 1,
		/** @const {number} */ maxRangeLTL : 500,

		// LTL min and max states
		/** @const {number} */ minStatesLTL : 0,
		/** @const {number} */ maxStatesLTL : 255,

		// LTL min and max middle value
		/** @const {number} */ minMiddleLTL : 0,
		/** @const {number} */ maxMiddleLTL : 1,

		// LTL neighborhoods
		/** @const {number} */ mooreLTL: 0,
		/** @const {number} */ vonNeumannLTL : 1,
		/** @const {number} */ circularLTL : 2,

		// HROT min and max range
		/** @const {number} */ minRangeHROT: 1,
		/** @const {number} */ maxRangeHROT: 500,

		// HROT min and max states
		/** @const {number} */ minStatesHROT : 0,
		/** @const {number} */ maxStatesHROT : 255,

		// max state seen
		maxSurvivalHROT : 0,
		maxBirthHROT : 0,

		// HROT neighborhoods
		/** @const {number} */ mooreHROT : 0,
		/** @const {number} */ vonNeumannHROT : 1,
		/** @const {number} */ circularHROT : 2,

		// specified width and height from RLE pattern
		specifiedWidth : -1,
		specifiedHeight : -1,

		// alternate rule separator
		/** @const {string} */ altRuleSeparator : "|",
		
		// whether alternate rule specified
		altSpecified : false,

		// rule table rule section including trailing space
		/** @const {string} */ ruleTableRuleName : "@RULE ",

		// rule table tree section
		/** @const {string} */ ruleTableTreeName : "@TREE",

		// rule table table section
		/** @const {string} */ ruleTableTableName : "@TABLE",

		// tule table colours section
		/** @const {string} */ ruleTableColoursName : "@COLORS",

		// rule table icons section
		/** @const {string} */ ruleTableIconsName : "@ICONS"
	};

	// Life pattern constructor
	/**
	 * @constructor
	 */
	function Pattern(name) {
		// remove extension from name if present
		var i = name.lastIndexOf(".");
		if (i !== -1) {
			name = name.substr(0, i);
		}
		this.name = name;

		// bounded grid type found
		this.gridType = -1;

		// grid width
		this.gridWidth = -1;

		// grid height
		this.gridHeight = -1;

		// grid horizontal shift
		this.gridHorizontalShift = 0;

		// grid vertical shift
		this.gridVerticalShift = 0;

		// grid horizontal twist
		this.gridHorizontalTwist = false;

		// grid vertical twist
		this.gridVerticalTwist = false;

		// rule name
		this.ruleName = "";

		// alias name
		this.aliasName = "";

		// bounded grid definition
		this.boundedGridDef = "";

		// is history rule
		this.isHistory = false;

		// contains Niemiec extended states
		this.isNiemiec = false;

		// is hex rule
		this.isHex = false;

		// is triangular rule
		this.isTriangular = false;

		// is Wolfram rule
		this.wolframRule = -1;

		// is von neumann rule
		this.isVonNeumann = false;

		// is LTL rule
		this.isLTL = false;

		// LTL range
		this.rangeLTL = -1;

		// LTL middle included
		this.middleLTL = 1;

		// LTL Smin
		this.SminLTL = -1;

		// LTL Smax
		this.SmaxLTL = -1;

		// LTL Bmin
		this.BminLTL = -1;

		// LTL Bmax
		this.BmaxLTL = -1;

		// alternate rule LTL settings
		this.altMiddleLTL = -1;
		this.altSminLTL = -1;
		this.altSmaxLTL = -1;
		this.altBminLTL = -1;
		this.altBmaxLTL = -1;

		// LTL neightborhood (0 Moore, 1 von Neumann, 2 circular)
		this.neighborhoodLTL = -1;

		// is HROT rule
		this.isHROT = false;

		// HROT range
		this.rangeHROT = -1;

		// HROT birth array
		this.birthHROT = null;

		// HROT survival array
		this.survivalHROT = null;

		// alternate rule HROT birth and survival arrays
		this.altBirthHROT = null;
		this.altSurvivalHROT = null;

		// HROT neighborhood (0 Moore, 1 von Neumann, 2 circular)
		this.neighborhoodHROT = -1;

		// states for generations, LTL or HROT
		this.multiNumStates = -1;

		// width of grid
		this.width = 0;

		// height of grid
		this.height = 0;

		// life bitmap
		this.lifeMap = null;

		// multi-state map
		this.multiStateMap = null;

		// title
		this.title = "";

		// title before RLE
		this.beforeTitle = "";

		// title after RLE
		this.afterTitle = "";

		// pattern source format
		this.patternFormat = "";

		// number of states
		this.numStates = 2;

		// number of used states
		this.numUsedStates = 0;

		// pattern too big flag
		this.tooBig = false;

		// pattern invalid flag
		this.invalid = false;

		// pattern originator
		this.originator = "";

		// rule table name
		this.ruleTableName = "";

		// rule tree states
		this.ruleTreeNumStates = -1;

		// rule tree neighbours
		this.ruleTreeNeighbors = -1;

		// rule tree nodes
		this.ruleTreeNodes = -1;
	}

	// copy settings from one pattern to another
	Pattern.prototype.copySettingsFrom = function(source) {
		// copy settings
		this.ruleName = source.ruleName;
		this.aliasName = source.aliasName;
		this.isHex = source.isHex;
		this.isTriangular = source.isTriangular;
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
	Pattern.prototype.copyMultiSettingsFrom = function(source, allocator) {
		// copy arrays
		if (source.survivalHROT) {
			this.altSurvivalHROT = allocator.allocate(Uint8, source.survivalHROT.length, "HROT.altSurvivals");
			this.altSurvivalHROT.set(source.survivalHROT);
		}
		if (source.birthHROT) {
			this.altBirthHROT = allocator.allocate(Uint8, source.birthHROT.length, "HROT.altBirths");
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
		this.ruleName = "";
		this.aliasName = "";
		this.isHex = false;
		this.isTriangular = false;
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
	Pattern.prototype.isSameFamilyAs = function(source) {
		var states = (this.multiNumStates === -1 ? this.numStates : this.multiNumStates),
			sourceStates = (source.multiNumStates === -1 ? source.numStates : source.multiNumStates);

		// check for rule families
		if ((this.isLTL !== source.isLTL) || (this.isHROT !== source.isHROT)) {
			return "Alternate is different rule family";
		}

		// check for number of states
		if (states !== sourceStates) {
			return "Alternate has different number of states";
		}

		// check for neighborhoods
		if ((this.isHex !== source.isHex) || (this.isTriangular !== source.isTriangular) || (this.isVonNeumann !== source.isVonNeumann) || (this.wolframRule !== source.wolframRule) || (this.neighborhoodLTL !== source.neighborhoodLTL) || (this.neighborhoodHROT !== source.neighborhoodHROT)) {
			return "Alternate has different neighborhood";
		}

		// check for range
		if ((this.rangeLTL !== source.rangeLTL) || (this.rangeHROT !== source.rangeHROT)) {
			return "Alternate has different range";
		}

		// all checks passed
		return "";
	};

	// decode a Cells pattern
	PatternManager.decodeCells = function(pattern, source, allocator) {
		var i, length, chr, mode,
		    maxWidth = 0,
		    width = 0,
		    height = 0,
		    sectionStart, x, y, skipBlanks,

		    // parser modes
		    headerMode = 0,
		    readTitle = 1,
		    cellsMode = 2,

		    // whether valid
		    invalid = false;

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
			pattern.lifeMap = Array.matrix(Uint16, pattern.height, ((pattern.width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");

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

			// set Conway rule
			this.decodeRuleString(pattern, "", allocator);
		}
	};

	// decode a Life 1.06 pattern
	PatternManager.decode106 = function(pattern, source, allocator) {
		var i, length, chr, item, minX, maxX, minY, maxY, cells, n, x, y, negative, sawPosition,

		// item types
		waiting = 0,
		xPos = 1,
		yPos = 2;

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
			pattern.lifeMap = Array.matrix(Uint16, pattern.height, ((pattern.width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");
			pattern.patternFormat = "Life 1.06";

			// set Conway rule
			this.decodeRuleString(pattern, "", allocator);

			// set the cells
			for (i = 0; i < n; i += 1) {
				x = cells[i][0] - minX;
				y = cells[i][1] - minY;
				pattern.lifeMap[y][x >> 4] |= 1 << (~x & 15);
			}
		}
	};

	// decode a Life 1.05 pattern
	PatternManager.decode105 = function(pattern, source, header, allocator) {
		var i, j, chr, endX, endY, width, maxWidth, height, sectionStart, sectionEnd, x, y, xOffset, yOffset, skipBlanks,

		    // parser modes
		    headerMode = 0,
		    readTitle = 1,
		    readCommand = 2,
		    cellsMode = 3,
		    readCustomRule = 4,
		    readPosition = 5,

		    // item types
		    waiting = 0,
		    xPos = 1,
		    yPos = 2,

		    // sections
		    sections = [],
		    numSections = 0,

		    // parse the source
		    length = source.length,

		    // custom rule
		    customRule = "",
		    sawCustom = false,

		    // start in header mode
		    mode = headerMode,
		    item = waiting,
		    negative = false,
		    ended = false,
		    startX = 0,
		    startY = 0;

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
			pattern.lifeMap = Array.matrix(Uint16, pattern.height, ((pattern.width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");
			pattern.patternFormat = "Life 1.05";

			// allocate multi-state array
			pattern.multiStateMap = Array.matrix(Uint8, pattern.height, pattern.width, 0, allocator, "Pattern.multiStateMap");

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
				}
			} else {
				// default to Conway's Life
				this.decodeRuleString(pattern, "", allocator);
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
	PatternManager.setTriangularTotalistic = function(ruleTriangularArray, value, survival) {
		// mask
		var mask = 0,

		    // neighbours
		    neighbours = 0,
		    neighbourhood = 0,

		    // counters
		    i = 0,
		    j = 0;

		// compute the mask
		if (survival) {
			mask = 4;
		}

		// neighbourhood is:
		// -- e1 e1 e1 --         o1 o1 o1 o1 o1
		// e2 e2 EC e2 e2   and   o2 o2 OC o2 o2
		// e3 e3 e3 e3 e3         -- o3 o3 o3 -

		// bit order is:
		// e3 e3 e3 e3 e3 e1 e1 e1 e2 e2 EC e2 e2
		// and:
		// o1 o1 o1 o1 o1 o3 o3 o3 o2 o2 OC o2 o2
		// which keeps survival bit in the same location for odd/even

		// fill the array based on the value and birth or survival
		for (i = 0; i < 8192; i += 8) {
			for (j = 0; j < 4; j += 1) {
				neighbours = 0;
				neighbourhood = (i + j);

				while (neighbourhood > 0) {
					neighbours += (neighbourhood & 1);
					neighbourhood >>= 1;
				}
				if (value === neighbours) {
					ruleTriangularArray[i + j + mask] = 1;
				}
			}
		}
	};

	// set totalistic neighbourhood
	PatternManager.setTotalistic = function(ruleArray, value, survival, hexMask) {
		// mask
		var mask = 0,

		    // neighbours
		    neighbours = 0,
		    neighbourhood = 0,

		    // counters
		    i = 0,
		    j = 0;

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
	PatternManager.flipBits = function(x) {
		return ((x & 0x07) << 6) | ((x & 0x1c0) >> 6) | (x & 0x38);
	};

	// rotate 90
	PatternManager.rotateBits90Clockwise = function(x) {
		return ((x & 0x4) << 6) | ((x & 0x20) << 2) | ((x & 0x100) >> 2)
			| ((x & 0x2) << 4) | (x & 0x10) | ((x & 0x80) >> 4)
			| ((x & 0x1) << 2) | ((x & 0x8) >> 2) | ((x & 0x40) >> 6);
	};

	// set symmetrical neighbourhood into 512bit value
	PatternManager.setSymmetrical512 = function(ruleArray, x, b) {
		// variables
		var y = x,

		    // counters
		    i = 0;

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
	PatternManager.setHexSymmetrical = function(ruleArray, value, survival, character, normal, hexMask) {
		// default values
		var settings = [],
			i = 0,
			x = 0,
			survivalOffset = (survival ? 0x10 : 0),

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
	PatternManager.setSymmetrical = function(ruleArray, value, survival, character, normal, hexMask) {
		// default values
		var xOrbit = 0,
		    nIndex = value - 1,
		    x = 0,

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
	PatternManager.setTotalisticRuleFromString = function(ruleArray, rule, survival, mask) {
		// current character
		var current = null,

		    // length
		    length = rule.length,

		    // ASCII 0
		    asciiZero = String("0").charCodeAt(0),

		    // used bit array
		    used = 0,

		    // canonical string
		    canonical = "",

		    // counter
		    i = 0;

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
	PatternManager.bitCount = function(number) {
		var r = 0;

		while (number) {
			r += 1;
			number &= number - 1;
		}
		return r;
	};

	// add canonical hex letter representation
	PatternManager.addHexLetters = function(count, lettersArray) {
		var canonical = "",
		    bits = 0,
		    negative = 0,
		    setbits = 0,
		    maxbits = 0,
		    j = 0;

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
			if (setbits + negative > (maxbits >> 1)) {
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
	PatternManager.addLetters = function(count, lettersArray) {
		var canonical = "",
		    bits = 0,
		    negative = 0,
		    setbits = 0,
		    maxbits = 0,
		    letter = 0,
		    j = 0;

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
	PatternManager.setHexRuleFromString = function(ruleArray, rule, survival) {
		// current and next characters
		var current = null,
		    next = null,

		    // length
		    length = rule.length,

		    // whether character meaning normal or inverted
			normal = 1,

			// used to check for normal and inverted
			check = 0,

		    // ASCII 0
		    asciiZero = String("0").charCodeAt(0),

		    // letter index
		    letterIndex = 0,

		    // hex neighbourhood mask
		    mask = 254,

		    // used bit array
		    used = 0,
		    alreadyUsed = false,

		    // letters bit array
		    lettersArray = [],

		    // canonical string
		    canonical = "",

		    // counters
		    i = 0;

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
						this.failureReason = "duplicate " + current + this.validHexLettersPerDigit[current][letterIndex];
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
				this.failureReason = "missing digit prefix";
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
	PatternManager.setRuleFromString = function(ruleArray, rule, survival) {
		// current and next characters
		var current = null,
		    next = null,

		    // length
		    length = rule.length,

		    // whether character meaning normal or inverted
			normal = 1,

			// used to check for normal and inverted
			check = 0,

		    // ASCII 0
		    asciiZero = String("0").charCodeAt(0),

		    // letter index
		    letterIndex = 0,

		    // neighbourhood mask
		    mask = 511,

		    // used bit array
		    used = 0,
		    alreadyUsed = false,

		    // letters bit array
		    lettersArray = [],

		    // canonical string
		    canonical = "",

		    // counters
		    i = 0;

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
						this.failureReason = "duplicate " + current + this.validLettersPerDigit[current][letterIndex];
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
				this.failureReason = "missing digit prefix";
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
	PatternManager.createWolframMap = function(ruleArray, number) {
		var i = 0;

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

	// create a triangular map from birth and survival strings
	PatternManager.createTriangularRuleMap = function(birthPart, survivalPart, generationsStates, ruleTriangularArray) {
		var canonicalName = "",
			letters = this.validTriangularRuleLetters,
			i = 0,
			j = 0,
			birthMask = 0,
			survivalMask = 0,
			birthName = "",
			survivalName = "";

		// find out which birth letters are specified
		for (i = 0; i < birthPart.length; i += 1) {
			j = letters.indexOf(birthPart[i]);
			birthMask |= (1 << j);
		}
		// add birth letters in order to canonical rule name
		for (i = 0; i < letters.length; i += 1) {
			if ((birthMask & (1 << i)) !== 0) {
				birthName += letters[i];
				this.setTriangularTotalistic(ruleTriangularArray, i, false);
			}
		}

		// find out which survival letters are specified
		for (i = 0; i < survivalPart.length; i += 1) {
			j = letters.indexOf(survivalPart[i]);
			survivalMask |= (1 << j);
		}

		// add survival letters in order to canonical rule name
		for (i = 0; i < letters.length; i += 1) {
			if ((survivalMask & (1 << i)) !== 0) {
				survivalName += letters[i];
				this.setTriangularTotalistic(ruleTriangularArray, i, true);
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
	PatternManager.createRuleMap = function(birthPart, survivalPart, base64, isHex, isTriangular, isVonNeumann, generationsStates, ruleArray, ruleTriangularArray) {
		var i = 0,
		    j = 0,
		    c = 0,
		    k = 0,
		    m = 0,
		    mask = 0,
		    canonicalName = "",
		    birthName = "",
		    survivalName = "",
		    swapArray = this.swapArray,
		    power2 = 1 << (this.mapNeighbours + 1),
		    fullchars = (power2 / 6) | 0,
		    tempArray = new Uint8Array(512);

		// check for triangular rules
		if (isTriangular) {
			// clear the rule array
			for (i = 0; i < 8192; i += 1) {
				ruleTriangularArray[i] = 0;
			}
			canonicalName = this.createTriangularRuleMap(birthPart, survivalPart, generationsStates, ruleTriangularArray);
		} else {
			// create the masks
			mask = 511;
			if (isHex) {
				mask = 254;
			} else {
				if (isVonNeumann) {
					mask = 186;
				}
			}
	
			// clear the rule array
			for (i = 0; i < 512; i += 1) {
				tempArray[i] = 0;
				ruleArray[i] = 0;
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
					c = PatternManager.base64Characters.indexOf(base64[i]);
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
				c = PatternManager.base64Characters.indexOf(base64[i]);
				tempArray[j] = c >> 5;
				j += 1;
				tempArray[j] = (c >> 4) & 1;
				canonicalName += PatternManager.base64Characters[c & ((1 << 5) | (1 << 4))];
	
				// copy into array using the neighbourhood mask
				for (i = 0; i < 512; i += 1) {
					k = 0;
					m = PatternManager.mapNeighbours;
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
						birthName = this.setHexRuleFromString(ruleArray, birthPart, false);
	
						// set the hex survival rule
						survivalName = this.setHexRuleFromString(ruleArray, survivalPart, true);
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

		// return the canonical name
		return canonicalName;
	};

	// create n-neighbour counts
	PatternManager.minusN = function(rule, neighbours) {
		var i = 0,

		    // digit to test
		    digit = "",

		    // result
		    result = "";

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
	PatternManager.invertCounts = function(rule) {
		var i = 0,

		    // digit to test
		    digit = "",

		    // result
		    result = "";

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
	PatternManager.removeWhiteSpace = function(string) {
		// result
		var result = string,

		    // counter
		    i = 0;

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

	// decode Wolfram rule
	PatternManager.decodeWolfram = function(pattern, rule) {
		var valid = true,

		    // rule number
		    number = 0,

		    // digit value
		    digit = 0,

		    // counter
		    i = 1;

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
			if (number < 0 || number > 254) {
				this.failureReason = "Wolfram rule number must be 0-254";
				valid = false;
			} else {
				if ((number & 1) !== 0) {
					this.failureReason = "Wolfram rule number must be even";
					valid = false;
				} else {
					// build the map
					this.createWolframMap(this.ruleArray, number);
					pattern.wolframRule = number;

					// save the canonical name
					pattern.ruleName = "W" + number;
				}
			}
		}

		return valid;
	};

	// add postfixes to canonical rule name
	PatternManager.addNamePostfixes = function(pattern, base64) {
		var aliasName = null;

		// add the neighbourhood
		if (base64 === "") {
			if (pattern.isHex) {
				pattern.ruleName += "H";
			} else {
				if (pattern.isVonNeumann) {
					pattern.ruleName += "V";
				} else {
					if (pattern.isTriangular) {
						pattern.ruleName += "T";
					}
				}
			}

			// see if there is an alias name for this rule
			aliasName = AliasManager.getAliasFromRule(pattern.ruleName);

			// check for History
			if (pattern.isHistory) {
				pattern.ruleName += "History";
			}
		}

		// check for bounded grid
		if (pattern.gridType !== -1) {
			// add grid type
			pattern.ruleName += ":" + PatternManager.boundedGridTypes[pattern.gridType].toUpperCase();

			// add width
			pattern.ruleName += pattern.gridWidth;

			// check for horizontal shift
			if (pattern.gridHorizontalShift) {
				pattern.ruleName += "+" + pattern.gridHorizontalShift;
			}
			
			// check for horizontal twist
			if (pattern.gridHorizontalTwist) {
				pattern.ruleName += "*";
			}

			// add more if the height is not the same or vertical shift or twist are defined
			if ((pattern.gridHeight !== pattern.gridWidth) || pattern.gridVerticalShift || pattern.gridVerticalTwist) {
				// add the height
				pattern.ruleName += "," + pattern.gridHeight;

				// check for horizontal shift
				if (pattern.gridVerticalShift) {
					pattern.ruleName += "+" + pattern.gridVerticalShift;
				}
				
				// check for horizontal twist
				if (pattern.gridVerticalTwist) {
					pattern.ruleName += "*";
				}
			}
		}

		// add the alias if present
		if (aliasName !== null) {
			// check for blank Conway rule
			if (aliasName === "") {
				if (pattern.isHistory) {
					aliasName = "Life";
				} else {
					aliasName = "Conway's Life";
				}
			}

			// check for [R]History
			if (pattern.isHistory) {
				aliasName += "History";
			}

			// save the alias name
			pattern.aliasName = aliasName;
		}
	};

	// validate base64 MAP string
	PatternManager.validateMap = function(base64, pattern) {
		var i = 0,
		    testLen = PatternManager.map512Length,
		    currentLen = base64.length;

		// compute the length
		if (currentLen >= testLen) {
			// Moore
			this.mapNeighbours = 8;
		} else {
			testLen = PatternManager.map128Length;
			if (currentLen >= testLen) {
				// Hex
				this.mapNeighbours = 6;
				pattern.isHex = true;
			} else {
				testLen = PatternManager.map32Length;
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
				if (PatternManager.base64Characters.indexOf(base64[i]) === -1) {
					testLen = -1;
				}
			}
		}

		return testLen;
	};

	// decode part of LTL rule
	PatternManager.decodeLTLpart = function (rule, part, lower, upper, partof) {
		var result = 0,
		    partlen = part.length,
		    rulepart = rule.substr(this.index, partlen),
		    // ASCII 0
			asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			asciiNine = String("9").charCodeAt(0),
			next,
			nextCode;

		// check if the next character is the expected part
		if (rulepart !== part) {
			// check for comma
			if (part[0] === ",") {
				if (rulepart[0] === ",") {
					rulepart = rulepart.substr(1);
				}
				part = part.substr(1);
			}
			this.failureReason = "LtL expected '" + part.toUpperCase() + "' got '" + rulepart.toUpperCase() + "'";
			this.index = -1;
		} else {
			// remove comma from part if present
			if (part[0] === ",") {
				part = part.substr(1);
			}
			this.index += partlen;
			next = rule[this.index];
			if (this.index < rule.length) {
				nextCode = next.charCodeAt(0);
			} else {
				nextCode = -1;
			}
			
			// check for N part
			if (part === "n") {
				// check for neighborhood
				if (next === "m" || next === "n" || next === "c") {
					this.index += 1;
					result = this.mooreLTL;
					if (next === "n") {
						result = this.vonNeumannLTL;
					} else {
						if (next === "c") {
							result = this.circularLTL;
						}
					}
				} else {
					this.failureReason = "LtL expected 'NM', 'NN' or 'NC' got 'N" + next.toUpperCase() + "'";
					this.index = -1;
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

	// decode LTL rule in Rr,Cc,Mm,Ssmin..smax,Bbmin..bmax,Nn format
	PatternManager.decodeLTLMC = function(pattern, rule) {
		var value = 0,
		    result = false,
			maxCells = 0,
			i = 0,
			count = 0,
			width = 0,
			r2 = 0;

		// reset string index
		this.index = 0;

		// decode R part
		value = this.decodeLTLpart(rule, "r", this.minRangeLTL, this.maxRangeLTL, "");
		if (this.index !== -1) {
			pattern.rangeLTL = value;
			
			// decode C part
			value = this.decodeLTLpart(rule, ",c", this.minStatesLTL, this.maxStatesLTL, "");
			if (this.index !== -1) {
				// ensure number of states is at least 2
				if (value < 2) {
					value = 2;
				}
				pattern.multiNumStates = value;

				// decode M part
				value = this.decodeLTLpart(rule, ",m", this.minMiddleLTL, this.maxMiddleLTL, "");
				if (this.index !== -1) {
					pattern.middleLTL = value;

					// decode S first part
					value = this.decodeLTLpart(rule, ",s", 0, -1, "");
					if (this.index !== -1) {
						pattern.SminLTL = value;

						// decode second S part
						value = this.decodeLTLpart(rule, "..", pattern.SminLTL, -1, "S");
						if (this.index !== -1) {
							pattern.SmaxLTL = value;

							// decode first B part
							value = this.decodeLTLpart(rule, ",b", 0, -1, "");
							if (this.index !== -1) {
								pattern.BminLTL = value;

								// decode second B part
								value = this.decodeLTLpart(rule, "..", pattern.BminLTL, -1, "B");
								if (this.index !== -1) {
									pattern.BmaxLTL = value;

									// decode N part
									value = this.decodeLTLpart(rule, ",n", -1, -1, "");
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
				switch(pattern.neighborhoodLTL) {
					case PatternManager.mooreLTL:
						maxCells = (pattern.rangeLTL * 2 + 1) * (pattern.rangeLTL * 2 + 1);
						break;

					case PatternManager.vonNeumannLTL:
						maxCells = 2 * pattern.rangeLTL * (pattern.rangeLTL + 1) + 1;
						break;

					case PatternManager.circularLTL:
						count = 0;
						r2 = pattern.rangeLTL * pattern.rangeLTL + pattern.rangeLTL;
						for (i = -pattern.rangeLTL; i <= pattern.rangeLTL; i += 1) {
							width = 0;
							while ((width + 1) * (width + 1) + (i * i) <= r2) {
								width += 1;
							}
							count += 2 * width + 1;
						}
						maxCells = count;
						break;
				}
				// adjust max cells by middle cell setting
				maxCells -= (1 - pattern.middleLTL);
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
	PatternManager.decodeLTLnum = function(pattern, rule) {
		var value = 0,
		    result = false,
		    maxCells = 0;

		// reset string index
		this.index = 0;

		// set unspecified defaults: 2 states, whether middle is included (yes) and neighborhood (Moore)
		pattern.multiNumStates = 2;
		pattern.middleLTL = 1;
		pattern.neighborhoodLTL = PatternManager.mooreLTL;

		// decode R part
		value = this.decodeLTLpart(rule, "", this.minRangeLTL, this.maxRangeLTL, "");
		if (this.index !== -1) {
			pattern.rangeLTL = value;
			
			// decode first B part
			value = this.decodeLTLpart(rule, ",", 0, -1, "");
			if (this.index !== -1) {
				pattern.BminLTL = value;

				// decode second B part
				value = this.decodeLTLpart(rule, ",", pattern.BminLTL, -1, "B");
				if (this.index !== -1) {
					pattern.BmaxLTL = value;

					// decode S first part
					value = this.decodeLTLpart(rule, ",", 0, -1, "");
					if (this.index !== -1) {
						pattern.SminLTL = value;

						// decode second S part
						value = this.decodeLTLpart(rule, ",", pattern.SminLTL, -1, "S");
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
				// check Smax and Bmax based on range and neighborhood
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
	PatternManager.decodeLTLRBTST = function(pattern, rule) {
		var value = 0,
		    result = false,
		    maxCells = 0;

		// reset string index
		this.index = 0;

		// set number of states to the default unless set by generations prefix
		if (pattern.multiNumStates === -1) {
			pattern.multiNumStates = 2;
		}

		// set unspecified defaults: whether middle is included (yes) and neighborhood (Moore)
		pattern.middleLTL = 1;
		pattern.neighborhoodLTL = PatternManager.mooreLTL;

		// decode R part
		value = this.decodeLTLpart(rule, "r", this.minRangeLTL, this.maxRangeLTL, "");
		if (this.index !== -1) {
			pattern.rangeLTL = value;
			
			// decode first B part
			value = this.decodeLTLpart(rule, "b", 0, -1, "");
			if (this.index !== -1) {
				pattern.BminLTL = value;

				// decode second B part
				value = this.decodeLTLpart(rule, "t", pattern.BminLTL, -1, "B");
				if (this.index !== -1) {
					pattern.BmaxLTL = value;

					// decode S first part
					value = this.decodeLTLpart(rule, "s", 0, -1, "");
					if (this.index !== -1) {
						pattern.SminLTL = value;

						// decode second S part
						value = this.decodeLTLpart(rule, "t", pattern.SminLTL, -1, "S");
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
				// check Smax and Bmax based on range and neighborhood
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
	PatternManager.readHexDigits = function(rule, which, numDigits, pattern, allocator) {
		var result = false,
			hexValue = 0,
			list = null,
			allocName = "HROT.",
			i = 0, j = 0,
			extra = 0;

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
				list = allocator.allocate(Uint8, (numDigits << 2) + 1 + extra, allocName);

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
				} else{
					pattern.survivalHROT = list;
				}
				result = true;
			}
		}

		return result;
	};

	// decode HROT number (returns -1 if number is invalid)
	PatternManager.decodeHROTNumber = function(rule, partName) {
		var value = -1,
			// ASCII 0
			asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			asciiNine = String("9").charCodeAt(0),
			nextCode = 0;

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

	// decode HROT range
	PatternManager.decodeHROTRange = function(rule, list, partName, maxCount) {
		var result = true,
			lower = -1,
			upper = -1,
			i = 0;

		lower = this.decodeHROTNumber(rule, partName);
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
						lower += 1;
						upper += 1;
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

	// create HROT arrays from Bmin to Bmax and Smin to Smax
	PatternManager.setupHROTfromLTL = function(pattern, allocator) {
		var range = pattern.rangeLTL,
			maxCount = (range * 2 + 1) * (range * 2 + 1),
			i = 0;
			
		// copy the range and neighborhood
		pattern.rangeHROT = range;
		pattern.neighborhoodHROT = pattern.neighborhoodLTL;

		// allocate the survival and birth arrays
		pattern.survivalHROT = allocator.allocate(Uint8, maxCount + 1, "HROT.survivals");
		pattern.birthHROT = allocator.allocate(Uint8, maxCount, "HROT.births");

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
			pattern.altSurvivalHROT = allocator.allocate(Uint8, maxCount + 1, "HROT.altSurvivals");
			pattern.altBirthHROT = allocator.allocate(Uint8, maxCount, "HROT.altBirths");

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

	// decode HROT rule in Rr,Cc,S,B(,Nn) format
	PatternManager.decodeHROTMulti = function(pattern, rule, allocator) {
		var value = 0,
			result = false,
			count = 0,
			width = 0,
			r2 = 0,
			i = 0,
			maxCount = 0;

			// reset string index
			this.index = 0;

		// reset maximum S and B seen
		this.maxBirthHROT = 0;
		this.maxSurvivalHROT = 0;

		// decode R part
		if (rule[this.index] !== "r") {
			this.failureReason = "HROT expected 'R' got '" + rule[this.index].topUpperCase() + "'";
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
						// compute maximum count value for Moore neighbourhood
						maxCount = (value * 2 + 1) * (value * 2 + 1);
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
							pattern.survivalHROT = allocator.allocate(Uint8, maxCount + 2, "HROT.survivals");
							result = this.decodeHROTRange(rule, pattern.survivalHROT, "S", maxCount);
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
							pattern.birthHROT = allocator.allocate(Uint8, maxCount + 1, "HROT.births");
							result = this.decodeHROTRange(rule, pattern.birthHROT, "B", maxCount);
						}
					} else {
						this.failureReason = "HROT expected 'B'";
					}
				}
			} else {
				this.failureReason = "HROT expected ','";
			}
		}

		// decode optional neighborhood
		pattern.neighborhoodHROT = this.mooreHROT;
		if (result && this.index < rule.length && rule[this.index] === ",") {
			// comma found so check for neighborhood
			result = false;
			this.index += 1;
			if (this.index < rule.length) {
				if (rule[this.index] === "n") {
					// check for neighborhood
					this.index += 1;
					if (this.index < rule.length) {
						if (rule[this.index] === "m" || rule[this.index] === "n" || rule[this.index] === "c") {
							if (rule[this.index] === "n") {
								pattern.neighborhoodHROT = this.vonNeumannHROT;
							} else {
								if (rule[this.index] === "c") {
									pattern.neighborhoodHROT = this.circularHROT;
								}
							}
							// mark rule valid
							this.index += 1;
							result = true;
						} else {
							this.failureReason = "HROT expected 'NM', 'NN' or 'NC' got 'N" + rule[this.index].toUpperCase() + "'";
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
		}

		// final validation
		if (result) {
			// check neighborhood counts for the neighborhood
			switch(pattern.neighborhoodHROT) {
				case PatternManager.mooreHROT:
					maxCount = (pattern.rangeHROT * 2 + 1) * (pattern.rangeHROT * 2 + 1);
					break;

				case PatternManager.vonNeumannHROT:
					maxCount = 2 * pattern.rangeHROT * (pattern.rangeHROT + 1) + 1;
					break;

				case PatternManager.circularHROT:
					count = 0;
					r2 = pattern.rangeHROT * pattern.rangeHROT + pattern.rangeHROT;
					for (i = -pattern.rangeHROT; i <= pattern.rangeHROT; i += 1) {
						width = 0;
						while ((width + 1) * (width + 1) + (i * i) <= r2) {
							width += 1;
						}
						count += 2 * width + 1;
					}
					maxCount = count;
					break;
			}

			// adjust max count since middle cell is not included
			maxCount -= 1;

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

			// check for trailing characters
			if (result) {
				if (this.index !== rule.length) {
					result = false;
					this.failureReason = "HROT invalid characters after rule";
				} else {
					pattern.isHROT = true;
				}
			}
		}

		return result;
	};

	// decode HROT rule in r<num>b<hex>s<hex> format
	PatternManager.decodeHROTHex = function(pattern, rule, allocator) {
		var value = 0,
		    result = false,
			// ASCII 0
			asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			asciiNine = String("9").charCodeAt(0),
			nextCode = 0,
			numHexDigits = 0;

		// reset string index
		this.index = 0;

		// set number of states to the default unless set by generations prefix
		if (pattern.multiNumStates === -1) {
			pattern.multiNumStates = 2;
		}

		// decode R part
		if (rule[this.index] !== "r") {
			this.failureReason = "HROT expected 'R' got '" + rule[this.index].topUpperCase() + "'";
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
				pattern.neighborhoodHROT = PatternManager.mooreHROT;
				pattern.isHROT = true;
			}
		}

		return result;
	};

	// convert array to multi string for HROT
	PatternManager.asMulti = function(list, offset) {
		var length = list.length,
			start = -1,
			result = "",
			i = 0;

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
	PatternManager.decodeRuleString = function(pattern, rule, allocator) {
		// check for alternate rules
		var altIndex = -1,
			firstPattern = null,
			alias = null,
			aliasName = "",
			result = false;

		// check if the rule is an alias
		alias = AliasManager.getRuleFromAlias(rule);
		if (alias !== null) {
			// save the alias name
			aliasName = rule;

			// get the rule
			rule = alias;
		}

		// check if the rule has an alternate
		altIndex = rule.indexOf(PatternManager.altRuleSeparator);

		// check if the rule has an alternate
		if (altIndex === -1) {
			// single rule so decode
			result = this.decodeRuleStringPart(pattern, rule, allocator, this.ruleArray, this.ruleTriangularArray);
		} else {
			// check there is only one separator
			if (rule.substr(altIndex + 1).indexOf(PatternManager.altRuleSeparator) === -1) {
				// decode first rule
				result = this.decodeRuleStringPart(pattern, rule.substr(0, altIndex), allocator, this.ruleAltArray, this.ruleAltTriangularArray);
				if (result) {
					// save the first pattern details
					firstPattern = new Pattern(pattern.name);
					firstPattern.copySettingsFrom(pattern);

					// if succeeded then decode alternate rule
					pattern.resetSettings();
					result = this.decodeRuleStringPart(pattern, rule.substr(altIndex + 1), allocator, this.ruleArray, this.ruleTriangularArray);
					if (result) {
						// check the two rules are from the same family
						this.failureReason = pattern.isSameFamilyAs(firstPattern);
						if (this.failureReason === "") {
							// check for B0 in either rule
							if ((!pattern.isTriangular && (this.ruleArray[0] || this.ruleAltArray[0])) || (pattern.isTriangular && (this.ruleTriangularArray[0] || this.ruleAltTriangularArray[0]))) {
								this.failureReason = "Alternate not supported with B0";
								result = false;
							} else {
								// add the alternate alias names if at least one is set or the whole rule was an alias
								if (aliasName !== "") {
									pattern.aliasName = aliasName;
								} else {
									if (pattern.aliasName !== "" || firstPattern.aliasName !== "") {
										if (pattern.aliasName === "") {
											pattern.aliasName = pattern.ruleName;
										}
										if (firstPattern.aliasName === "") {
											firstPattern.aliasName = firstPattern.ruleName;
										}
										pattern.aliasName = firstPattern.aliasName + PatternManager.altRuleSeparator + pattern.aliasName;
									}
								}

								// add the alternate rule name
								pattern.ruleName = firstPattern.ruleName + PatternManager.altRuleSeparator + pattern.ruleName;

								// if HROT them copy arrays across
								if (pattern.isHROT || pattern.isLTL) {
									pattern.copyMultiSettingsFrom(firstPattern, allocator);
								}

								// flag that alternate rule specified
								this.altSpecified = true;
							}
						} else {
							// rules were incompatible
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

	// decode rule string and return whether valid
	PatternManager.decodeRuleStringPart = function(pattern, rule, allocator, ruleArray, ruleTriangularArray) {
		// whether the rule contains a slash
		var slashIndex = -1,

		    // whether the rule contains a B part
		    bIndex = -1,

		    // whether the rule contains an S part
		    sIndex = -1,

		    // whether the rule contains a second slash for Generations
		    generationsIndex = -1,

		    // whether rule is valid
		    valid = false,

		    // length of MAP part
		    mapLength = -1,

		    // birth part of rule
		    birthPart = null,

		    // survival part of rule
		    survivalPart = null,

		    // generations part of rule
		    generationsPart = null,

		    // alias
		    alias = null,

		    // valid rule letters
		    validRuleLetters = this.validRuleLetters,

		    // valid character index
		    validIndex = -1,

		    // hex index
		    hexIndex = -1,

		    // hex postfix length
		    hexLength = PatternManager.hexPostfix.length,

			// triangular index
			triangularIndex = -1,

			// triangular postfix length
			triangularLength = PatternManager.triangularPostfix.length,

		    // von neumann index
		    vonNeumannIndex = -1,

		    // von neumann postfix length
		    vonNeumannLength = PatternManager.vonNeumannPostfix.length,

		    // base64 map string
			base64 = "",
			
		    // counter
		    i = 0;

		// zero the first element of the rule array so later B0 checks don't fail
		ruleArray[0] = 0;

		// check if the rule is an alias
		alias = AliasManager.getRuleFromAlias(rule);
		if (alias !== null) {
			// check for blank rule
			if (rule === "") {
				pattern.ruleName = "Conway's Life";
			}
			rule = alias;
		}

		// check for MAP
		if (rule.substr(0, 3).toLowerCase() === "map") {
			// decode MAP
			base64 = rule.substr(3);

			// check for base64 padding
			validIndex = base64.indexOf("/");
			if (validIndex === -1) {
				// no slash version
				if (base64.substr(-2) === "==") {
					// remove padding
					base64 = base64.substr(0, base64.length - 2);
				}
			} else {
				// slash version
				if (base64.substr(validIndex - 2, 2) === "==") {
					// remove padding
					base64 = base64.substr(0, validIndex - 2) + base64.substr(validIndex);
				}
			}
			mapLength = this.validateMap(base64, pattern);

			if (mapLength >= 0) {
				valid = true;

				// check for a trailer
				generationsPart = base64.substr(mapLength);
				base64 = base64.substr(0, mapLength);

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
						this.failureReason = "MAP length must be " + PatternManager.map32Length + ", " + PatternManager.map128Length + " or " + PatternManager.map512Length + " not " + (i + mapLength);
						valid = false;
					}
				}
			} else {
				// illegal map
				if (base64.length === PatternManager.map512Length || base64.length === PatternManager.map128Length || base64.length === PatternManager.map32Length) {
					this.failureReason = "MAP contains illegal base64 character";
				} else {
					this.failureReason = "MAP length must be " + PatternManager.map32Length + ", " + PatternManager.map128Length + " or " + PatternManager.map512Length + " not " + base64.length;
				}
			}
		} else {
			// convert to lower case
			rule = rule.toLowerCase();

			// remove whitespace
			rule = this.removeWhiteSpace(rule);

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
						rule = rule.substr(i);
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
								rule = rule.substr(0, rule.lastIndexOf("g"));
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
							// check for Goucher format LTL
							if (rule.indexOf("t") !== -1) {
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
							// HROT
							pattern.ruleName = "R" + pattern.rangeHROT + ",";
							pattern.ruleName += "C" + pattern.multiNumStates + ",";
							pattern.ruleName += "S" + this.asMulti(pattern.survivalHROT, -1) + ",";
							pattern.ruleName += "B" + this.asMulti(pattern.birthHROT, 0);
							if (pattern.neighborhoodHROT !== this.mooreHROT) {
								pattern.ruleName += ",N";
								if (pattern.neighborhoodHROT === this.vonNeumannHROT) {
									pattern.ruleName += "N";
								} else {
									pattern.ruleName += "C";
								}
							}
						} else {
							// LTL
							pattern.isLTL = true;
							pattern.ruleName = "R" + pattern.rangeLTL + ",C" + pattern.multiNumStates + ",M" + pattern.middleLTL + ",S" + pattern.SminLTL + ".." + pattern.SmaxLTL + ",B" + pattern.BminLTL + ".." + pattern.BmaxLTL + ",N";
							if (pattern.neighborhoodLTL === this.mooreLTL) {
								pattern.ruleName += "M";
							} else if (pattern.neighborhoodLTL === this.vonNeumannLTL) {
								pattern.ruleName += "N";
							} else {
								pattern.ruleName += "C";
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
						valid = this.decodeWolfram(pattern, rule);
					} else {
						// check for triangular rules
						triangularIndex = rule.lastIndexOf(PatternManager.triangularPostfix);
						if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularLength)) {
							// rule is a triangular type
							pattern.isTriangular = true;

							// remove the postfix
							rule = rule.substr(0, rule.length - triangularLength);

							// update the valid rule letters to triangular letters
							validRuleLetters = this.validTriangularRuleLetters;
						}

						// check for Hex rules
						hexIndex = rule.lastIndexOf(PatternManager.hexPostfix);
						if ((hexIndex !== -1) && (hexIndex === rule.length - hexLength)) {
							// rule is a hex type
							pattern.isHex = true;

							// remove the postfix
							rule = rule.substr(0, rule.length - hexLength);

							// update the valid rule letters to hex digits
							validRuleLetters = this.validHexRuleLetters;
						}

						// check for Von Neumann rules
						vonNeumannIndex = rule.lastIndexOf(PatternManager.vonNeumannPostfix);
						if ((vonNeumannIndex !== -1) && (vonNeumannIndex === rule.length - vonNeumannLength)) {
							// rule is a vonNeumann type
							pattern.isVonNeumann = true;

							// remove the postfix
							rule = rule.substr(0, rule.length - vonNeumannLength);

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
								rule = rule.substr(0, generationsIndex);

								// check for triangular rules
								triangularIndex = rule.lastIndexOf(PatternManager.triangularPostfix);
								if ((triangularIndex !== -1) && (triangularIndex === rule.length - triangularLength)) {
									// rule is a triangular type
									pattern.isTriangular = true;

									// remove the postfix
									rule = rule.substr(0, rule.length - triangularLength);

									// update the valid rule letters to triangular letters
									validRuleLetters = this.validTriangularRuleLetters;
								}

								// check for Hex rules
								hexIndex = rule.lastIndexOf(PatternManager.hexPostfix);
								if ((hexIndex !== -1) && (hexIndex === rule.length - hexLength)) {
									// rule is a hex type
									pattern.isHex = true;

									// remove the postfix
									rule = rule.substr(0, rule.length - hexLength);

									// update the valid rule letters to hex digits
									validRuleLetters = this.validHexRuleLetters;
								}

								// check for Von Neumann rules
								vonNeumannIndex = rule.lastIndexOf(PatternManager.vonNeumannPostfix);
								if ((vonNeumannIndex !== -1) && (vonNeumannIndex === rule.length - vonNeumannLength)) {
									// rule is a vonNeumann type
									pattern.isVonNeumann = true;

									// remove the postfix
									rule = rule.substr(0, rule.length - vonNeumannLength);

									// update the valid rule letters to vonNeumann digits
									validRuleLetters = this.vonNeumannDigits;
								}
							}
						}

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

		// if valid the create the rule
		if (valid && pattern.wolframRule === -1 && pattern.isLTL === false && pattern.isHROT === false) {
			// create the canonical name and the rule map
			pattern.ruleName = this.createRuleMap(birthPart, survivalPart, base64, pattern.isHex, pattern.isTriangular, pattern.isVonNeumann, pattern.multiNumStates, ruleArray, ruleTriangularArray);
			if (this.failureReason !== "") {
				valid = false;
			}

			// if 2 state generations then use standard engine
			if (pattern.multiNumStates === 2) {
				pattern.multiNumStates = -1;
			}
		}

		if (valid) {
			// add any postfixes
			this.addNamePostfixes(pattern, base64);
		}

		// return whether rule is valid
		return valid;
	};

	// decode an RLE string into a pattern
	PatternManager.decodeRLEString = function(pattern, string, save, allocator) {
		// index of next character
		var index = 0,

		    // index at end of string (-1 since the string will have an extra space added to it for lookahead)
		    end = string.length - 1,

		    // flag if finished
		    finished = false,

		    // flag if valid
		    valid = true,

		    // current and next character
		    current = null,
		    next = null,

		    // width of pattern
		    width = 0,

		    // position in pattern
		    x = 0,
		    y = 0,

		    // state number for cell (or -1 if not a cell)
		    stateNum = -1,

		    // run counter
		    runCount = 0,

		    // mapping from ASCII to state number
		    codeA = String("A").charCodeAt(0) - 1,
		    codep = String("p").charCodeAt(0) - 1,

		    // state counts
			stateCount = this.stateCount;
			
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
				// state 7 cell
				stateNum = 7;
				pattern.isHistory = true;
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
								pattern.isHistory = true;
								pattern.isNiemiec = true;
								stateNum = 3;
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
								pattern.isHistory = true;
								pattern.isNiemiec = true;
								stateNum = 5;
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

						// update 2d map if normal, LifeHistory odd states, Generations state 1
						if ((!pattern.isHistory && pattern.multiNumStates === -1) || (pattern.isHistory && (stateNum & 1)) || (pattern.multiNumStates !== -1 && stateNum === 1)) {
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
				if (current === " " || current === "\t" || current === "\n") {
					// all ok
					valid = true;
				} else {
					// invalid character found so mark pattern as invalid and stop
					this.failureReason = "Illegal character in pattern: " + current;
					pattern.invalid = true;
					finished = true;
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
			if (width > PatternManager.maxWidth || y > PatternManager.maxHeight) {
				// flag pattern too large
				pattern.tooBig = true;
				pattern.invalid = true;
			} else {
				// allocate 2d cell array
				pattern.lifeMap = Array.matrix(Uint16, y, ((width - 1) >> 4) + 1, 0, allocator, "Pattern.lifeMap");

				// allocate multi-state array
				pattern.multiStateMap = Array.matrix(Uint8, y, width, 0, allocator, "Pattern.multiStateMap");

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
	PatternManager.setOriginator = function(pattern, source) {
		// end of line index
		var endIndex = source.indexOf("\n");

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// set the originator
		pattern.originator = source.substring(0, endIndex).trim();
	};

	// skip whitespace
	PatternManager.skipWhitespace = function(source, index, endIndex) {
		// index of next non-whitespace character
		var result = index,

		    // terminator
		    found = false,

		    // counter
		    i = index;

		while (i < endIndex && !found) {
			if (source[i] === " ") {
				i += 1;
			}
			else {
				found = true;
			}
		}

		// return index of next non-whitespace character
		result = i;
		return result;
	};

	// read Generation
	PatternManager.readGeneration = function(source) {
		// find the end of line
		var newLine = source.indexOf("\n"),

		    // generation number
		    generation = 0,

		    // digit value
		    digit = 0,

		    // whether character found
		    found = false,

		    // counter
		    i = 0;

		// check if there was a new line
		if (newLine === -1) {
			newLine = source.length;
		}

		// check for the equals
		while (i < newLine && !found) {
			if (source[i] === "=") {
				found = true;
			}
			else {
				// skip whitespace
				if (source[i] !== " ") {
					found = true;
				}
				else {
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

			// check each digit
			found = false;
			while (i < newLine && !found) {
				// read the digit
				digit = PatternManager.decimalDigits.indexOf(source[i]);

				// check if the digit was a number
				if (digit !== -1) {
					generation = (generation * 10) + digit;
					i += 1;
				}
				else {
					found = true;
				}
			}

			// save the generation
			this.genDefined = true;
			this.generation = generation;
		}
	};

	// read Position
	PatternManager.readPosition = function(source, needEquals) {
		// find the end of line
		var newLine = source.indexOf("\n"),

		    // x and y position
		    posX = 0,
		    posY = 0,

		    // whether x and y are negative
		    negX = false,
		    negY = false,

		    // digit value
		    digit = 0,

		    // whether character found
		    found = false,

		    // counter
		    i = 0;

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
					digit = PatternManager.decimalDigits.indexOf(source[i]);

					// check if the digit was a number
					if (digit !== -1) {
						posX = (posX * 10) + digit;
						i += 1;
					}
					else {
						found = true;
					}
				}

				// mark position found
				this.posDefined = true;

				// save the x position 
				if (negX) {
					this.posX = -posX;
				}
				else {
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
								digit = PatternManager.decimalDigits.indexOf(source[i]);

								// check if the digit was a number
								if (digit !== -1) {
									posY = (posY * 10) + digit;
									i += 1;
								}
								else {
									found = true;
								}
							}

							// save the y position
							if (negY) {
								this.posY = -posY;
							}
							else {
								this.posY = posY;
							}
						}
					}
				}
			}
		}
	};

	// check for extended RLE command
	PatternManager.checkExtendedCommand = function(source) {
		// check if string starts with extended prefix
		var exists = source.indexOf(PatternManager.extendedPrefix);

		if (exists === 0) {
			// check if Pos command exists
			exists = source.indexOf(PatternManager.posCommand);
			if (exists !== -1) {
				// attempt to read the Position
				this.readPosition(source.substr(exists + PatternManager.posCommand.length), true);
			}

			// check if Gen command exists
			exists = source.indexOf(PatternManager.genCommand);
			if (exists !== -1) {
				this.readGeneration(source.substr(exists + PatternManager.genCommand.length));
			}
		}
	};

	// set the pattern name
	PatternManager.setName = function(pattern, source) {
		// end of line index
		var endIndex = source.indexOf("\n");

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// set the name
		pattern.name = source.substring(0, endIndex).trim();
	};

	// add a line from the source to the title
	PatternManager.addToTitle = function(pattern, prefix, source, afterRLE) {
		// end of line index
		var endIndex = source.indexOf("\n"),
			text = "";

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// check if first character was space
		if (source[0] === " ") {
			prefix += " ";
		}

		// get the line of text
		text += source.substring(0, endIndex).trim();

		// add to title
		pattern.title += text + " ";

		// add to raw titles
		if (afterRLE) {
			pattern.afterTitle += prefix + text + "\n";
		} else {
			pattern.beforeTitle += prefix + text + "\n";
		}

		// return the length added
		return endIndex + 1;
	};

	// read value from string
	PatternManager.readValueFromString = function(source) {
		// digit value
		var digit = 0,

		    // total value
		    value = -1;

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
	PatternManager.decodeSphere = function(pattern, source) {
		// read width
		var width = this.readValueFromString(source),

		    // set height to width
		    height = width;

		// save width and height
		pattern.gridWidth = width;
		pattern.gridHeight = height;
	};

	// decode torus and set width to -1 if invalid
	PatternManager.decodeTorus = function(pattern, source) {
		// read width
		var width = this.readValueFromString(source),

		    // height
		    height = -1,

		    // shift values
		    shiftWidth = 0,
		    shiftHeight = 0,

		    // next character
		    chr = "";

		// check if valid
		if (width !== -1) {
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
				}
				else {
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
				}
				else {
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
						}
						else {
							// set shift height
							if (chr === "-") {
								shiftHeight = -shiftHeight;
							}
						}
					}
				}
			}
			else {
				// comma missing so make height the same as width
				height = width;
			}
		}

		// if both shifts are specified make invalid
		if (shiftWidth !== 0 && shiftHeight !== 0) {
			width = -1;
		}

		// if width and height are zero then make invalid
		if (width === 0 && height === 0) {
			width = -1;
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
	PatternManager.decodeKlein = function(pattern, source) {
		// read width
		var width = this.readValueFromString(source),

		    // height
		    height = -1,

		    // shift values
		    shiftWidth = 0,
		    shiftHeight = 0,

		    // twists
		    horizontalTwist = false,
		    verticalTwist = false,

		    // next character
		    chr = "";

		// check if valid
		if (width !== -1) {
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
				shiftWidth = this.readValueFromString(source);

				// check if shift was present
				if (shiftWidth === -1) {
					// flag invalid
					width = -1;
				}
				else {
					// set shift width
					if (chr === "-") {
						shiftWidth = -shiftWidth;
					}
				}

				// next character
				this.index += 1;
				chr = source[this.index];
			}

			// check for comma
			if (chr === ",") {
				this.index += 1;

				// read height
				height = this.readValueFromString(source);
				if (height === -1) {
					width = -1;
				}
				else {
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
						}
						else {
							// set shift height
							if (chr === "-") {
								shiftHeight = -shiftHeight;
							}
						}
					}
				}
			}
			else {
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

		// if width or height are zero then make invalid
		if (width === 0 || height === 0) {
			width = -1;
		}

		// one twist must be specified
		if (!horizontalTwist && !verticalTwist) {
			verticalTwist = true;	
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
	PatternManager.decodeCrossSurface = function(pattern, source) {
		// read width
		var width = this.readValueFromString(source),

		    // height
		    height = -1;

		// check if valid
		if (width !== -1) {
			// check for comma
			if (source[this.index] === ",") {
				this.index += 1;

				// read height
				height = this.readValueFromString(source);
				if (height === -1) {
					width = -1;
				}
			}
			else {
				// comma missing so make height the same as width
				height = width;
			}
		}

		// save width and height
		pattern.gridWidth = width;
		pattern.gridHeight = height;
	};

	// decode plane and set width to -1 if invalid
	PatternManager.decodePlane = function(pattern, source) {
		// read width
		var width = this.readValueFromString(source),

		    // height
		    height = -1;

		// check if valid
		if (width !== -1) {
			// check for comma
			if (source[this.index] === ",") {
				this.index += 1;

				// read height
				height = this.readValueFromString(source);
				if (height === -1) {
					width = -1;
				}
			}
			else {
				// comma missing so make height the same as width
				height = width;
			}
		}

		// if width and height are zero then make invalid
		if (width === 0 && height === 0) {
			width = -1;
		}

		// save width and height
		pattern.gridWidth = width;
		pattern.gridHeight = height;
	};

	// decode bounded grid definition
	PatternManager.decodeBoundedGrid = function(pattern, source) {
		// whether definition is valid
		var valid = false;

		// remove whitespace from the grid
		source = this.removeWhiteSpace(source).toLowerCase();

		// check if any characters exist
		if (source !== "") {
			// check the grid type
			pattern.gridType = this.boundedGridTypes.indexOf(source[0]);
			if (pattern.gridType !== -1) {
				// next character
				this.index = 1;

				// check for twist in other type than klein-bottle
				if (pattern.gridType !== 2 && source.indexOf("*") !== -1) {
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
			}
			else {
				// clear grid type
				pattern.gridType = -1;
				this.failureReason = "Invalid bounded grid definition '" + source.toUpperCase() + "'";
			}
		}

		// return valid flag
		return valid;
	};

	// decode a single name=value
	PatternManager.decodeNameValue = function(name, index, source, length) {
		var value = 0,
			valueFound = false,
			// ASCII 0
			asciiZero = String("0").charCodeAt(0),
			// ASCII 9
			asciiNine = String("9").charCodeAt(0),
			sourceCode = 0,
			result = null,
			isMinus = false;

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
			if (source[index] === "-") {
				index += 1;
				isMinus = true;
			}
			// decode digits
			sourceCode = source[index].charCodeAt(0);
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
	PatternManager.decodeSpecifiedSize = function(source, length) {
		var result,
			index = 0;

		// check for specified width and height
		this.specifiedWidth = -1;
		this.specifiedHeight = -1;

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
	PatternManager.decodeRule = function(pattern, source, needPrefix, allocator) {
		// end of line index
		var endIndex = source.indexOf("\n"),

		    // rule index
		    ruleIndex = source.indexOf("rule"),

		    // bounded grid index
		    boundedIndex = -1,

		    // history index
		    historyIndex = -1,

		    // history postfix length
		    historyLength = PatternManager.historyPostfix.length,

		    // rule string
			ruleString = "",
			temp = "";

		// check if a newline exists
		if (endIndex === -1) {
			endIndex = source.length;
		}

		// decode any specified size
		this.decodeSpecifiedSize(source, endIndex);

		// search for rule
		if (ruleIndex === -1) {
			// no 'rule =' so check whether one was needed
			if (needPrefix) {
				// default to Conway's Life
				ruleString = "";
			}
			else {
				// get rule
				ruleString = source.substring(1, endIndex).trim();
			}
		}
		else {
			// remove 'rule ='
			ruleString = source.substring(ruleIndex + 4, endIndex).trim();
			if (ruleString[0] === "=") {
				ruleString = ruleString.substring(1).trim();
			}
		}

		// set the pattern rule name
		pattern.ruleName = ruleString;

		// check for bounded grid
		boundedIndex = ruleString.lastIndexOf(PatternManager.boundedGridPrefix);
		if (boundedIndex !== -1) {
			// decode the bounded grid definition
			if (!this.decodeBoundedGrid(pattern, ruleString.substring(boundedIndex + 1))) {
				// mark bounded index as invalid
				boundedIndex = -2;
			}
			else {
				// remove the bounded grid definition
				ruleString = ruleString.substr(0, boundedIndex).trim();
			}
		}

		// check for History rules
		historyIndex = ruleString.toLowerCase().lastIndexOf(PatternManager.historyPostfix);
		if ((historyIndex !== -1) && (historyIndex === ruleString.length - historyLength)) {
			// rule is a history type
			pattern.isHistory = true;

			// remove the postfix
			ruleString = ruleString.substr(0, ruleString.length - historyLength).trim();
		}

		// check for History when alternate rules defined
		historyIndex = ruleString.indexOf(this.altRuleSeparator);
		if (historyIndex !== -1) {
			// check for History just before separartor
			if (ruleString.toLowerCase().substr(0, historyIndex).trim().substr(-historyLength) === PatternManager.historyPostfix) {
				// rule is a history type
				pattern.isHistory = true;
			
				// remove the postfix
				temp = ruleString.substr(0, historyIndex).trim();
				ruleString = temp.substr(0, temp.length - historyLength) + ruleString.substr(historyIndex);
			}
		}

		// decode the rule
		if (boundedIndex !== -2 && this.decodeRuleString(pattern, ruleString, allocator)) {
			// mark executable
			this.executable = true;
		}
		else {
			// could not decode so mark as extended format for display
			this.extendedFormat = true;
		}

		// return the next line
		return endIndex + 1;
	};

	// reutrn a bounded grid name
	PatternManager.boundedGridName = function(gridIndex) {
		// result
		var result = "";

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

	// decode a Life RLE pattern
	PatternManager.decodeRLE = function(pattern, source, allocator) {
		// index in string
		var index = 0,

		    // end of string
		    end = source.length,

		    // current character
		    current = null,

		    // whether decoded
		    decoded = false,

		    // whether saw a rule definition
		    sawRule = false,

		    // state used flags and counts
		    stateCount = this.stateCount,
			maxStates = PatternManager.maxStates,
			
			// border for bounded grid
			border = 4,

		    // counters
		    i = 0;

		// reset the pattern
		pattern.gridType = -1;
		pattern.width = 0;
		pattern.height = 0;
		pattern.tooBig = false;
		pattern.lifeMap = null;
		pattern.multiStateMap = null;
		pattern.invalid = false;
		pattern.isHistory = false;
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
		for (i = 0; i < maxStates; i += 1) {
			stateCount[i] = 0;
		}

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
						this.checkExtendedCommand(source.substring(index));
						break;

					case "P":
					case "R":
						// check for position
						this.readPosition(source.substring(index), false);
						break;

					case "\n":
						// line is empty so step back to newline
						index -= 1;
						break;
				}

				// add to title
				if (current === "\n") {
					index += this.addToTitle(pattern, "#", source.substring(index), decoded);
				} else {
					index += this.addToTitle(pattern, "#" + current, source.substring(index), decoded);
				}
				break;

			// found size and rule definition
			case "x":
				// decode rule (size is ignored and computed from the read pattern)
				index += this.decodeRule(pattern, source.substring(index), true, allocator);
				sawRule = true;
				break;

			// newline
			case "\n":
				// ignore
				index += 1;
				break;

			// other characters should be bitmap start
			default:
				// check if already decoded
				if (decoded) {
					// add to title
					index += this.addToTitle(pattern, "", source.substring(index), true);
				} else {
					// mark decoded
					decoded = true;

					// start of bitmap so attempt to size the pattern
					if (this.decodeRLEString(pattern, source.substring(index), false, allocator) !== -1) {
						// decode the bitmap
						index += this.decodeRLEString(pattern, source.substring(index), true, allocator);
					}
				}
				break;
			}
		}

		// check whether a rule definition was seen
		if (!sawRule) {
			// default to Conway's Life
			if (this.decodeRuleString(pattern, "", allocator)) {
				// mark executable
				this.executable = true;
			}
			else {
				// could not decode so mark as extended format for display
				this.extendedFormat = true;
			}
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
				this.failureReason = "Bounded grid is too big";
				this.executable = false;
				pattern.gridType = -1;
			}
		}

		// check whether LTL bounded grid type is valid
		if (pattern.isLTL) {
			if (pattern.gridType > 1) {
				this.failureReason = "LtL only supports Plane or Torus";
				this.executable = false;
				pattern.gridType = -1;
			}
			if (pattern.isHex) {
				this.failureReason = "LtL does not support Hex grid";
				this.executable = false;
				pattern.isHex = false;
			}
			if (pattern.BminLTL === 0 && pattern.gridType === -1) {
				this.failureReason = "LtL does not support B0 unbounded";
				this.executable = false;
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

		// check whether HROT bounded grid type is valid
		if (pattern.isHROT) {
			if (pattern.gridType > 1) {
				this.failureReason = "HROT only supports Plane or Torus";
				this.executable = false;
				pattern.gridType = -1;
			}
			if (pattern.isHex) {
				this.failureReason = "HROT does not support Hex grid";
				this.executable = false;
				pattern.isHex = false;
			}
			if (pattern.birthHROT && pattern.birthHROT[0] === 1 && pattern.gridType === -1) {
				this.failureReason = "HROT does not support B0 unbounded";
				this.executable = false;
			}
			if (pattern.gridType === 0 || pattern.gridType === 1) {
				if (pattern.gridWidth === 0 || pattern.gridHeight === 0) {
					this.failureReason = "HROT bounded grid must be finite";
					this.executable = false;
					pattern.gridType = -1;
				}
			}
		}

		// check for generations and [R]History
		if (pattern.multiNumStates !== -1 && pattern.isHistory && !(pattern.isLTL || pattern.isHROT)) {
			this.failureReason = "[R]History not valid with Generations";
			pattern.isHistory = false;
			this.executable = false;
		}

		// check for generations and B0
		if (pattern.multiNumStates !== -1 && this.ruleArray[0] && !(pattern.isLTL || pattern.isHROT)) {
			this.failureReason = "Generations does not support B0";
			this.executable = false;
		}

		// check for LTL and [R]History
		if (pattern.isLTL && pattern.isHistory) {
			this.failureReason = "[R]History not valid with LtL";
			pattern.isHistory = false;
			this.executable = false;
		}

		// check for HROT and [R]History
		if (pattern.isHROT && pattern.isHistory) {
			this.failureReason = "[R]History not valid with HROT";
			pattern.isHistory = false;
			this.executable = false;
		}

		// check for illegal state numbers
		if (this.executable) {
			// check for Niemiec
			if (pattern.isNiemiec) {
				if (pattern.numStates > 8) {
					this.failureReason = "Illegal state in pattern for Niemiec";
					this.executable = false;
				}
			}
			else {
				// check for [R]History
				if (pattern.isHistory) {
					if (pattern.numStates > 7) {
						this.failureReason = "Illegal state in pattern for [R]History";
						this.executable = false;
					}
				}
				else {
					// check for Generations
					if (pattern.multiNumStates !== -1) {
						if (pattern.numStates > pattern.multiNumStates) {
							if (pattern.isLTL) {
								this.failureReason = "Illegal state in pattern for LtL";
							} else {
								if (pattern.isHROT) {
									this.failureReason = "Illegal state in pattern for HROT";
								} else {
									this.failureReason = "Illegal state in pattern for Generations";
								}
							}
							this.executable = false;
						}
					}
				}
			}
		}

		// if pattern is LtL then copy parameters to HROT engine
		if (pattern.isLTL) {
			this.setupHROTfromLTL(pattern, allocator);
		}
	};

	// decode rule table icons TBD
	PatternManager.decodeIcons = function(pattern, index) {
		var valid = false;

		return valid;
	};

	// decode rule table colours TBD
	PatternManager.decodeColours = function(pattern, index) {
		var valid = false;

		return valid;
	};

	// decode rule table table TBD
	PatternManager.decodeTable = function(pattern, index) {
		var valid = false;

		return valid;
	};

	// decode rule table tree
	PatternManager.decodeTree = function(pattern, index) {
		var string = pattern.afterTitle,
			endIndex = string.indexOf("\n", index),
			length = string.length,
			startIndex = 0,
			settingsFound = 0,
			valid = false;

		if (endIndex !== -1) {
			while (settingsFound !== 7 && endIndex < length) {
				// get the next line
				startIndex = endIndex + 1;
				endIndex = string.indexOf("\n", startIndex);
				if (endIndex === -1) {
					endIndex = length;
				}

				// ignore comment lines
				if (string[startIndex] !== "#") {
					// check for one of the settings
					if (string.substr(startIndex, 11) === "num_states=") {
						settingsFound |= 1;
					} else if (string.substr(startIndex, 14) === "num_neighbors=") {
						settingsFound |= 2;
					} else if (string.substr(startIndex, 10) === "num_nodes=") {
						settingsFound |= 4;
					}

					// check for node
					if (string[startIndex] >= "0" && string[startIndex] <= "9") {
						// check settings were specified
						if (settingsFound !== 7) {
							endIndex = length;
						} else {
							// validate node
						}
					}
				}
			}
		}

		return valid;
	};

	// decode rule table
	PatternManager.decodeRuleTable = function(pattern) {
		var ruleIndex = 0,
			tableIndex = 0,
			treeIndex = 0,
			colourIndex = 0,
			iconIndex = 0,
			endIndex = 0,
			string = pattern.afterTitle,
			length = string.length,
			valid = false;

		ruleIndex = string.indexOf(PatternManager.ruleTableRuleName);
		if (ruleIndex !== -1) {
			// get the rule name
			endIndex = string.indexOf("\n", ruleIndex);
			if (endIndex === -1) {
				endIndex = length;
			}
			pattern.ruleTableName = string.substring(ruleIndex + PatternManager.ruleTableRuleName.length, endIndex).trim();

			// search for a table or tree
			tableIndex = string.indexOf(PatternManager.ruleTableTableName, endIndex);
			treeIndex = string.indexOf(PatternManager.ruleTableTreeName, endIndex);

			// check if both were present
			if (tableIndex !== -1 && treeIndex !== -1) {
				// pick the first one
				if (tableIndex < treeIndex) {
					treeIndex = -1;
				} else {
					tableIndex = -1;
				}
			}

			// decode whichever was specified
			if (tableIndex !== -1) {
				valid = this.decodeTable(pattern, tableIndex);
			} else if (treeIndex !== -1) {
				valid = this.decodeTree(pattern, treeIndex);
			}

			// if valid then search for colours
			if (valid) {
				colourIndex = string.indexOf(PatternManager.ruleTableColoursName, endIndex);
				if (colourIndex !== -1) {
					valid = this.decodeColours(pattern, colourIndex);
				}
				// if valid then search for icons
				if (valid) {
					iconIndex = string.indexOf(PatternManager.ruleTableIconsName, endIndex);
					if (iconIndex !== -1) {
						valid = this.decodeIcons(pattern, iconIndex);
					}
				}
			}
		}
	};

	// add a pattern to the list
	PatternManager.create = function(name, source, allocator) {
		// create a pattern skeleton
		var newPattern = new Pattern(name),
			index = 0;

		// flag that last pattern was not too big
		this.tooBig = false;

		// flag not in extended format
		this.extendedFormat = false;

		// flag not executable
		this.executable = false;

		// clear failure reason
		this.failureReason = "";

		// clear extended RLE values
		this.genDefined = false;
		this.generation = 0;
		this.posDefined = false;
		this.posX = 0;
		this.posY = 0;

		// clear specified width and height
		this.specifiedWidth = -1;
		this.specifiedHeight = -1;

		// flag that no alternate rule specified
		this.altSpecified = false;

		// check for cells format
		if (source.substr(0, Cells.magic1.length) === Cells.magic1 || source.substr(0, Cells.magic2.length) === Cells.magic2 || source.substr(0, Cells.magic3.length) === Cells.magic3 || source.substr(0, Cells.magic4.length) === Cells.magic4 || source.substr(0, Cells.magic5.length) === Cells.magic5) {
			// decode Cells format
			this.decodeCells(newPattern, source, allocator);
			this.executable = true;
		}

		// check if decoded
		if (newPattern.lifeMap === null) {
			this.executable = false;

			// check for Life 1.05 format
			if (source.substr(0, Life105.magic.length) === Life105.magic) {
				// decode Life 1.05 format
				this.decode105(newPattern, source, true, allocator);
			}
			else {
				// check for Life 1.06 format
				if (source.substr(0, Life106.magic.length) === Life106.magic) {
					// decode Life 1.06 format
					this.decode106(newPattern, source, allocator);
					this.executable = true;
				}
				else {
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
							newPattern.numStates = 2;
							newPattern.numUsedStates = 0;
						}
					}
					else {
						// assume RLE no header
						this.decodeRLE(newPattern, source, allocator);
					}
				}
			}
		}

		// check if the new pattern was too big
		if (newPattern.tooBig) {
			this.failureReason = "Pattern too big (maximum " + this.maxWidth + "x" + this.maxHeight + ")";
			this.tooBig = true;
			this.executable = false;
		}

		// remove bounded grid postfix if present
		if (newPattern.gridType !== -1) {
			index = newPattern.ruleName.lastIndexOf(":");
			newPattern.boundedGridDef = newPattern.ruleName.substr(index);
			newPattern.ruleName = newPattern.ruleName.substr(0, index);
		} else {
			newPattern.boundedGridDef = "";
		}

		// check if the new pattern was decoded
		if (newPattern.lifeMap === null) {
			if (!newPattern.tooBig && this.failureReason === "") {
				this.failureReason = "Invalid pattern";
			}
			newPattern = null;
			this.executable = false;
		}

		// check if the RLE was valid
		if (newPattern && newPattern.invalid) {
			newPattern = null;
			this.executable = false;
		}

		// add terminating newline to comments if required
		if (newPattern) {
			if (newPattern.beforeTitle !== "") {
				if (newPattern.beforeTitle[newPattern.beforeTitle.length - 1] !== "\n") {
					newPattern.beforeTitle += "\n";
				}
			}
			if (newPattern.afterTitle !== "") {
				if (newPattern.afterTitle[newPattern.afterTitle.length - 1] !== "\n") {
					newPattern.afterTitle += "\n";
				}

				// check if the after comments contain a rule definition
				this.decodeRuleTable(newPattern);
			}
		}

		// return the pattern
		return newPattern;
	};

	// create the global interface
	window["PatternManager"] = PatternManager;
	window["Pattern"] = Pattern;
}
());
