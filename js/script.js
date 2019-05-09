// LifeViewer Scripts
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// Script constructor
	/**
	 * @constructor
	 */
	function Script(source, tokenizeNewline) {
		// newline token
		/** @const {string} */ this.newlineToken = " _NEWLINE_ ";

		// trimmed newline token
		/** @const {string} */ this.trimNewlineToken = this.newlineToken.trim();

		// replace html substitutions
		this.source = source.replace(/&amp;/gi, "&");

		// tokinze newlines if requested
		if (tokenizeNewline) {
			this.source = this.source.replace(/\=/gm, " = ");
			this.source = this.source.replace(/\n/gm, this.newlineToken);
		}

		// split the source into tokens
		this.tokens = this.source.match(/\S+/g);

		// current token index
		this.current = 0;
	}

	// check whether next token is newline
	Script.prototype.nextIsNewline = function() {
		var result = false; 

		// check if there are more tokens
		if (this.tokens) {
			if (this.current < this.tokens.length) {
				if (this.tokens[this.current] === this.trimNewlineToken) {
					result = true;
				}
			}
		}

		return result;
	};

	// check whether give token is newline
	Script.prototype.isNewline = function(token) {
		var result = false;
		
		if (token === this.trimNewlineToken) {
			result = true;
		}

		return result;
	};

	// get next token from source
	Script.prototype.getNextToken = function() {
		var result = "";

		// check if there are more tokens
		if (this.tokens) {
			if (this.current < this.tokens.length) {
				result = this.tokens[this.current];

				// advance to next token
				this.current += 1;
			}
		}

		// return the token
		return result;
	};

	// get next token skipping newlines
	Script.prototype.getNextTokenSkipNewline = function() {
		var result = "";

		// check if there are more tokens
		result = this.getNextToken();
		while (result === this.trimNewlineToken) {
			result = this.getNextToken();
		}

		return result;
	};

	// get next token but don't advance
	Script.prototype.peekAtNextToken = function() {
		var result = "";

		// check if there are more tokens
		if (this.tokens) {
			if (this.current < this.tokens.length) {
				result = this.tokens[this.current];
			}
		}

		// return the token
		return result;
	};

	// search for a specific token and return token index
	// don't update position if token not found
	Script.prototype.findToken = function(token, from) {
		var result = -1,
			current = this.current;

		// if from supplied then set current position
		if (from !== -1) {
			// check it is in range
			if (from >= 0 && from < this.tokens.length) {
				current = from;
			}
		}

		// check if there are more tokens
		if (this.tokens) {
			while (current < this.tokens.length && result === -1) {
				if (this.tokens[current] === token) {
					// token found
					result = current;
				}

				// move to next token
				current += 1;
			}
		}

		// if the token was found then eat it
		if (result !== -1) {
			this.current = current;
		}
		
		// return the token index
		return result;
	};

	// check if a string is numeric
	Script.prototype.isNumeric = function(token) {
		// check if the token is numeric
		var result = !isNaN(parseFloat(token)) && isFinite(Number(token));

		// return the result
		return result;
	};

	// check if a token is a fraction n/m
	Script.prototype.isFraction = function(token) {
		var result = false,

		    // find the slash
		    slashIndex = token.indexOf("/"),

		    // left and right parts
		    leftPart = "",
		    rightPart = "";

		// check if the token contained a slash
		if (slashIndex !== -1) {
			leftPart = token.substr(0, slashIndex);
			rightPart = token.substr(slashIndex + 1);

			// check if they are numeric
			result = this.isNumeric(leftPart) && this.isNumeric(rightPart);
		}

		// return flag
		return result;
	};

	// return a token as a number
	Script.prototype.asNumber = function(token) {
		var result = 0,

		    // slash
		    slashIndex = 0,
		    leftPart = "",
		    rightPart = "";

		// check if the token is a fraction
		if (this.isFraction(token)) {
			// get the left and right parts
			slashIndex = token.indexOf("/");
			leftPart = token.substr(0, slashIndex);
			rightPart = token.substr(slashIndex + 1);

			// check for divison by zero
			if (Number(rightPart) !== 0) {
				result = Number(leftPart) / Number(rightPart);
			}
		}
		else {
			// check if the token is a number
			if (this.isNumeric(token)) {
				result = parseFloat(token);
			}
		}

		// return the result
		return result;
	};

	// get the next token as a number
	Script.prototype.getNextTokenAsNumber = function() {
		var result = 0,
		    token = this.getNextToken();

		// convert to a number
		result = this.asNumber(token);

		// return the number
		return result;
	};

	// check if a token is a number (including a fraction)
	Script.prototype.nextTokenIsNumeric = function() {
		var result = false,
		    token = "";

		// check if there are tokens
		if (this.tokens) {
			if (this.current < this.tokens.length) {
				token = this.tokens[this.current];

				// check if it is a fraction
				if (this.isFraction(token)) {
					result = true;
				}
				else {
					result = this.isNumeric(token);
				}
			}
		}

		// return the numeric flag
		return result;
	};

	window["Script"] = Script;
}
());

