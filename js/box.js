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

	window["BoundingBox"] = BoundingBox;
}
());

