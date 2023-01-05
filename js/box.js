// LifeViewer BoundingBox
// written by Chris Rowett

	// BoundingBox object
	/**
	 * @constructor
	 */
	function BoundingBox(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY) {
		/** @type {number} */ this.leftX = leftX;
		/** @type {number} */ this.bottomY = bottomY;
		/** @type {number} */ this.rightX = rightX;
		/** @type {number} */ this.topY = topY;
	}

	// copy box from another
	BoundingBox.prototype.set = function(/** @type {BoundingBox} */ source) {
		/** @type {number} */ this.leftX = source.leftX;
		/** @type {number} */ this.bottomY = source.bottomY;
		/** @type {number} */ this.rightX = source.rightX;
		/** @type {number} */ this.topY = source.topY;
	};
