// cross-browser compatibility functions
// v1.0 01/Oct/2012
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Int8Array Int16Array Int32Array Uint8Array Uint8ClampedArray Uint16Array Uint32Array Float32Array  Float64Array */

	/*jshint -W069 */

	// for determining endian
	var data8 = null,
		data32 = null;

	// cross-browser register event function
	function registerEvent(element, event, handler, capture) {
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
		window["typedArrays"] = false;

		/** @suppress {checkTypes} */
		window.Uint8Array = Array;
	}
	else {
		window["typedArrays"] = true;
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
		window["arrayFill"] = false;

		window.Uint32Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	} else {
		window["arrayFill"] = true;
	}

	if (!window.Uint16Array.prototype.fill) {
		window.Uint16Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Uint8Array.prototype.fill) {
		window.Uint8Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Uint8ClampedArray.prototype.fill) {
		window.Uint8ClampedArray.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Int32Array.prototype.fill) {
		window.Int32Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Int16Array.prototype.fill) {
		window.Int16Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Int8Array.prototype.fill) {
		window.Int8Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Float32Array.prototype.fill) {
		window.Float32Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	if (!window.Float64Array.prototype.fill) {
		window.Float64Array.prototype.fill = function(value, begin, end) {
			var i = 0;

			if (end === undefined) {
				end = this.length;
			}
			if (begin == undefined) {
				begin = 0;
			}

			for (i = 0; i < end; i += 1) {
				this[i] = value;
			}
		};
	}

	// check for slice
	if (!window.Int32Array.prototype.slice) {
		window["arraySlice"] = false;

		window.Int32Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window["arraySlice"] = true;
	}

	if (!window.Int16Array.prototype.slice) {
		window.Int16Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window.Int8Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window.Uint32Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window.Uint16Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window.Uint8Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window.Uint8ClampedArray.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window.Float32Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
		window.Float64Array.prototype.slice = function(begin, end) {
			var i = 0,
				size = 0,
				result = null;

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
	data32 = new Uint32Array(1);
	data32[0] = 0x1234;
	data8 = new Uint8Array(data32.buffer);
	if (data8[0] === 0x34) {
		window["littleEndian"] = true;
	} else {
		window["littleEndian"] = false;
	}
	
	// set copy within flag
	if (data32.copyWithin) {
		window["copyWithin"] = true;
	} else {
		window.Uint32Array.prototype.copyWithin = function(target, start, end) {
			var i = 0,
				size = 0,
				reverse = false;

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

		window["copyWithin"] = false;
	}

	// global interface
	window["registerEvent"] = registerEvent;
}
());
