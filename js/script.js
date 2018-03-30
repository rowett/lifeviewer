// LifeViewer Scripts
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// Script constructor
	/**
	 * @constructor
	 */
	function Script(source) {
		// replace html substitutions
		this.source = source.replace(/&amp;/gi, "&");

		// split the source into tokens
		this.tokens = this.source.match(/\S+/g);

		// current token index
		this.current = 0;
	}

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

	// search for a specific token
	Script.prototype.findToken = function(token) {
		var result = false;

		// check if there are more tokens
		if (this.tokens) {
			while (this.current < this.tokens.length && !result) {
				if (this.tokens[this.current] === token) {
					// token found
					result = true;
				}

				// move to next token
				this.current += 1;
			}
		}

		// return whether the token was found
		return result;
	};

	// check if a string is numeric
	Script.prototype.isNumeric = function(token) {
		// check if the token is numeric
		var result = !Number.isNaN(parseFloat(token)) && Number.isFinite(Number(token));

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
			if (rightPart !== 0) {
				result = leftPart / rightPart;
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

