// LifeViewer BoundingBox
// BoundingBox for pattern and selection extent.

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

	// merge box from another
	BoundingBox.prototype.merge = function(/** @type {BoundingBox} */ source) {
		if (source.leftX < this.leftX) {
			this.leftX = source.leftX;
		}

		if (source.rightX > this.rightX) {
			this.rightX = source.rightX;
		}

		if (source.bottomY < this.bottomY) {
			this.bottomY = source.bottomY;
		}

		if (source.topY > this.topY) {
			this.topY = source.topY;
		}
	};