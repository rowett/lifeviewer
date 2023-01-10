// Random
// 
// Pseudo-random number generator.

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
