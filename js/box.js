// LifeViewer BoundingBox
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// BoundingBox object
	/**
	 * @constructor
	 */
	function BoundingBox(leftX, bottomY, rightX, topY) {
		this.leftX = leftX;
		this.bottomY = bottomY;
		this.rightX = rightX;
		this.topY = topY;
	}

	// copy box from another
	BoundingBox.prototype.set = function(source) {
		this.leftX = source.leftX;
		this.bottomY = source.bottomY;
		this.rightX = source.rightX;
		this.topY = source.topY;
	};

	/*jshint -W069 */
	window["BoundingBox"] = BoundingBox;
}
());

