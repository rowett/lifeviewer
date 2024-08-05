// LifeViewer Scripts
// Converts pattern comments into Script tokens.

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

	// Script constructor
	/**
	 * @constructor
	 */
	function Script(/** @type {string} */ source, /** @type {boolean} */ tokenizeNewline) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ l = source.length,
			/** @type {number} */ v = 0,
			/** @type {boolean} */ inToken = false,
			/** @type {boolean} */ inComment = false,
			/** @type {boolean} */ inQuotes = false,
			/** @type {number} */ tokens = 0,
			/** @type {Uint32Array} */ starts = new Uint32Array(l),
			/** @type {Uint16Array} */ lengths = new Uint16Array(l),
			/** @type {Uint32Array} */ numbers = new Uint32Array(l),
			/** @type {number} */ value = 0,
			/** @type {number} */ isNumber = 0,
			/** @const {number} */ maxValue = 1 << 30;   // maximum unsigned value to cache

		// parse the source
		while (i < l) {
			v = source.charCodeAt(i);

			switch (v) {

			// whitespace (the character is discarded)
			case 32:  // " "
			case 13:  // "\r"
			case 9:   // "\t"
			case 123: // "{"
			case 125: // "}"
				if (!inComment) {
					if (inToken) {
						// complete last token
						starts[tokens] = j;
						lengths[tokens] = i - j;
						numbers[tokens] = ((value << 1) + 1) & isNumber;
						tokens += 1;
						inToken = false;
					}
				}
				break;

			// commma (discarded if tokenizing newlines)
			case 44:  // ","
				if (tokenizeNewline) {
					if (!inComment) {
						if (inToken) {
							// complete last token
							starts[tokens] = j;
							lengths[tokens] = i - j;
							numbers[tokens] = ((value << 1) + 1) & isNumber;
							tokens += 1;
							inToken = false;
						}
					}
				} else {
					if (!inToken) {
						inToken = true;
						isNumber = 0;
						inComment = false;
						j = i;
					}
				}
				break;

			// newline
			case 10: // "\n"
				if (inToken) {
					starts[tokens] = j;
					lengths[tokens] = i - j;
					numbers[tokens] = ((value << 1) + 1) & isNumber;
					tokens += 1;
					inToken = false;
				}
				inComment = false;

				// add new line token if last token was not a new line
				if (tokenizeNewline) {
					if (tokens > 0 && source[starts[tokens - 1]] !== "\n") {
						starts[tokens] = i;
						lengths[tokens] = 1;
						numbers[tokens] = 0;
						tokens += 1;
					}
					inQuotes = false;
				}
				break;

			// separators (the separator becomes a token)
			case 58: // ":"
			case 61: // "="
				if (tokenizeNewline) {
					if (!inComment) {
						if (inToken) {
							// complete last token
							starts[tokens] = j;
							lengths[tokens] = i - j;
							numbers[tokens] = ((value << 1) + 1) & isNumber;
							tokens += 1;
							inToken = false;
						}

						// add separator token
						starts[tokens] = i;
						lengths[tokens] = 1;
						numbers[tokens] = 0;
						tokens += 1;
					}
				} else {
					if (!inToken) {
						inToken = true;
						isNumber = 0;
						inComment = false;
						j = i;
					}
				}
				break;

			// quote
			case 34: // quotes
				if (tokenizeNewline) {
					if (!inComment) {
						inQuotes = !inQuotes;
						if (!inToken) {
							inToken = true;
							j = i;
						}
					}
				} else {
					if (!inToken) {
						inToken = true;
						isNumber = 0;
						j = i;
					}
				}
				break;

			// comment
			case 35: // "#"
				if (tokenizeNewline) {
					if (!inQuotes) {
						if (!inComment) {
							if (inToken) {
								// complete last token
								starts[tokens] = j;
								lengths[tokens] = i - j;
								numbers[tokens] = ((value << 1) + 1) & isNumber;
								tokens += 1;
								inToken = false;
							}
							inComment = true;
						}
					}
				} else {
					if (!inToken) {
						inToken = true;
						isNumber = 0;
						inComment = false;
						j = i;
					}
				}
				break;

			default:
				if (!inComment) {
					if (!inToken) {
						inToken = true;
						j = i;
						if (v >= 48 && v <= 57) { // >= "0" && <= "9"
							isNumber = ~0; // all bits set
							value = v - 48; // v - "0"
						} else {
							isNumber = 0;
						}
					} else {
						if (v >= 48 && v <= 57) { // >= "0" && <= "9"
							value = (value * 10) + v - 48; // v - "0"
							if (value >= maxValue) {
								isNumber = 0;
							}
						} else {
							isNumber = 0;
						}
					}
				}
				break;
			}
			i += 1;
		}

		// handle final token
		if (inToken) {
			starts[tokens] = j;
			lengths[tokens] = i - j;
			numbers[tokens] = ((value << 1) + 1) & isNumber;
			tokens += 1;
		}

		// resize arrays and copy
		this.starts = starts.slice(0, tokens);
		this.lengths = lengths.slice(0, tokens);
		this.numbers = numbers.slice(0, tokens);
		this.current = 0;
		this.source = source;
	}

	// get the string between a range of tokens
	/** @returns {string} */
	Script.prototype.getStringSection = function(/** @type {number} */ start, /** @type {number} */ end) {
		var	/** @type {string} */ result = "";

		// check the token indexes are valid
		if (start < 0 || start >= this.starts.length || end < 0 || end >= this.starts.length || start > end) {
			result = "";
		} else {
			result = this.source.substring(this.starts[start], this.starts[end] + this.lengths[end]);
		}

		return result;
	};

	// step back one token
	Script.prototype.stepBack = function() {
		if (this.current > 0) {
			this.current -= 1;
		}
	};

	// skip to start of next line
	Script.prototype.skipToNextLine = function() {
		// check if there are more tokens
		while (this.current < this.starts.length && this.source.charCodeAt(this.starts[this.current]) !== 10) {
			this.current += 1;
		}

		// skip newline if present
		if (this.current < this.starts.length) {
			this.current += 1;
		}
	};

	// skip new lines
	Script.prototype.skipNewlines = function() {
		while (this.current < this.starts.length && this.source.charCodeAt(this.starts[this.current]) === 10) {
			this.current += 1;
		}
	};

	// check whether there are more tokens on the line
	/** @returns {boolean} */
	Script.prototype.moreTokensOnLine = function() {
		var	/** @type {boolean} */ result = false;

		if (this.current < this.starts.length) {
			if (this.source.charCodeAt(this.starts[this.current]) !== 10) {
				result = true;
			}
		}

		return result;
	};

	// check whether next token is newline
	/** @returns {boolean} */
	Script.prototype.nextIsNewline = function() {
		var	/** @type {boolean} */ result = false; 

		// check if there are more tokens
		if (this.current < this.starts.length) {
			if (this.source.charCodeAt(this.starts[this.current]) === 10) {
				result = true;
			}
		}

		return result;
	};

	// get next token from source
	/** @returns {string} */
	Script.prototype.getNextToken = function() {
		var	/** @type {string} */ result = "";

		// check if there are more tokens
		if (this.current < this.starts.length) {
			result = this.source.substring(this.starts[this.current], this.starts[this.current] + this.lengths[this.current]);

			// advance to next token
			this.current += 1;
		}

		// return the token
		return result;
	};

	// get next token up to the end of the line
	/** @returns {string} */
	Script.prototype.getNextTokenToEndOfLine = function() {
		var	/** @type {string} */ result = "",
			/** @type {number} */ index = -1,
			/** @type {number} */ index2 = -1;

		// check if there are more tokens
		if (this.current < this.starts.length) {
			index = this.source.indexOf("\n", this.starts[this.current]);
			if (index === -1) {
				result = this.source.substring(this.starts[this.current]);
			} else {
				// check for \r before the newline
				index2 = this.source.indexOf("\r", this.starts[this.current]);
				if (index2 !== -1 && (index2 < index)) {
					index = index2;
				}
				result = this.source.substring(this.starts[this.current], index);
			}
			this.skipToNextLine();
		}

		// return the token
		return result;
	};

	// get next token skipping newlines
	/** @returns {string} */
	Script.prototype.getNextTokenSkipNewline = function() {
		var	/** @type {string} */ result = "";

		// check if there are more tokens
		result = this.getNextToken();
		while (result === "\n") {
			result = this.getNextToken();
		}

		return result;
	};

	// get next token but don't advance
	/** @returns {string} */
	Script.prototype.peekAtNextToken = function() {
		var	/** @type {string} */ result = "";

		// check if there are more tokens
		if (this.current < this.starts.length) {
			result = this.source.substring(this.starts[this.current], this.starts[this.current] + this.lengths[this.current]);
		}

		// return the token
		return result;
	};

	// search for a specific token and return token index
	/** @returns {number} */
	Script.prototype.findToken = function(/** @type {string} */ token, /** @type {number} */ from) {
		return this.findTokenSomewhere(token, from, false);
	};

	// search for a specific token at the start of a line and return token index
	/** @returns {number} */
	Script.prototype.findTokenAtLineStart = function(/** @type {string} */ token, /** @type {number} */ from) {
		return this.findTokenSomewhere(token, from, true);
	};

	// search for a specific token and return token index
	// don't update position if token not found
	/** @returns {number} */
	Script.prototype.findTokenSomewhere = function(/** @type {string} */ token, /** @type {number} */ from, /** @type {boolean} */ atLineStart) {
		var	/** @type {number} */ result = -1,
			/** @type {number} */ current = this.current,
			/** @type {boolean} */ found = false,
			/** @type {number} */ i = 0;

		// if from supplied then set current position
		if (from !== -1) {
			// check it is in range
			if (from >= 0 && from < this.starts.length) {
				current = from;
			}
		}

		// check if there are more tokens
		while (current < this.starts.length && result === -1) {
			// check lengths
			if (token.length === this.lengths[current]) {
				i = 0;
				found = true;
				while (found && i < token.length) {
					if (token[i] !== this.source[this.starts[current] + i]) {
						found = false;
					} else {
						i += 1;
					}
				}
			} else {
				found = false;
			}

			if (found) {
				// token found so check if line start is required
				if (atLineStart) {
					if (!(current === 0 || this.source.charCodeAt(this.starts[current - 1]) === 10)) {
						found = false;
					} 
				}

				if (found) {
					result = current;
				}
			}

			// move to next token
			current += 1;
		}

		// if the token was found then eat it
		if (result !== -1) {
			this.current = current;
		}

		// return the token index
		return result;
	};

	// check if a string is numeric
	/** @returns {boolean} */
	Script.prototype.isNumeric = function(/** @type {string} */ token) {
		// check if the token is numeric
		var	/** @type {boolean} */ result = !isNaN(parseFloat(token)) && isFinite(Number(token));

		// return the result
		return result;
	};

	// check if a token is a fraction n/m
	/** @returns {boolean} */
	Script.prototype.isFraction = function(/** @type {string} */ token) {
		var	/** @type {boolean} */ result = false,

			// find the slash
			/** @type {number} */ slashIndex = token.indexOf("/"),

			// left and right parts
			/** @type {string} */ leftPart = "",
			/** @type {string} */ rightPart = "";

		// check if the token contained a slash
		if (slashIndex !== -1) {
			leftPart = token.substring(0, slashIndex);
			rightPart = token.substring(slashIndex + 1);

			// check if they are numeric
			result = this.isNumeric(leftPart) && this.isNumeric(rightPart);
		}

		// return flag
		return result;
	};

	// return a token as a number
	/** @returns {number} */
	Script.prototype.asNumber = function(/** @type {string} */ token) {
		var	/** @type {number} */ result = 0,

		    // slash
		    /** @type {number} */ slashIndex = 0,
		    /** @type {string} */ leftPart = "",
		    /** @type {string} */ rightPart = "";

		// check if the token is a fraction
		if (this.isFraction(token)) {
			// get the left and right parts
			slashIndex = token.indexOf("/");
			leftPart = token.substring(0, slashIndex);
			rightPart = token.substring(slashIndex + 1);

			// check for divison by zero
			if (Number(rightPart) !== 0) {
				result = Number(leftPart) / Number(rightPart);
			}
		} else {
			// check if the token is a number
			if (this.isNumeric(token)) {
				result = parseFloat(token);
			}
		}

		// return the result
		return result;
	};

	// get the next token as a number
	/** @returns {number} */
	Script.prototype.getNextTokenAsNumber = function() {
		var	/** @type {number} */ result = 0,
			/** @type {string} */ token = "";

		// check for pre-converted number
		if (this.current < this.starts.length) {
			if ((this.numbers[this.current]) !== 0) {
				result = this.numbers[this.current] >> 1;
				this.current += 1;
			} else {
				// get the next token
				token = this.getNextToken();
				// convert to a number
				result = this.asNumber(token);
			}
		}

		// return the number
		return result;
	};

	// check if a token is a number (including a fraction)
	/** @returns {boolean} */
	Script.prototype.nextTokenIsNumeric = function() {
		var	/** @type {boolean} */ result = false,
			/** @type {string} */ token = "";

		// check if there are tokens
		if (this.current < this.starts.length) {
			// check if it was recognized as a number during tokenization
			if (this.numbers[this.current]) {
				result = true;
			} else {
				// inspect the token since it may be a fraction
				token = this.source.substring(this.starts[this.current], this.starts[this.current] + this.lengths[this.current]);

				// check if it is a fraction
				if (this.isFraction(token)) {
					result = true;
				} else {
					result = this.isNumeric(token);
				}
			}
		}

		// return the numeric flag
		return result;
	};

	// check if a token forward from here is a number (including a fraction)
	/** @returns {boolean} */
	Script.prototype.forwardTokenIsNumeric = function(/** @type {number} */ howFar) {
		var	/** @type {boolean} */ result = false,
			/** @type {string} */ token = "",
			/** @type {number} */ current = this.current + howFar;

		// check if there are tokens
		if (current < this.starts.length) {
			// check if it was recognized as a number during tokenization
			if (this.numbers[current]) {
				result = true;
			} else {
				// inspect the token since it may be a fraction
				token = this.source.substring(this.starts[current], this.starts[current] + this.lengths[current]);

				// check if it is a fraction
				if (this.isFraction(token)) {
					result = true;
				} else {
					result = this.isNumeric(token);
				}
			}
		}

		// return the numeric flag
		return result;
	};

	// eat all tokens
	Script.prototype.eatAllTokens = function() {
		this.current = this.starts.length;
	};
