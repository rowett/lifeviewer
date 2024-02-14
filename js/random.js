// Random
// Pseudo-random number generator.

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

	// Random object
	/**
	 * @constructor
	 */
	function Random() {
		/** @type {Uint8Array} */ this.key = new Uint8Array(256);
		/** @type {number} */ this.i = 0;
		/** @type {number} */ this.j = 0;
	}

	// initialise to a new seed
	Random.prototype.init = function(/** @type {string} */ seed) {
		var	/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ t,
			/** @type {Uint8Array} */ k = this.key;

		for (i = 0; i < 256; i += 1) {
			k[i] = i;
		}

		j = 0;
		for (i = 0; i < 256; i += 1)
		{
			j = (j + k[i] + seed.charCodeAt(i % seed.length)) & 255;

			t = k[i];
			k[i] = k[j];
			k[j] = t;
		}
		this.i = 0;
		this.j = 0;
	};

	// get random number
	/** @returns {number} */
	Random.prototype.random = function() {
		var	/** @type {number} */ i,
			/** @type {number} */ t,
			/** @type {number} */ number = 0,
			/** @type {number} */ multiplier = 1,
			/** @type {Uint8Array} */ k = this.key,
			/** @type {number} */ ti = this.i,
			/** @type {number} */ tj = this.j;

		for (i = 0; i < 8; i += 1) {
			ti = (ti + 1) & 255;
			tj = (tj + k[ti]) & 255;

			t = k[ti];
			k[ti] = k[tj];
			k[tj] = t;

			number += k[(k[ti] + k[tj]) & 255] * multiplier;
			multiplier *= 256;
		}
		this.i = ti;
		this.j = tj;
		return number / 18446744073709551616;
	};
