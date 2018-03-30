// LifeViewer LTL
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// LTL constants
	var LTLConstants = {
		intMax : 16384,
		intMin : -16384
	};

	// LTL object
	/**
	 * @constructor
	 */
	function LTL(allocator) {
		// allocator
		this.allocator = allocator;
	}

	// create the global interface
	window["LTL"] = LTL;
}
());


