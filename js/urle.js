/* eslint-disable no-proto */
// URLE pattern compression encoder and decoder
// written by Chris Rowett

// @ts-check

(function() {
	// use strict mode
	"use strict";

	// URLE constants
	var URLEConstants = {
		//  encoded row types
		/** @const @type {number} */ RowTypeStandard : 0,
		/** @const @type {number} */ RowTypePair : 1,
		/** @const @type {number} */ RowTypeDupe : 2,

		// 0-63 encoding start and end character codes
		/** @const @type {number} */ Start64 : "?".charCodeAt(0),
		/** @const @type {number} */ End64 : "~".charCodeAt(0),

		// blank run encoding start and end character codes
		/** @const @type {number} */ StartBlanks : "\"".charCodeAt(0),
		/** @const @type {number} */ EndBlanks : "/".charCodeAt(0),

		//  symbols for: blank row, copy previous row, copy previous row pair, copy specified row
		/** @const @type {string} */ BlankRow : ":",
		/** @const @type {string} */ CopyRow : ";",
		/** @const @type {string} */ CopyRowPair : "<",
		/** @const @type {string} */ CopySpecifiedRow : "=",

		//  end of pattern symbol
		/** @const @type {string} */ EndPattern : ">",

		//  new state encoding symbol
		/** @const @type {string} */ NewState : "0"
	};

	// encoder/decoder singleton
	var URLEEngine = {
		/** @type {Array<Uint8Array>} */ grid : null,
		/** @type {number} */ width : 0,
		/** @type {number} */ height : 0,
		/** @type {TextEncoder} */ textEncoder : new TextEncoder(),
		/** @type {Uint32Array} */ stateCounts : new Uint32Array(256),
		/** @type {Uint8Array} */ rightMostBit : null,
		/** @type {number} */ totalPopulation : 0,
		/** @type {number} */ oddStatePopulation : 0,
		/** @type {number} */ maxState : 0,
		/** @type {number} */ endPatternIndex : 0
	};

	// encode run of rows
	/** @return {string} */
	URLEEngine.encodeRowRun = function(/** @type {number} */ count, /** @const @type {string} */ row, /** @const @type {string} */ symbol) {
		var /** @type {string} */ result = "";

		// check if the row is blank
		if (row === URLEConstants.BlankRow) {
			// output the count if greater than 1
			if (count > 1) {
				result += count.toString();
			}

			// output the blank row symbol
			result += row;
		} else {
			// output the row
			result += row;

			// if there are duplicates then output count-1 and the duplicate row symbol
			if (count > 1) {
				if (count > 2) {
					result += (count - 1).toString();
				}
				result += symbol;
			}
		}

		return result;
	};

	// find the small dividor or dividor + 1 that divides the supplied count exactly - used for blank cell group encoding
	/** @return {number} */
	URLEEngine.dividesNorNPlus1 = function(/** @const @type {number} */ count, /** @type {number} */ dividor) {
		var /** @type {boolean} */ found = false;

		while (!found) {
			if (count % dividor === 0 || count % dividor === 1) {
				found = true;
			} else {
				dividor -= 2;
			}
		}

		return dividor;
	};

	// encode state number in base 32
	/** @return {string} */
	URLEEngine.encodeStateNumber = function(/** @const @type {number} */ state) {
		var /** @type {string} */ result = "";

		if (state >= 32) {
			result = String.fromCharCode(URLEConstants.Start64 + (state >> 5));
			state &= 31;
		}
		result += String.fromCharCode(URLEConstants.Start64 + state + 32);

		return result;
	};

	// encode run count and cells
	/** @return {string} */
	URLEEngine.encodeRun = function(/** @type {number} */ count, /** @type {number} */ cellGroup, /** @type {number} */ state) {
		var /** @type {string} */ result = "",
			/** @const @type {number} */ blankCounts = URLEConstants.EndBlanks - URLEConstants.StartBlanks + 1,
			/** @type {boolean} */ wasBlank = false,
			/** @type {number} */ dividor = 0;

		// check for larger blank cells runs
		if (count > 1 && cellGroup === 0) {
			// check for small blank runs
			wasBlank = true;
			if (count >= 2 && count < blankCounts + 2) {
				cellGroup = URLEConstants.StartBlanks + count - 2;
				count = 1;
			} else {
				// at greater counts find the largest representation that divides exactly
				dividor = URLEEngine.dividesNorNPlus1(count, blankCounts);
				cellGroup = URLEConstants.StartBlanks + dividor + (count & 1) - 2;
				count = (count / dividor) | 0;
			}
		}

		// only output the count if it is greater than 1
		if (count > 1) {
			result += count.toString();
		}

		// add the characters representing the cells
		if (state < 0 && !wasBlank) {
			result += URLEEngine.encodeStateNumber(cellGroup);
		} else {
			if (wasBlank) {
				result += String.fromCharCode(cellGroup);
			} else {
				result += String.fromCharCode(URLEConstants.Start64 + cellGroup);
			}
		}

		return result;
	};

	// get the state value of a cell on the given row
	/** @return {number} */
	URLEEngine.getCell = function(/** @type {number} */ x, /** @const @type {Uint8Array} */ gridRow) {
		return gridRow[x];
	};

	// get the state value of five 2-state cells on the given row as a 5 bit binary value
	/** @return {number} */
	URLEEngine.getFiveCells = function(/** @type {number} */ x, /** @const @type {Uint8Array} */ gridRow, /** @const @type {number} */ state) {
		var /** @type {number} */ col = 0,
			/** @type {number} */ output = 0,
			/** @type {number} */ maxX = x + 4,
			/** @type {number} */ width = URLEEngine.width, 
			/** @type {number} */ bit = 16;

		// clip to pattern extent
		if (maxX >= width) {
			maxX = width - 1;
		}

		// get up to 5 cells depending on clipping
		while (x <= maxX) {
			col = gridRow[x];
			if (col === state) {
				output |= bit;
			}
			x += 1;
			bit >>= 1;
		}

		return output;
	};

	// encode a row in URLE format
	/** @return {string} */
	URLEEngine.encodeRow = function(/** @const @type {number} */ y, /** @const @type {number} */ state) {
		var /** @type {string} */ result = "",
			/** @type {number} */ x = 0,
			/** @type {number} */ width = URLEEngine.width,
			/** @type {number} */ last = 0,
			/** @type {number} */ next = 0,
			/** @type {number} */ count = 0,
			/** @type {Uint8Array} */ gridRow = URLEEngine.grid[y];

		// get first group of cells
		if (state < 0) {
			last = URLEEngine.getCell(x, gridRow);
			x += 1;
		} else {
			last = URLEEngine.getFiveCells(x, gridRow, state);
			x += 5;
		}
		count += 1;

		// read the rest of the row
		while (x < width) {
			// get the next group of cells
			if (state < 0) {
				next = URLEEngine.getCell(x, gridRow);
				x += 1;
			} else {
				next = URLEEngine.getFiveCells(x, gridRow, state);
				x += 5;
			}

			// check if they are the same as the previous group of cells
			if (next === last) {
				// cells are the same so increment run count
				count += 1;
			} else {
				// cells are different so output previous run
				result += URLEEngine.encodeRun(count, last, state);

				// reset for new run
				count = 1;
				last = next;
			}
		}

		// check if final run is blank
		if (last === 0) {
			// run is blank
			if (result !== "") {
				if (state < 0) {
					// add end of row marker
					result += URLEConstants.BlankRow;
				} else {
					// change last encoded symbol to indicate end of row
					result = result.substr(0, result.length - 1) + String.fromCharCode(result.charCodeAt(result.length - 1) + 32);
				}
			}
		} else {
			// run is not blank
			if (state < 0) {
				// encode run and add end of row marker
				result += URLEEngine.encodeRun(count, last, state);
				result += URLEConstants.BlankRow;
			} else {
				// adjust symbol to indicate end of row
				last += 32;
				result += URLEEngine.encodeRun(count, last, state);
			}
		}

		return result;
	};

	// EncodedRow object
	/**
	 * @constructor
	 */
	function EncodedRow(/** @const @type {string} */ data, /** @const @type {number} */ row) {
		/** @type {string} */ this.data = data;
		/** @type {number} */ this.row = row;
		/** @type {number} */ this.type = URLEConstants.RowTypeStandard;
		/** @type {number} */ this.count = 1;
	}

	// sort function to compare EncodedRow records sorting by data and then by row
	/** @return {number} */
	URLEEngine.compareRows = function(/** @type {EncodedRow} */ a, /** @type {EncodedRow} */ b) {
		return a.data.localeCompare(b.data) || a.row - b.row;
	};

	// encode the pattern using the supplied state value, or using all states if the supplied state value is -1
	/** @return {string} */
	URLEEngine.encodePattern = function(/** @const @type {number} */ state) {
		var /** @type {string} */ data = "",
			/** @type {string} */ usePrevious = "",
			/** @type {number} */ y = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ rowCount = 0,
			/** @type {number} */ lastDataRow = 0,
			/** @type {EncodedRow} */ encodedRow1 = null,
			/** @type {EncodedRow} */ encodedRow2 = null,
			/** @type {Array<EncodedRow>} */ rows = [],
			/** @type {Array<EncodedRow>} */ rowDups = [],
			/** @type {boolean} */ allBlank = true,
			/** @type {number} */ lastRowPairRow = -1,
			/** @type {boolean} */ ignoreFirst = false;

		// encode each row
		for (y = 0; y < URLEEngine.height; y += 1) {
			encodedRow1 = new EncodedRow(URLEEngine.encodeRow(y, state), y);
			rows[y] = encodedRow1;

			// check if any rows are not blank
			if (encodedRow1.data !== "") {
				allBlank = false;
			} else {
				// replace blank row with the blank row symbol
				encodedRow1.data = URLEConstants.BlankRow;
			}
		}

		// if the pattern is blank return empty string
		if (allBlank) {
			return data;
		}

		// now find each pair of rows (where the two rows are different) that are followed by one or more duplicate pairs
		for (y = 0; y < URLEEngine.height - 3; y += 1) {
			encodedRow1 = rows[y];
			encodedRow2 = rows[y + 1];
			if (encodedRow1.data === rows[y + 2].data && encodedRow2.data === rows[y + 3].data && encodedRow1.data !== encodedRow2.data) {
				rowCount = 1;
				j = 2;
				do {
					j += 2;
					rowCount += 1;
				} while (y + 1 + j < URLEEngine.height && encodedRow1.data === rows[y + j].data && encodedRow2.data === rows[y + 1 + j].data);

				// set the row type as a pair on the first row
				encodedRow1.type = URLEConstants.RowTypePair;
				encodedRow1.count = rowCount;

				// skip pairs
				y += rowCount * 2 - 1;
			}
		}

		// create a duplicate of the encoded rows array and sort it by content and then row number to find groups of duplicates
		rowDups = rows.slice();
		rowDups.sort(URLEEngine.compareRows);

		// in each duplicate set make the row number of all duplicates the row number of the first one in the set
		encodedRow1 = rowDups[0];
		for (y = 1; y < URLEEngine.height; y += 1) {
			encodedRow2 = rowDups[y];

			// check for duplicates
			if (encodedRow2.data === encodedRow1.data) {
				// mark as duplicates but don't overwrite duplicate pairs
				if (rows[encodedRow1.row].type === URLEConstants.RowTypeStandard) {
					rows[encodedRow1.row].type = URLEConstants.RowTypeDupe;
				}
				if (rows[encodedRow2.row].type === URLEConstants.RowTypeStandard) {
					rows[encodedRow2.row].type = URLEConstants.RowTypeDupe;
				}
				
				// check if the copy previous row encoding is not longer than the data encoding
				usePrevious = encodedRow1.row.toString() + URLEConstants.CopySpecifiedRow;
				if (usePrevious.length <= encodedRow2.data.length) {
					encodedRow2.data = usePrevious;
				}

				// set the row to point to the first duplicate
				rows[encodedRow2.row].row = encodedRow1.row;
			} else {
				encodedRow1 = encodedRow2;
			}
		}

		// finally count sequential runs
		for (y = 0; y < URLEEngine.height - 1; y += 1) {
			encodedRow1 = rows[y];
			encodedRow2 = rows[y + 1];

			// check for duplicate runs
			if (encodedRow1.row === encodedRow2.row) {
				rowCount = 1;
				j = 1;
				do {
					j += 1;
					rowCount += 1;
				} while (y + j < URLEEngine.height && rows[y + j].row === encodedRow1.row);

				// set the count
				encodedRow1.count = rowCount;
			}
		}

		// remove any final blank rows
		lastDataRow = URLEEngine.height - 1;
		while (lastDataRow >= 0 && rows[lastDataRow].data === URLEConstants.BlankRow) {
			lastDataRow--;
		}

		// now output the rows
		ignoreFirst = false;
		lastRowPairRow = -1;
		y = 0;
		while (y <= lastDataRow) {
			// get the next row
			encodedRow1 = rows[y];
			rowCount = encodedRow1.count;

			// check the row type
			switch (encodedRow1.type) {
				case URLEConstants.RowTypeStandard:
					// standard row just output
					data += encodedRow1.data;
					y += rowCount;
					lastRowPairRow = -1;
					break;

				case URLEConstants.RowTypeDupe:
					// if the run includes the last row of a pair then include that in the count
					if (encodedRow1.row === lastRowPairRow) {
						data += URLEEngine.encodeRowRun(rowCount + 1, "", URLEConstants.CopyRow);
					} else {
						// duplicate row encode as a count of duplicate rows
						data += URLEEngine.encodeRowRun(rowCount, encodedRow1.data, URLEConstants.CopyRow);
					}
					y += rowCount;

					// if the run includes the first row of a pair the move back to the previous row but skip the row's data when encoding the pair
					if (rows[y - 1].type === URLEConstants.RowTypePair) {
						ignoreFirst = true;
						y -= 1;
					}

					lastRowPairRow = -1;
					break;

				case URLEConstants.RowTypePair:
					// duplicate row pair encode as a count of duplicate row pairs
					if (ignoreFirst) {
						data += URLEEngine.encodeRowRun(rowCount, rows[y + 1].data, URLEConstants.CopyRowPair);
						ignoreFirst = false;
					} else {
						data += URLEEngine.encodeRowRun(rowCount, encodedRow1.data + rows[y + 1].data, URLEConstants.CopyRowPair);
					}
					lastRowPairRow = y + 1;

					y += rowCount * 2;
					break;
			}
		}

		return data;
	};

	// get used states from pattern grid
	/** @return {Array<number>} */
	URLEEngine.getUsedStates = function() {
		var /** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {Array<number>} */ result = [0],   // always include state 0
			/** @type {Uint8Array} */ stateFlags = new Uint8Array(256),
			gridRow = null;
		
		// populate state present array
		for (y = 0; y < URLEEngine.height; y += 1) {
			gridRow = URLEEngine.grid[y];
			for (x = 0; x < URLEEngine.width; x += 1) {
				stateFlags[gridRow[x]] = 1;
			}
		}

		// for each state above 0 present add the state number to the list
		for (y = 1; y < 256; y += 1) {
			if (stateFlags[y]) {
				result.push(y);
			}
		}

		return result;
	};

	// encode pattern from supplied grid, width and height
	/** @return {string} */
	URLEEngine.encode = function(/** @const @type {Array<Uint8Array>} */ grid, /** @const @type {number} */ width, /** @const @type {number} */ height) {
		var /** @type {string} */ result = "",
			/** @type {number} */ i = 0,
			/** @type {string} */ altEncoding = "",
			/** @type {Array<number>} */ usedStatesList = [];

		// save the reference to the grid
		URLEEngine.grid = grid;
		URLEEngine.width = width;
		URLEEngine.height = height;

		// get the used state list
		usedStatesList = URLEEngine.getUsedStates();

		// encode each state in the pattern
		for (i = 1; i < usedStatesList.length; i += 1) {
			if (usedStatesList.length > 2 || (usedStatesList.length === 2 && usedStatesList[1] !== 1)) {
				result += URLEConstants.NewState + URLEEngine.encodeStateNumber(usedStatesList[i]);
			}
			result += URLEEngine.encodePattern(usedStatesList[i]);
		}

		// for multi-state patterns encode all states in the pattern at once and check if this is a more compact encoding
		if (usedStatesList.length > 2) {
			// output the state header indicating all states
			altEncoding = URLEConstants.NewState + URLEConstants.NewState;

			// encode pattern with all states at once
			altEncoding += URLEEngine.encodePattern(-1);

			// check if this encoding is more compact
			if (altEncoding.length < result.length) {
				result = altEncoding;
			}
		}

		// add the end of pattern symbol
		result += URLEConstants.EndPattern;

		// release the reference to the grid
		URLEEngine.grid = null;

		// return the encoded pattern
		return result;
	};

	// populate right-most bit array used for clipping 5 cell groups to the pattern width
	URLEEngine.initRightMostBits = function() {
		var /** @type {number} */ i = 0,
			/** @type {number} */ value = 0,
			/** @type {Uint8Array} */ rightMostBit = URLEEngine.rightMostBit;

		// create the array if not initialized
		if (rightMostBit === null) {
			URLEEngine.rightMostBit = new Uint8Array(32);
			rightMostBit = URLEEngine.rightMostBit;

			// populate the array
			for (i = 0; i < 32; i += 1) {
				value = 5;
				if (i & 1) {
					value = 0;
				} else {
					if (i & 2) {
						value = 1;
					} else {
						if (i & 4) {
							value = 2;
						} else {
							if (i & 8) {
								value = 3;
							} else {
								if (i & 16) {
									value = 4;
								}
							}
						}
					}
				}
				rightMostBit[i] = value;
			}
		}
	};

	// copy previous pattern row a number of times
	URLEEngine.copyPreviousRow = function(/** @type {Array<Uint8Array>} */ grid, /** @type {number} */ currentRow, /** @type {number} */ count, /** @type {number} */ width, /** @type {number} */ state) {
		var /** @type {Uint8Array} */ gridRow1 = grid[currentRow - 1],
			/** @type {Uint8Array} */ gridRow2 = null,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ value = 0;

		for (i = 0; i < count; i += 1) {
			gridRow2 = grid[currentRow + i];
			if (state === -1) {
				for (j = 0; j < width; j += 1) {
					value = gridRow1[j];
					gridRow2[j] = value;
					URLEEngine.stateCounts[value] += 1;
				}
			} else {
				for (j = 0; j < width; j += 1) {
					if (gridRow1[j] === state) {
						gridRow2[j] = state;
						URLEEngine.stateCounts[state] += 1;
					}
				}
			}
		}
	};

	// copy previous pattern row pair a number of times
	URLEEngine.copyPreviousRowPair = function(/** @type {Array<Uint8Array>} */ grid, /** @type {number} */ currentRow, /** @type {number} */ count, /** @type {number} */ width, /** @type {number} */ state) {
		var /** @type {Uint8Array} */ gridRow1 = grid[currentRow - 2],
			/** @type {Uint8Array} */ gridRow2 = grid[currentRow - 1],
			/** @type {Uint8Array} */ gridRow3 = null,
			/** @type {Uint8Array} */ gridRow4 = null,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ value = 0;

		for (i = 0; i < count; i += 1) {
			gridRow3 = grid[currentRow + i * 2];
			gridRow4 = grid[currentRow + i * 2 + 1];
			if (state === -1) {
				for (j = 0; j < width; j += 1) {
					value = gridRow1[j];
					gridRow3[j] = value;
					URLEEngine.stateCounts[value] += 1;
					value = gridRow2[j];
					gridRow4[j] = value;
					URLEEngine.stateCounts[value] += 1;
				}
			} else {
				for (j = 0; j < width; j += 1) {
					if (gridRow1[j] === state) {
						gridRow3[j] = state;
						URLEEngine.stateCounts[state] += 1;
					}
					if (gridRow2[j] === state) {
						gridRow4[j] = state;
						URLEEngine.stateCounts[state] += 1;
					}
				}
			}
		}
	};

	// copy specified pattern row once
	URLEEngine.copySpecifiedRow = function(/** @type {Array<Uint8Array>} */ grid, /** @type {number} */ currentRow, /** @type {number} */ specifiedRow, /** @type {number} */ width, /** @type {number} */ state) {
		var /** @type {Uint8Array} */ gridRow1 = grid[specifiedRow],
			/** @type {Uint8Array} */ gridRow2 = grid[currentRow],
			/** @type {number} */ i = 0,
			/** @type {number} */ value = 0;

		if (state === 1) {
			for (i = 0; i < width; i += 1) {
				value = gridRow1[i];
				gridRow2[i] = value;
				URLEEngine.stateCounts[value] += 1;
			}
		} else {
			for (i = 0; i < width; i += 1) {
				if (gridRow1[i] === state) {
					gridRow2[i] = state;
					URLEEngine.stateCounts[state] += 1;
				}
			}
		}
	};

	// compute pattern metrics
	URLEEngine.computeMetrics = function() {
		var /** @type {number} */ i = 0,
			/** @type {number} */ totalPop = 0,
			/** @type {number} */ oddStatePop = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ maxState = 0;

		// compute population counts
		for (i = 1; i < 256; i += 1) {
			count = URLEEngine.stateCounts[i];
			if (count > 0) {
				maxState = i;
				totalPop += count;
				if ((i & 1) !== 0) {
					oddStatePop += count;
				}
			}
		}

		// save metrics
		URLEEngine.stateCounts[0] = URLEEngine.width * URLEEngine.height - totalPop;
		URLEEngine.totalPopulation = totalPop;
		URLEEngine.oddStatePopulation = oddStatePop;
		URLEEngine.maxState = maxState;
	};

	// decode pattern from the given string
	// on success return "" and populate the URLEEngine singleton with the grid, width, height, population, state counts and index of end of pattern character
	// on failure return an error message and set the URLEEngine singleton grid to null
	/** @return {string} */
	URLEEngine.decode = function(/** @type {string} */ pattern, /** @const @type {number} */ maxWidth, /** @const @type {number} */ maxHeight) {
		var /** @type {number} */ count = 0,
			/** @type {number} */ nextByte = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {string} */ message = "",
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ maxX = 0,
			/** @type {number} */ maxY = 0,
			/** @type {number} */ width = 0,
			/** @type {number} */ value = 0,
			/** @type {number} */ value2 = 0,
			/** @type {number} */ pass = 0,
			/** @type {number} */ currentState = 1,
			/** @type {Array<Uint8Array>} */ grid = null,
			/** @type {Uint8Array} */ gridRow1 = null,
			/** @type {Uint8Array} */ patternBytes = null,
			/** @type {number} */ patternBytesLength = 0,
			/** @const @type {number} */ blankRowByte = URLEConstants.BlankRow.charCodeAt(0),
			/** @const @type {number} */ copyRowByte = URLEConstants.CopyRow.charCodeAt(0),
			/** @const @type {number} */ copyRowPairByte = URLEConstants.CopyRowPair.charCodeAt(0),
			/** @const @type {number} */ copySpecifiedRowByte = URLEConstants.CopySpecifiedRow.charCodeAt(0),
			/** @const @type {number} */ newStateByte = URLEConstants.NewState.charCodeAt(0),
			/** @const @type {number} */ endPatternByte = URLEConstants.EndPattern.charCodeAt(0),
			/** @const @type {number} */ zeroByte = "0".charCodeAt(0),
			/** @const @type {number} */ oneByte = "1".charCodeAt(0),
			/** @const @type {number} */ nineByte = "9".charCodeAt(0),
			/** @const @type {number} */ endIndex = pattern.indexOf(URLEConstants.EndPattern);

		// initialize and populate the right most bit array used to clip 5 cell groups to the grid width
		URLEEngine.initRightMostBits();

		// remove all whitespace from the pattern string
		pattern = pattern.replace(/[ \t\n]/g, "");

		// add two terminators for lookahead
		pattern += URLEConstants.EndPattern + URLEConstants.EndPattern;

		// convert to byte array
		patternBytes = URLEEngine.textEncoder.encode(pattern);
		patternBytesLength = patternBytes.length;

		// decode in two passes: the first pass to size the grid, the second pass to populate
		for (pass = 0; pass < 2; pass += 1) {
			// on the second pass allocate the grid
			if (pass === 1) {
				// check the max size was not exceeded
				if (maxX > maxWidth || maxY > maxHeight) {
					message = "pattern too big: pattern " + maxX + " x " + maxY + " limit " + maxWidth + " x " + maxHeight;
				} else {
					grid = [];
					for (y = 0; y < maxY; y += 1) {
						grid[y] = new Uint8Array(maxX);
					}
					width = maxX;
					x = 0;
					y = 0;

					// clear the state counts
					URLEEngine.stateCounts.fill(0);
				}
			}

			// check there is no error before decoding
			i = 0;
			if (message !== "") {
				i = patternBytesLength;
			}

			// decode the pattern
			while (i < patternBytesLength) {
				// get the next byte from the pattern
				nextByte = patternBytes[i];
				i += 1;

				// decode the byte
				switch (nextByte) {
					case newStateByte:
						// could be new state definition, specified row zero, or digit 0 for count
						if (count === 0) {
							// look at next character
							nextByte = patternBytes[i];
	
							// check for specified row
							if (nextByte !== copySpecifiedRowByte) {
								// consume character
								i += 1;

								// check for multi state mode
								if (nextByte === newStateByte) {
									currentState = -1;
								} else {
									// decode single state
									value = nextByte - URLEConstants.Start64;
									if (value < 0 || value >= 64) {
										message = "invalid state definition";
										i = patternBytesLength;
									} else {
										if (value < 32) {
											value <<= 5;
											nextByte = patternBytes[i];
											i += 1;
											value2 = nextByte - URLEConstants.Start64;
											if (value2 < 32 || value2 >= 64) {
												message = "invalid state definition";
												i = patternBytesLength;
											} else {
												value += (value2 - 32);
											}
										} else {
											value -= 32;
										}
										currentState = value;
										x = 0;
										y = 0;
									}
								}
							}
						} else {
							// count digit 0
							count *= 10;
						}
						break;
					
					case copyRowByte:
						// copy last pattern row
						if (count === 0) {
							count = 1;
						}

						// copy previous row
						if (pass > 0) {
							URLEEngine.copyPreviousRow(grid, y, count, width, currentState);
						}

						y += count;
						if (y > maxY) {
							maxY = y;
						}
						count = 0;
						x = 0;
						break;
	
					case copyRowPairByte:
						// copy last row pair
						if (count === 0) {
							count = 1;
						}

						// copy previous row pair
						if (pass > 0) {
							URLEEngine.copyPreviousRowPair(grid, y, count, width, currentState);
						}

						y += count * 2;
						if (y > maxY) {
							maxY = y;
						}
						count = 0;
						x = 0;
						break;
	
					case copySpecifiedRowByte:
						// copy specified row
						if (pass > 0) {
							URLEEngine.copySpecifiedRow(grid, y, count, width, currentState);
						}

						y += 1;
						if (y > maxY) {
							maxY = y;
						}
						count = 0;
						x = 0;
						break;
	
					case endPatternByte:
						// end of pattern
						i = patternBytesLength;
						break;
	
					case blankRowByte:
						// blank rows
						if (count === 0) {
							count = 1;
						}
						y += count;
						if (y > maxY) {
							maxY = y;
						}
						count = 0;
						x = 0;
						break;
	
					default:
						// check for digits
						if (nextByte >= oneByte && nextByte <= nineByte) {
							count *= 10;
							count += nextByte - zeroByte;
						} else {
							// check for cells
							value = nextByte;
							if ((value >= URLEConstants.Start64 && value <= URLEConstants.End64) || (value >= URLEConstants.StartBlanks && value <= URLEConstants.EndBlanks)) {
								// decode cell specification
								if (count === 0) {
									count = 1;
								}
	
								// check for multiple blanks
								if (value >= URLEConstants.StartBlanks && value <= URLEConstants.EndBlanks) {
									value -= URLEConstants.StartBlanks - 2;
									if (currentState === -1) {
										x += (count * (value &~ 1)) + (value & 1);
										if (x > maxX) {
											maxX = x;
										}
									} else {
										x += ((count * (value &~ 1)) + (value & 1)) * 5;
										if (x > maxX) {
											maxX = x;
										}
									}
								} else {
									// decode cells
									value -= URLEConstants.Start64;
									if (currentState === -1) {
										if (value < 32) {
											value <<= 5;
											nextByte = patternBytes[i];
											i += 1;
											value2 = nextByte - URLEConstants.Start64;
											if (value2 < 32 || value2 >= 64) {
												message = "invalid cell definition";
												i = patternBytesLength;
											} else {
												value += value2 - 32;
											}
										} else {
											value -= 32;
										}

										if (pass > 0) {
											gridRow1 = grid[y];
											for (j = 0; j < count; j += 1) {
												gridRow1[x + j] = value;
												URLEEngine.stateCounts[value] += 1;
											}
										}

										x += count;
										if (x > maxX) {
											maxX = x;
										}
									} else {
										if (value >= 32) {
											// cells followed by end of row
											if (pass > 0) {
												gridRow1 = grid[y];
												for (j = 0; j < count - 1; j += 1) {
													for (k = 0; k < 5; k += 1) {
														if (value & (1 << (4 - k))) {
															gridRow1[x + j * 5 + k] = currentState;
															URLEEngine.stateCounts[currentState] += 1;
														}
													}
												}
												for (k = 0; k < 5 - URLEEngine.rightMostBit[value - 32]; k += 1) {
													if (value & (1 << (4 - k))) {
														gridRow1[x + j * 5 + k] = currentState;
														URLEEngine.stateCounts[currentState] += 1;
													}
												}
											}

											x += 5 * count - URLEEngine.rightMostBit[value - 32];
											if (x > maxX) {
												maxX = x;
											}
											y += 1;
											if (y > maxY) {
												maxY = y;
											}

											// end of row so reset to beginning of row
											x = 0;
										} else {
											// cells with no end of row
											if (pass > 0) {
												gridRow1 = grid[y];
												for (j = 0; j < count; j += 1) {
													for (k = 0; k < 5; k += 1) {
														if (value & (1 << (4 - k))) {
															gridRow1[x + j * 5 + k] = currentState;
															URLEEngine.stateCounts[currentState] += 1;
														}
													}
												}
											}

											x += count * 5;
											if (x > maxX) {
												maxX = x;
											}
										}
									}
								}
	
								// reset count
								count = 0;
							} else {
								message = "invalid character";
								i = patternBytesLength;
							}
						}
						break;
				}
			}

			// exit if there was an error
			if (message !== "") {
				break;
			}
		}
	
		// check if decoder was successful
		if (message !== "") {
			// decode failed so return error message and clear grid
			message = "URLE decode failed: " + message;
			URLEEngine.grid = null;
			URLEEngine.width = maxX;
			URLEEngine.height = maxY;
		} else {
			// decode succeeded for return no error and save grid
			message = "";
			URLEEngine.grid = grid;
			URLEEngine.width = maxX;
			URLEEngine.height = maxY;
			URLEEngine.endPatternIndex = endIndex;

			// compute pattern metrics
			URLEEngine.computeMetrics();
		}
		
		// return error message (or "" if no error)
		return message;
	};

	/*jshint -W069 */
	// create the global interface
	window["URLEEngine"] = URLEEngine;
}
());
