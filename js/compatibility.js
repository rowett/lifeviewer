// cross-browser compatibility functions
// v1.0 01/Oct/2012
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Uint8Array Uint32Array */

	// for determining endian
	var data8, data32;

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

	// implement cross-browser cancelRequestAnimationFrame
	// @ts-ignore
	if (!window.cancelRequestAnimationFrame) {
		// @ts-ignore
		window.cancelRequestAnimationFrame = (function() { return (window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame) ; }());
	}

	// implement cross-browser typed arrays
	if (!window.Uint8Array) {
		window["typedArrays"] = false;
		window.Uint8Array = Array;
	}
	else {
		window["typedArrays"] = true;
	}

	if (!window.Uint8ClampedArray) {
		window.Uint8ClampedArray = window.Uint8Array;
	}

	if (!window.Uint16Array) {
		window.Uint16Array = Array;
	}

	if (!window.Uint32Array) {
		window.Uint32Array = Array;
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
	
	// set fill flag
	if (data32.fill) {
		window["arrayFill"] = true;
	} else {
		window["arrayFill"] = false;
	}

	// set copy within flag
	if (data32.copyWithin) {
		window["copyWithin"] = true;
	} else {
		window["copyWithin"] = false;
	}

	// global interface
	window["registerEvent"] = registerEvent;
}
());
