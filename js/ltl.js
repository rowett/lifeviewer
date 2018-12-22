// LifeViewer LTL
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Uint32 PatternManager */

	// LTL object
	/**
	 * @constructor
	 */
	function LTL(allocator, width, height) {
		// allocator
		this.allocator = allocator;

		// algorithm parameters
		this.range = 1;
		this.minS = 0;
		this.maxS = 0;
		this.minB = 0;
		this.maxB = 0;
		this.scount = 2;
		this.type = PatternManager.mooreLTL;

		// neighbour count array
		this.counts = Array.matrix(Uint32, height, width, 0, allocator, "LTL.counts");

		// column count array
		this.colCounts = allocator.allocate(Uint32, this.range * 2 + 1, "LTL.colCounts");

		// range width array
		this.widths = allocator.allocate(Uint32, this.range * 2 + 1, "LTL.widths");
	}

	// set type and range
	LTL.prototype.setTypeAndRange = function(type, range) {
		// compute widest width
		var width = range * 2 + 1,
			r2 = range * range + range,
			i = 0,
			w = 0;

		// save type and range and allocate widths array
		this.type = type;
		this.range = range;
		this.widths = this.allocator.allocate(Uint32, range * 2 + 1, "LTL.widths");
		this.colCounts = this.allocator.allocate(Uint32, range * 2 + 1, "LTL.colCounts");

		// create the widths array based on the neighborhood type
		switch(type) {
			case PatternManager.mooreLTL:
			// Moore is a square
			for (i = 0; i < width; i += 1) {
				this.widths[i] = range;
			}
			break;

			// von Neumann is a diamond
			case PatternManager.vonNeumannLTL:
			for (i = 0; i < range; i += 1) {
				this.widths[i] = i;
				this.widths[width - i - 1] = i;
			}
			this.widths[i] = range;
			break;

			// circular is a circle
			case PatternManager.circularLTL:
			for (i = -range; i <= range; i += 1) {
				w = 0;
				while ((w + 1) * (w + 1) + (i * i) <= r2) w++;
				this.widths[i + range] = w;
			}
			break;
		}

	}

	// resize counts array
	LTL.prototype.resize = function(width, height) {
		// resize count array
		this.counts = Array.matrix(Uint32, height, width, 0, this.allocator, "LTL.counts");
	}

	// create the global interface
	window["LTL"] = LTL;
}
());


