// Random

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Uint8Array */

	// Random object
	/**
	 * @constructor
	 */
	function Random() {
		this.key = new Uint8Array(256);
		this.i = 0;
		this.j = 0;
	}

	// initialise to a new seed
	Random.prototype.init = function(seed) {
		var i, j, t, k = this.key;
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
	Random.prototype.random = function() {
		var i, t, number = 0, multiplier = 1, k = this.key, ti = this.i, tj = this.j;
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

	/*jshint -W069 */
	// create global interface
	window["Random"] = Random;
}
());
