// cross-browser compatibility functions
// Various cross-browser functions.

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

	// whether browser supports various features
	var Supports = {
		/** @type {boolean} */ typedArrays : false,
		/** @type {boolean} */ arrayFill : false,
		/** @type {boolean} */ arraySlice : false,
		/** @type {boolean} */ littleEndian : false,
		/** @type {boolean} */ copyWithin : false,
		/** @type {boolean} */ cmdKey : false,

		// for determining endian
		/** @type {Uint8Array} */ data8 : null,
		/** @type {Uint32Array} */ data32 : null
	};

	// cross-browser register event function
	function registerEvent(element, /** @type {string} */ event, handler, /** @type {boolean} */ capture) {
		if (element.addEventListener) {
			element.addEventListener(event, handler, capture);
		} else {
			element.attachEvent("on" + event, handler);
		}
	}

	// implement cross-browser performance now
	if (!window.performance) {
		/** @suppress {checkTypes} */
		// @ts-ignore
		window.performance = {};
	}

	if (!window.performance.now) {
		window.performance.now = (function() {
			// @ts-ignore
			return (performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function() { return new Date().getTime(); });
		}());
	}

	// implement cross-browser requestAnimationFrame
	if (!window.requestAnimationFrame) {
		// @ts-ignore
		window.requestAnimationFrame = (function() { return (window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame); }());
	}

	// implement cross-browser typed arrays
	if (!window.Uint8Array) {
		Supports.typedArrays = false;

		/** @suppress {checkTypes} */
		window.Uint8Array = Array;
	} else {
		Supports.typedArrays = true;
	}

	if (!window.Uint8ClampedArray) {

		/** @suppress {checkTypes} */
		window.Uint8ClampedArray = window.Uint8Array;
	}

	if (!window.Uint16Array) {

		/** @suppress {checkTypes} */
		window.Uint16Array = Array;
	}

	if (!window.Uint32Array) {

		/** @suppress {checkTypes} */
		window.Uint32Array = Array;
	}

	if (!window.Int32Array) {

		/** @suppress {checkTypes} */
		window.Int32Array = Array;
	}

	if (!window.Int16Array) {

		/** @suppress {checkTypes} */
		window.Int16Array = Array;
	}

	if (!window.Int8Array) {

		/** @suppress {checkTypes} */
		window.Int8Array = Array;
	}

	if (!window.Uint8ClampedArray) {

		/** @suppress {checkTypes} */
		window.Uint8ClampedArray = Array;
	}

	if (!window.Float32Array) {

		/** @suppress {checkTypes} */
		window.Float32Array = Array;
	}

	if (!window.Float64Array) {

		/** @suppress {checkTypes} */
		window.Float64Array = Array;
	}

	// check for array fill
	if (!window.Uint32Array.prototype.fill) {
		Supports.arrayFill = false;

		/** @type {function(number,number=,number=):void} */
		window.Uint32Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	} else {
		Supports.arrayFill = true;
	}

	if (!window.Uint16Array.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Uint16Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Uint8Array.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Uint8Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Uint8ClampedArray.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Uint8ClampedArray.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Int32Array.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Int32Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Int16Array.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Int16Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Int8Array.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Int8Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Float32Array.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Float32Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Float64Array.prototype.fill) {
		/** @type {function(number,number=,number=):void} */
		window.Float64Array.prototype.fill = function(value, begin, end) {
			var	/** @type {number} */ i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin === undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	// check for slice
	if (!window.Int32Array.prototype.slice) {
		Supports.arraySlice = false;

		/** @type {function(number=,number=):Int32Array} */
		window.Int32Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Int32Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Int32Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	} else {
		Supports.arraySlice = true;
	}

	if (!window.Int16Array.prototype.slice) {
		/** @type {function(number=,number=):Int16Array} */
		window.Int16Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Int16Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Int16Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	if (!window.Int8Array.prototype.slice) {
		/** @type {function(number=,number=):Int8Array} */
		window.Int8Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Int8Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Int8Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	if (!window.Uint32Array.prototype.slice) {
		/** @type {function(number=,number=):Uint32Array} */
		window.Uint32Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Uint32Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Uint32Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	if (!window.Uint16Array.prototype.slice) {
		/** @type {function(number=,number=):Uint16Array} */
		window.Uint16Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Uint16Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Uint16Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	if (!window.Uint8Array.prototype.slice) {
		/** @type {function(number=,number=):Uint8Array} */
		window.Uint8Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Uint8Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Uint8Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	if (!window.Uint8ClampedArray.prototype.slice) {
		/** @type {function(number=,number=):Uint8ClampedArray} */
		window.Uint8ClampedArray.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Uint8ClampedArray} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Uint8ClampedArray(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	if (!window.Float32Array.prototype.slice) {
		/** @type {function(number=,number=):Float32Array} */
		window.Float32Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Float32Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Float32Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	if (!window.Float64Array.prototype.slice) {
		/** @type {function(number=,number=):Float64Array} */
		window.Float64Array.prototype.slice = function(begin, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {Float64Array} */ result = null;

			if (end === undefined) {
				end = this.length;
			}
			size = end - begin;

			result = new Float64Array(size);
			for (i = 0; i < size; i += 1) {
				result[i] = this[begin + i];
			}

			return result;
		};
	}

	// set endian flag
	Supports.data32 = new Uint32Array(1);
	Supports.data32[0] = 0x1234;
	Supports.data8 = new Uint8Array(Supports.data32.buffer);
	if (Supports.data8[0] === 0x34) {
		Supports.littleEndian = true;
	} else {
		Supports.littleEndian = false;
	}

	// set copy within flag
	if (Supports.data32.copyWithin) {
		Supports.copyWithin = true;
	} else {
		/** @type {function(number,number,number=):Uint32Array} */
		window.Uint32Array.prototype.copyWithin = function(target, start, end) {
			var	/** @type {number} */ i = 0,
				/** @type {number} */ size = 0,
				/** @type {boolean} */ reverse = false;

			if (end === undefined) {
				end = this.length;
			}
			size = end - start;

			if (start !== target) {
				// check for overlap
				if ((target >= start && target <= end) || (target + size >= start && target + size <= end)) {
					// overlap so determine which direction to copy
					if (target > start) {
						reverse = true;
					}
				}

				// check which direction to copy
				if (reverse) {
					for (i = size - 1; i >= 0; i -= 1) {
						this[target + i] = this[start + i];
					}
				} else {
					for (i = 0; i < size; i += 1) {
						this[target + i] = this[start + i];
					}
				}
			}

			return this;
		};

		Supports.copyWithin = false;
	}

	// check for Safari
	var ua = navigator.userAgent;
	if (ua.indexOf("Safari/") !== -1 && (!(ua.indexOf("Chrome/") !== -1 || ua.indexOf("Chromium/") !== -1))) {
		Supports.cmdKey = true;
	}
