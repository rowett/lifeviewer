// LifeViewer HROT
// Implements HROT/LtL rules.

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

	// HROT object
	/**
	 * @constructor
	 */
	function HROT(/** @type {Allocator} */ allocator, /** @type {Life} */ engine, /** @type {PatternManager} */ manager) {
		// allocator
		/** @type {Allocator} */ this.allocator = allocator;

		// engine
		/** @type {Life} */ this.engine = engine;

		// pattern manager
		/** @type {PatternManager} */ this.manager = manager;

		// algorithm parameters
		/** @type {number} */ this.xrange = 1;
		/** @type {number} */ this.yrange = 1;
		/** @type {number} */ this.scount = 2;
		/** @type {Uint8Array} */ this.births = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, 0, "HROT.births"));
		/** @type {Uint8Array} */ this.survivals = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, 0, "HROT.survivals"));
		/** @type {Uint8Array} */ this.altBirths = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, 0, "HROT.altBirths"));
		/** @type {Uint8Array} */ this.altSurvivals = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, 0, "HROT.altSurvivals"));
		/** @type {number} */ this.type = manager.mooreHROT;

		// neighbourhood array for custom neighbourhoods (will be resized)
		/** @type {Array<Uint8Array>} */ this.neighbourhood = Array.matrix(Type.Uint8, 1, 1, 0, allocator, "HROT.neighbourhood");

		// neighbourhood list for custom neighbourhoods (will be resized)
		/** @type {Int16Array} */ this.neighbourList = /** @type {!Int16Array} */ (allocator.allocate(Type.Int16, 0, "HROT.neighbourList"));

		// neighbour count array (will be resized)
		/** @type {Array<Int32Array>} */ this.counts = Array.matrix(Type.Int32, 1, 1, 0, allocator, "HROT.counts");

		// range width array (will be resized)
		/** @type {Uint32Array} */ this.widths = /** @type {!Uint32Array} */ (allocator.allocate(Type.Uint32, 0, "HROT.widths"));

		// used row array (will be resized)
		/** @type {Uint8Array} */ this.colUsed = /** @type {!Uint8Array} */ (allocator.allocate(Type.Uint8, 0, "HROT.colUsed"));

		// weighted neighbourhood array (will be resized)
		/** @type {Int8Array} */ this.weightedNeighbourhood = /** @type {!Int8Array} */ (allocator.allocate(Type.Int8, 0, "HROT.weightedNeighbourhood"));

		// weighted states array
		/** @type {Uint8Array} */ this.weightedStates = null;

		// corner and edge range
		/** @type {number} */ this.edgeRange = -1;
		/** @type {number} */ this.cornerRange = -1;

		// range threshold to use fast von Neumann algorithm
		/** @const {number} */ this.rangeVN = 6;

		// fast von Neumann algorithm parameters
		/** @type {number} */ this.nrows = 0;
		/** @type {number} */ this.ncols = 0;
		/** @type {number} */ this.ccht = 0;
		/** @type {number} */ this.halfccwd = 0;

		// whether alternate rule defined
		/** @type {boolean} */ this.altSpecified = false;

		// custom neighbourhood string
		/** @type {string} */ this.customNeighbourhood = "";

		// number of cells in custom neighbourhood
		/** @type {number} */ this.customNeighbourCount = -1;

		// whether rule is triangular
		/** @type {boolean} */ this.isTriangular = false;

		// random number generation
		/** @type {Random} */ this.myRand = new Random();

		// initialize random generator
		this.myRand.init(Date.now().toString());

		// random chances of births, survivals and immunity based on neighbour count
		// births: if rule determines birth then what chance this actually happens
		// survivals: if rule determines survival then what chance this actually happens
		// immunity: if rule determines cell should not survive then what chance it gets immunity
		/** @type {Float32Array} */ this.birthChances = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "HROT.birthChances"));
		/** @type {Float32Array} */ this.survivalChances = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "HROT.suvivalChances"));
		/** @type {Float32Array} */ this.immunityChances = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "HROT.immunityChances"));

		// whether to use random chances
		/** @type {boolean} */ this.useRandom = false;

		// random chance births (or -1 if not used)
		/** @type {number} */ this.useRandomBirths = -1;

		// random chance survivals (or -1 if not used)
		/** @type {number} */ this.useRandomSurvivals = -1;

		// random chance immunity (or -1 if not used)
		/** @type {number} */ this.useRandomImmunities = -1;
	}

	// set random seed
	HROT.prototype.setRandomSeed = function(/** @type {string} */ seed) {
		var	/** @type {number} */ i = 0;

		// initialize random number generator
		this.myRand.init(seed);

		// create birth chances
		this.birthChances = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, this.births.length, "HROT.birthChances"));
		for (i = 0; i < this.births.length; i += 1) {
			if (this.useRandomBirths <= -1) {
				this.birthChances[i] = this.myRand.random();
			} else {
				// chance of birth actually happening: 0% never, 100% always
				// must be > than this value to be born
				this.birthChances[i] = (100 - this.useRandomBirths) / 100;
			}
		}

		// create survival chances
		this.survivalChances = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, this.survivals.length, "HROT.suvivalChances"));
		for (i = 0; i < this.survivals.length; i += 1) {
			if (this.useRandomSurvivals <= -1) {
				this.survivalChances[i] = this.myRand.random();
			} else {
				// chance of survival actually happening: 0% never, 100% always
				// must be > than this value to survive
				this.survivalChances[i] = (100 - this.useRandomSurvivals) / 100;
			}
		}

		// create immunity chances
		this.immunityChances = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, this.survivals.length, "HROT.immunityChances"));
		for (i = 0; i < this.survivals.length; i += 1) {
			if (this.useRandomImmunities === -1) {
				this.immunityChances[i] = 1;
			} else {
				if (this.useRandomImmunities === -2) {
					this.immunityChances[i] = this.myRand.random();
				} else {
					// chance of immunity: 0% never, 100% always
					// must be > than this value to be immune
					this.immunityChances[i] = (100 - this.useRandomImmunities) / 100;
				}
			}
		}
		// use the same random chance for all births
		this.birthChances.fill(this.birthChances[0]);

		// use the same random chance for all survivals
		this.survivalChances.fill(this.survivalChances[0]);

		// use the same random chance for all immunities
		this.immunityChances.fill(this.immunityChances[0]);
	};

	// resize counts array
	HROT.prototype.resize = function(/** @type {number} */ width, /** @type {number} */ height) {
		// resize counts array
		this.counts = Array.matrix(Type.Int32, height, width, 0, this.allocator, "HROT.counts");
		this.colUsed = /** @type {!Uint8Array} */ (this.allocator.allocate(Type.Uint8, width, "HROT.colUsed"));
	};

	// set type and range
	HROT.prototype.setTypeAndRange = function(/** @type {number} */ type, /** @type {number} */ range, /** @type {string} */ customNeighbourhood, /** @type {number} */ neighbourCount, /** @type {boolean} */ isTriangular, /** @type {Array<number>} */ weightedNeighbourhood, /** @type {Array<number>} */ weightedStates, /** @type {number} */ cornerRange, /** @type {number} */ edgeRange) {
		// compute widest width
		var	/** @const {number} */ width = range * 2 + 1,
			/** @const {number} */ wm1 = width - 1,
			/** @const {number} */ r2 = range * range,
			/** @const {number} */ r2plus = r2 + range,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ l = 0,
			/** @type {number} */ w = 0,
			/** @type {number} */ item = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ total = 0,
			/** @type {number} */ numInRow = 0,
			/** @type {number} */ middleK = customNeighbourhood.length >> 1,
			/** @type {Uint8Array} */ row,
			/** @const {string} */ hexDigits = "0123456789abcdef",
			/** @type {Uint32Array} */ neighbourCache = null,
			/** @type {Uint16Array} */ rowCount = null;

		// save type and range and allocate widths array
		this.type = type;
		this.yrange = range;
		this.xrange = (isTriangular && !(type === this.manager.customHROT || type === this.manager.weightedHROT)) ? range + range : range;
		this.widths = /** @type {!Uint32Array} */ (this.allocator.allocate(Type.Uint32, width, "HROT.widths"));
		this.customNeighbourhood = customNeighbourhood;
		this.customNeighbourCount = neighbourCount;
		this.isTriangular = isTriangular;
		this.cornerRange = cornerRange;
		this.edgeRange = edgeRange;

		// copy the weighted neighbourhood if specified
		if (weightedNeighbourhood) {
			this.weightedNeighbourhood = /** @type {!Int8Array} */ (this.allocator.allocate(Type.Int8, weightedNeighbourhood.length, "HROT.weightedNeighbourhood"));
			for (i = 0; i < weightedNeighbourhood.length; i += 1) {
				this.weightedNeighbourhood[i] = weightedNeighbourhood[i];
			}
		} else {
			this.weightedNeighbourhood = null;
		}

		// copy the weighted states if specified
		if (weightedStates) {
			this.weightedStates = /** @type {!Uint8Array} */ (this.allocator.allocate(Type.Uint8, weightedStates.length, "HROT.weightedStates"));
			for (i = 0; i < weightedStates.length; i += 1) {
				this.weightedStates[i] = weightedStates[i];
			}
		} else {
			this.weightedStates = null;
		}

		// create the widths array based on the neighborhood type
		switch(type) {
			case this.manager.mooreHROT:
			// Moore is a square
			for (i = 0; i < width; i += 1) {
				this.widths[i] = range;
			}
			break;

			// von Neumann is a diamond
			case this.manager.vonNeumannHROT:
			for (i = 0; i < range; i += 1) {
				this.widths[i] = i;
				this.widths[width - i - 1] = i;
			}
			this.widths[i] = range;
			break;

			// circular is a circle
			case this.manager.circularHROT:
			for (i = -range; i <= range; i += 1) {
				w = 0;
				while ((w + 1) * (w + 1) + (i * i) <= r2plus) {
					w += 1;
				}
				this.widths[i + range] = w;
			}
			break;

			// l2 is euclidean distance
			case this.manager.l2HROT:
			for (i = -range; i <= range; i += 1) {
				w = 0;
				while ((w + 1) * (w + 1) + (i * i) <= r2) {
					w += 1;
				}
				this.widths[i + range] = w;
			}
			break;

			// @ is custom neighbourhood
			case this.manager.customHROT:
			// resize and populate the array
			this.neighbourhood = Array.matrix(Type.Uint8, width, width, 0, this.allocator, "HROT.neighbourhood");
			rowCount = new Uint16Array(width);
			k = 0;
			j = 0;
			i = 0;
			w = 0;
			count = 0;
			numInRow = 0;
			item = 0;
			row = this.neighbourhood[wm1 - j];
			while (j < width) {
				// get next 4 bits
				w = hexDigits.indexOf(customNeighbourhood[k]);
				if (k === middleK) {
					row[wm1 - i] = 1;
					i += 1;
					count += 1;
					numInRow += 1;
				}
				k += 1;

				// set neighbourhood
				for (l = 3; l >=0; l -= 1) {
					if ((w & (1 << l)) !== 0) {
						row[wm1 - i] = 1;
						count += 1;
						numInRow += 1;
					}
					i += 1;
					if (i === width) {
						rowCount[wm1 - item] = numInRow;
						numInRow = 0;
						item += 1;
						i = 0;
						j += 1;
						if (j < width) {
							row = this.neighbourhood[wm1 - j];
						}
					}
				}
			}

			// allocate the neighbour cache
			neighbourCache = new Uint32Array(count);

			// populate the list from the array
			count = 0;
			for (j = 0; j < width; j += 1) {
				row = this.neighbourhood[j];
				for (i = 0; i < width; i += 1) {
					if (row[i] > 0) {
						neighbourCache[count] = (j << 16) | i;
						count += 1;
					}
				}
			}

			// allocate the neighbour list
			total = 0;
			for (i = 0; i < rowCount.length; i += 1) {
				// number of items in the row plus the count plus the row number
				if (rowCount[i] > 0) {
					total += rowCount[i] + 2;
				}
			}
			this.neighbourList = /** @type {!Int16Array} */ (this.allocator.allocate(Type.Int16, total, "HROT.neighbourList"));

			// populate the list from each row in the cache
			k = 0;
			count = 0;
			for (i = 0; i < rowCount.length; i += 1) {
				// get the row
				if (rowCount[i] > 0) {
					item = neighbourCache[k];
					this.neighbourList[count] = range - (item >> 16);
					this.neighbourList[count + 1] = rowCount[i];
					count += 2;
					for (j = 0; j < rowCount[i]; j += 1) {
						this.neighbourList[count + j]  = range - (neighbourCache[k] & 65535);
						k += 1;
					}
					count += rowCount[i];
				}
			}

			break;
		}
	};

	// get the count for von Neumann
	/** @returns {number} */
	HROT.prototype.getCount2 = function(/** @type {number} */ i, /** @type {number} */ j, /** @type {Int32Array} */ countRow) {
		if (i < 0 || i + j < 0 || j - i >= this.ncols) {
			return 0;
		}
		if (j < 0 && i + j < this.ccht) {
			return this.counts[i + j][0];
		}
		if (j >= this.ncols && j-i >= this.ncols - this.ccht) {
			return this.counts[i + this.ncols - 1 - j][this.ncols - 1];
		}
		if (i < this.ccht) {
			return countRow[j];
		}
		if ((i - this.ccht + 1) + j <= this.halfccwd) {
			return this.counts[this.ccht - 1][i - this.ccht + 1 + j];
		}
		if (j - (i - this.ccht + 1) >= this.halfccwd) {
			return this.counts[this.ccht - 1][j - (i - this.ccht + 1)];
		}
		return this.counts[this.ccht - 1][this.halfccwd + ((i + j + this.ccht + this.halfccwd + 1) % 2)];
	};

	// get the count for von Neumann
	/** @returns {number} */
	HROT.prototype.getCount = function(/** @type {number} */ i, /** @type {number} */ j) {
		if (i < 0 || i + j < 0 || j - i >= this.ncols) {
			return 0;
		}
		if (j < 0 && i + j < this.ccht) {
			return this.counts[i + j][0];
		}
		if (j >= this.ncols && j-i >= this.ncols - this.ccht) {
			return this.counts[i + this.ncols - 1 - j][this.ncols - 1];
		}
		if (i < this.ccht) {
			return this.counts[i][j];
		}
		if ((i - this.ccht + 1) + j <= this.halfccwd) {
			return this.counts[this.ccht - 1][i - this.ccht + 1 + j];
		}
		if (j - (i - this.ccht + 1) >= this.halfccwd) {
			return this.counts[this.ccht - 1][j - (i - this.ccht + 1)];
		}
		return this.counts[this.ccht - 1][this.halfccwd + ((i + j + this.ccht + this.halfccwd + 1) % 2)];
	};

	// copy a slice
	// TBD src has no type information because of a type check issue
	HROT.prototype.copySlice = function(/** @type {Uint8Array} */ dest, source, /** @type number */ left, /** @type {number} */ right, /** @type {number} */ pos) {
		dest.set(source.slice(left, right), pos);
	};

	// wrap the grid for HROT torus
	HROT.prototype.wrapTorusHROT = function(/** @type {number} */ lx, /** @type {number} */ by, /** @type {number} */ rx, /** @type {number} */ ty) {
		var	/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Uint8Array} */ sourceRow = null,
			/** @type {Uint8Array} */ destRow = null,
			/** @const {number} */ xrange = this.xrange,
			/** @const {number} */ yrange = this.yrange,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// copy the bottom rows to the top border
		for (y = 0; y < yrange; y += 1) {
			sourceRow = colourGrid[by + y];
			destRow = colourGrid[ty + y + 1];
			this.copySlice(destRow, sourceRow, lx, rx + 1, lx);
			//destRow.set(sourceRow.slice(lx, rx + 1), lx);
		}

		// copy the top rows to the bottom border
		for (y = 0; y < yrange; y += 1) {
			sourceRow = colourGrid[ty - y];
			destRow = colourGrid[by - y - 1];
			this.copySlice(destRow, sourceRow, lx, rx + 1, lx);
			//destRow.set(sourceRow.slice(lx, rx + 1), lx);
		}

		// copy the left columns to the right border
		// and the right columns to the left border
		for (y = by; y <= ty; y += 1) {
			sourceRow = colourGrid[y];
			sourceRow.copyWithin(rx + 1, lx, lx + xrange + 1);
			sourceRow.copyWithin(lx - xrange - 1, rx - xrange, rx + 1);
		}

		// copy bottom left cells to top right border
		// and bottom right cells to top left border
		for (y = 0; y < yrange; y += 1) {
			sourceRow = colourGrid[by + y];
			destRow = colourGrid[ty + y + 1];
			this.copySlice(destRow, sourceRow, lx, lx + xrange + 1, rx + 1);
			//destRow.set(sourceRow.slice(lx, lx + xrange + 1), rx + 1);
			this.copySlice(destRow, sourceRow, rx - xrange, rx + 1, lx - xrange - 1);
			//destRow.set(sourceRow.slice(rx - xrange, rx + 1), lx - xrange - 1);
		}

		// copy top left cells to bottom right border
		// and top right cells to bottom left border
		for (y = 0; y < yrange; y += 1) {
			sourceRow = colourGrid[ty - y];
			destRow = colourGrid[by - y - 1];
			this.copySlice(destRow, sourceRow, lx, lx + xrange + 1, rx + 1);
			//destRow.set(sourceRow.slice(lx, lx + xrange + 1), rx + 1);
			this.copySlice(destRow, sourceRow, rx - xrange, rx + 1, lx - xrange - 1);
			//destRow.set(sourceRow.slice(rx - xrange, rx + 1), lx - xrange - 1);
		}
	};

	// clear the outside the bounded grid
	HROT.prototype.clearHROTOutside = function(/** @type {number} */ lx, /** @type {number} */ by, /** @type {number} */ rx, /** @type {number} */ ty) {
		var	/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Uint8Array} */ destRow = null,
			/** @const {number} */ xrange = this.xrange,
			/** @const {number} */ yrange = this.yrange,
			/** @type {number} */ y = 0;

		// clear the top border
		for (y = 0; y < yrange; y += 1) {
			colourGrid[ty + y + 1].fill(0, lx, rx + 1);
		}

		// clear the bottom border
		for (y = 0; y < yrange; y += 1) {
			colourGrid[by - y - 1].fill(0, lx, rx + 1);
		}

		// clear the left and right columns
		for (y = by; y <= ty; y += 1) {
			destRow = colourGrid[y];
			destRow.fill(0, rx + 1, rx + xrange + 2);
			destRow.fill(0, lx - xrange - 1, lx);
		}

		// clear top right border
		// and top left border
		for (y = 0; y < yrange; y += 1) {
			destRow = colourGrid[ty + y + 1];
			destRow.fill(0, rx + 1, rx + xrange + 2);
			destRow.fill(0, lx - xrange - 1, lx);
		}

		// clear bottom right border
		// and bottom left border
		for (y = 0; y < yrange; y += 1) {
			destRow = colourGrid[by - y - 1];
			destRow.fill(0, rx + 1, rx + xrange + 2);
			destRow.fill(0, lx - xrange - 1, lx);
		}
	};

	// update the life grid region using computed counts (non-deterministic version)
	HROT.prototype.updateGridFromCountsHROTRandom = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {boolean} */ useAlternate) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ count = 0,
			/** @type {boolean} */ rowAlive = false,
			/** @type {boolean} */ liveRowAlive = false,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Array<Uint16Array>} */ colourTileHistoryGrid = this.engine.colourTileHistoryGrid,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint16Array} */ colourTileRow = null,
			// bounding box for any cell
			/** @type {number} */ minX = this.engine.width,
			/** @type {number} */ maxX = 0,
			/** @type {number} */ minY = this.engine.height,
			/** @type {number} */ maxY = 0,
			// bounding box for alive cells (used for fit zoom)
			/** @type {number} */ minX1 = minX,
			/** @type {number} */ maxX1 = maxX,
			/** @type {number} */ minY1 = minY,
			/** @type {number} */ maxY1 = maxY,
			/** @type {BoundingBox} */ zoomBox = this.engine.zoomBox,
			/** @type {BoundingBox} */ HROTBox = this.engine.HROTBox,
			/** @const {number} */ xrange = this.xrange,
			/** @const {number} */ yrange = this.yrange,
			/** @type {Uint8Array} */ birthList = useAlternate ? this.altBirths : this.births,
			/** @type {Uint8Array} */ survivalList = useAlternate ? this.altSurvivals : this.survivals,
			/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @const {number} */ maxGeneration = this.scount - 1,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @const {number} */ deadMin = LifeConstants.deadMin,
			/** @type {number} */ aliveIndex = 0,
			/** @type {Uint16Array} */ colourLookup = this.engine.colourLookup16,
			/** @type {Random} */ myRand = this.myRand,
			/** @type {Float32Array} */ birthChances = this.birthChances,
			/** @type {Float32Array} */ survivalChances = this.survivalChances,
			/** @type {Float32Array} */ immunityChances = this.immunityChances,

			// maximum generations state
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,

			// maximum dead state number
			/** @const {number} */ deadState = this.engine.historyStates,

			// minimum dead state number
			/** @const {number} */ minDeadState = (this.engine.historyStates > 0 ? 1 : 0);

		// compute next generation
		population = 0;
		births = 0;
		deaths = 0;
		if (maxGeneration === 1) {
			// 2 state version
			for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				liveRowAlive = false;
				for (x = leftX - xrange; x <= rightX + xrange; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					aliveIndex = 0;
					if (state < aliveStart) {
						// this cell is dead
						if (count >= 0 && birthList[count] === 1) {
							if (myRand.random() >= birthChances[count]) {
								// new cell is born
								births += 1;
								aliveIndex = 128;
							}
						}
					} else {
						// this cell is alive
						if (count >= 0 && survivalList[count] === 0) {
							// check for immunity
							if (myRand.random() >= immunityChances[count]) {
								// this cell survives
								aliveIndex = 128;
							} else {
								deaths += 1;
							}
						} else {
							// cell survives
							if (myRand.random() >= survivalChances[count]) {
								// this cell survives
								aliveIndex = 128;
							} else {
								// cell dies
								deaths += 1; 
							}
						}
					}

					state = colourLookup[state + aliveIndex];
					colourRow[x] = state;

					// update bounding box columns
					if (state > deadMin) {
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						if (state >= aliveStart) {
							population += 1;
							if (x < minX1) {
								minX1 = x;
							}
							if (x > maxX1) {
								maxX1 = x;
							}
							liveRowAlive = true;
						}
					}
				}
				if (rowAlive) {
					// if there was an alive or history cell in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
				if (liveRowAlive) {
					// if something was alive in the row then update bounding box rows
					if (y < minY1) {
						minY1 = y;
					}
					if (y > maxY1) {
						maxY1 = y;
					}
				}
			}
		} else {
			// >2 state version
			for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				liveRowAlive = false;
				for (x = leftX - xrange; x <= rightX + xrange; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					if (state <= deadState) {
						// this cell is dead
						if (count >= 0 && birthList[count] === 1) {
							if (myRand.random() >= birthChances[count]) {
								// new cell is born
								state = maxGenState;
								births += 1;
							} else {
								if (state > minDeadState) {
									state -= 1;
								}
							}
						} else {
							if (state > minDeadState) {
								state -= 1;
							}
						}
					} else if (state === maxGenState) {
						// this cell is alive
						if (count < 0 || survivalList[count] === 0) {
							// check for immunity
							if (myRand.random() >= this.immunityChances[(count < 0 ? 0 : count)]) {
								// cell is immune
							} else {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						} else {
							// cell survives
							if (myRand.random() >= this.survivalChances[count < 0 ? 0 : count]) {
								// cell survives
							} else {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						}
					} else {
						// this cell will eventually die
						if (state > minDeadState) {
							state -= 1;
						}
					}

					colourRow[x] = state;

					// update bounding box columns
					if (state > 0) {
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						if (state === maxGenState) {
							population += 1;
						}
						if (state > deadState) {
							if (x < minX1) {
								minX1 = x;
							}
							if (x > maxX1) {
								maxX1 = x;
							}
							liveRowAlive = true;
						}
					}
				}
				if (rowAlive) {
					// if there was an alive or history cell in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
				// if something was alive in the row then update bounding box rows
				if (liveRowAlive) {
					if (y < minY1) {
						minY1 = y;
					}
					if (y > maxY1) {
						maxY1 = y;
					}
				}
			}
		}

		// save population and bounding box
		this.engine.population = population;
		this.engine.births = births;
		this.engine.deaths = deaths;

		// don't update bounding box if zero population
		if (population > 0) {
			zoomBox.leftX = minX;
			zoomBox.rightX = maxX;
			zoomBox.bottomY = minY;
			zoomBox.topY = maxY;
			HROTBox.leftX = minX1;
			HROTBox.rightX = maxX1;
			HROTBox.bottomY = minY1;
			HROTBox.topY = maxY1;
		}
	};

	// update the life grid region using computed counts (deterministic version)
	HROT.prototype.updateGridFromCountsHROTNormal = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {boolean} */ useAlternate) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ count = 0,
			/** @type {boolean} */ rowAlive = false,
			/** @type {boolean} */ liveRowAlive = false,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Array<Uint16Array>} */ colourTileHistoryGrid = this.engine.colourTileHistoryGrid,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint16Array} */ colourTileRow = null,
			// bounding box for any cell
			/** @type {number} */ minX = this.engine.width,
			/** @type {number} */ maxX = 0,
			/** @type {number} */ minY = this.engine.height,
			/** @type {number} */ maxY = 0,
			// bounding box for alive cells (used for fit zoom)
			/** @type {number} */ minX1 = minX,
			/** @type {number} */ maxX1 = maxX,
			/** @type {number} */ minY1 = minY,
			/** @type {number} */ maxY1 = maxY,
			/** @type {BoundingBox} */ zoomBox = this.engine.zoomBox,
			/** @type {BoundingBox} */ HROTBox = this.engine.HROTBox,
			/** @const {number} */ xrange = this.xrange,
			/** @const {number} */ yrange = this.yrange,
			/** @type {Uint8Array} */ birthList = useAlternate ? this.altBirths : this.births,
			/** @type {Uint8Array} */ survivalList = useAlternate ? this.altSurvivals : this.survivals,
			/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @const {number} */ maxGeneration = this.scount - 1,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @const {number} */ deadMin = LifeConstants.deadMin,
			/** @type {number} */ aliveIndex = 0,
			/** @type {Uint16Array} */ colourLookup = this.engine.colourLookup16,

			// maximum generations state
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,

			// maximum dead state number
			/** @const {number} */ deadState = this.engine.historyStates,

			// minimum dead state number
			/** @const {number} */ minDeadState = (this.engine.historyStates > 0 ? 1 : 0);

		// compute next generation
		population = 0;
		births = 0;
		deaths = 0;
		if (maxGeneration === 1) {
			// 2 state version
			for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				liveRowAlive = false;
				for (x = leftX - xrange; x <= rightX + xrange; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					aliveIndex = 0;
					if (state < aliveStart) {
						// this cell is dead
						if (count >= 0 && birthList[count] === 1) {
							// new cell is born
							births += 1;
							aliveIndex = 128;
						}
					} else {
						// this cell is alive
						if (count >= 0 && survivalList[count] === 0) {
							// cell does not survive
							deaths += 1;
						} else {
							// cell survives
							aliveIndex = 128;
						}
					}

					state = colourLookup[state + aliveIndex];
					colourRow[x] = state;

					// update bounding box columns
					if (state > deadMin) {
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						if (state >= aliveStart) {
							population += 1;
							if (x < minX1) {
								minX1 = x;
							}
							if (x > maxX1) {
								maxX1 = x;
							}
							liveRowAlive = true;
						}
					}
				}
				if (rowAlive) {
					// if there was an alive or history cell in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
				if (liveRowAlive) {
					// if something was alive in the row then update bounding box rows
					if (y < minY1) {
						minY1 = y;
					}
					if (y > maxY1) {
						maxY1 = y;
					}
				}
			}
		} else {
			// >2 state version
			for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				liveRowAlive = false;
				for (x = leftX - xrange; x <= rightX + xrange; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					if (state <= deadState) {
						// this cell is dead
						if (count >= 0 && birthList[count] === 1) {
							// new cell is born
							state = maxGenState;
							births += 1;
						} else {
							if (state > minDeadState) {
								state -= 1;
							}
						}
					} else if (state === maxGenState) {
						// this cell is alive
						if (count < 0 || survivalList[count] === 0) {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// this cell will eventually die
						if (state > minDeadState) {
							state -= 1;
						}
					}

					colourRow[x] = state;

					// update bounding box columns
					if (state > 0) {
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						if (state === maxGenState) {
							population += 1;
						}
						if (state > deadState) {
							if (x < minX1) {
								minX1 = x;
							}
							if (x > maxX1) {
								maxX1 = x;
							}
							liveRowAlive = true;
						}
					}
				}
				if (rowAlive) {
					// if there was an alive or history cell in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
				// if something was alive in the row then update bounding box rows
				if (liveRowAlive) {
					if (y < minY1) {
						minY1 = y;
					}
					if (y > maxY1) {
						maxY1 = y;
					}
				}
			}
		}

		// save population and bounding box
		this.engine.population = population;
		this.engine.births = births;
		this.engine.deaths = deaths;

		// don't update bounding box if zero population
		if (population > 0) {
			zoomBox.leftX = minX;
			zoomBox.rightX = maxX;
			zoomBox.bottomY = minY;
			zoomBox.topY = maxY;
			HROTBox.leftX = minX1;
			HROTBox.rightX = maxX1;
			HROTBox.bottomY = minY1;
			HROTBox.topY = maxY1;
		}
	};

	// update the life grid region using computed counts
	HROT.prototype.updateGridFromCountsHROT = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {boolean} */ useAlternate) {
		if (this.useRandom) {
			this.updateGridFromCountsHROTRandom(leftX, bottomY, rightX, topY, useAlternate);
		} else {
			this.updateGridFromCountsHROTNormal(leftX, bottomY, rightX, topY, useAlternate);
		}
	};

	// weighted generations neighbourhood optimized range 1 version
	HROT.prototype.nextGenerationWeightedGenerations = function(/** @type{number} */ bottomY, /** @type{number} */ topY, /** @type{number} */ leftX, /** @type{number} */ rightX, /** @type{number} */ range) {
		var	/** @type {number} */ y,
			/** @type {number} */ x,
			/** @type {number} */ xm1,
			/** @type {number} */ xp1,
			/** @type {number} */ count,
			/** @type {number} */ state,
			/** @const {number} */ mgsp1 = this.engine.multiNumStates + this.engine.historyStates,
			/** @const {number} */ deadState = this.engine.historyStates,
			/** @type {Int8Array} */ weightedNeighbourhood = this.weightedNeighbourhood,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ weightedStates = this.weightedStates,
			/** @const {number} */ deadWeight = weightedStates[0],
			/** @const {number} */ w0 = weightedNeighbourhood[0],
			/** @const {number} */ w1 = weightedNeighbourhood[1],
			/** @const {number} */ w2 = weightedNeighbourhood[2],
			/** @const {number} */ w3 = weightedNeighbourhood[3],
			/** @const {number} */ w4 = weightedNeighbourhood[4],
			/** @const {number} */ w5 = weightedNeighbourhood[5],
			/** @const {number} */ w6 = weightedNeighbourhood[6],
			/** @const {number} */ w7 = weightedNeighbourhood[7],
			/** @const {number} */ w8 = weightedNeighbourhood[8];

		for (y = bottomY - range; y <= topY + range; y += 1) {
			countRow = counts[y];
			x = leftX - range;
			xm1 = x - 1;
			xp1 = x + 1;
			while (x <= rightX + range) {
				count = 0;
				colourRow = colourGrid[y - 1];
				state = colourRow[xm1];
				if (state > deadState) {
					count += w0 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w0 * deadWeight;
					}
				}
				state = colourRow[x];
				if (state > deadState) {
					count += w1 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w1 * deadWeight;
					}
				}
				state = colourRow[xp1];
				if (state > deadState) {
					count += w2 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w2 * deadWeight;
					}
				}
				colourRow = colourGrid[y];
				state = colourRow[xm1];
				if (state > deadState) {
					count += w3 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w3 * deadWeight;
					}
				}
				state = colourRow[x];
				if (state > deadState) {
					count += w4 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w4 * deadWeight;
					}
				}
				state = colourRow[xp1];
				if (state > deadState) {
					count += w5 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w5 * deadWeight;
					}
				}
				colourRow = colourGrid[y + 1];
				state = colourRow[xm1];
				if (state > deadState) {
					count += w6 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w6 * deadWeight;
					}
				}
				state = colourRow[x];
				if (state > deadState) {
					count += w7 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w7 * deadWeight;
					}
				}
				state = colourRow[xp1];
				if (state > deadState) {
					count += w8 * weightedStates[mgsp1 - state];
				} else {
					if (deadWeight > 0) {
						count += w8 * deadWeight;
					}
				}
				countRow[x] = count;
				x += 1;
				xm1 += 1;
				xp1 += 1;
			}
		}
	};

	// weighted neighbourhood optimized range 1 version
	HROT.prototype.nextGenerationWeighted2R1 = function(/** @type{number} */ bottomY, /** @type{number} */ topY, /** @type{number} */ leftX, /** @type{number} */ rightX, /** @type{number} */ range) {
		var	/** @type {number} */ y,
			/** @type {number} */ x,
			/** @type {number} */ xm1,
			/** @type {number} */ xp1,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int8Array} */ weightedNeighbourhood = this.weightedNeighbourhood,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {Int32Array} */ countRow = null,
			/** @const {number} */ w0 = weightedNeighbourhood[0],
			/** @const {number} */ w1 = weightedNeighbourhood[1],
			/** @const {number} */ w2 = weightedNeighbourhood[2],
			/** @const {number} */ w3 = weightedNeighbourhood[3],
			/** @const {number} */ w4 = weightedNeighbourhood[4],
			/** @const {number} */ w5 = weightedNeighbourhood[5],
			/** @const {number} */ w6 = weightedNeighbourhood[6],
			/** @const {number} */ w7 = weightedNeighbourhood[7],
			/** @const {number} */ w8 = weightedNeighbourhood[8];

		for (y = bottomY - range; y <= topY + range; y += 1) {
			countRow = counts[y];
			x = leftX - range;
			xm1 = x - 1;
			xp1 = x + 1;
			while (x <= rightX + range) {
				count = 0;
				colourRow = colourGrid[y - 1];
				if (colourRow[xm1] >= aliveStart) {
					count += w0;
				}
				if (colourRow[x] >= aliveStart) {
					count += w1;
				}
				if (colourRow[xp1] >= aliveStart) {
					count += w2;
				}
				colourRow = colourGrid[y];
				if (colourRow[xm1] >= aliveStart) {
					count += w3;
				}
				if (colourRow[x] >= aliveStart) {
					count += w4;
				}
				if (colourRow[xp1] >= aliveStart) {
					count += w5;
				}
				colourRow = colourGrid[y + 1];
				if (colourRow[xm1] >= aliveStart) {
					count += w6;
				}
				if (colourRow[x] >= aliveStart) {
					count += w7;
				}
				if (colourRow[xp1] >= aliveStart) {
					count += w8;
				}
				countRow[x] = count;
				x += 1;
				xm1 += 1;
				xp1 += 1;
			}
		}
	};

	// 2-state corner/edge
	HROT.prototype.nextGenerationCornerEdge2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @const {number} */ cornerRange = this.cornerRange,
			/** @const {number} */ edgeRange = this.edgeRange,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// corner/edge
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;

				// corners
				colourRow = colourGrid[y - cornerRange];
				if (colourRow[x - cornerRange] >= aliveStart) {
					count += 1;
				}
				if (colourRow[x + cornerRange] >= aliveStart) {
					count += 1;
				}
				colourRow = colourGrid[y + cornerRange];
				if (colourRow[x - cornerRange] >= aliveStart) {
					count += 1;
				}
				if (colourRow[x + cornerRange] >= aliveStart) {
					count += 1;
				}

				// edges
				if (colourGrid[y - edgeRange][x] >= aliveStart) {
					count += 1;
				}
				if (colourGrid[y + edgeRange][x] >= aliveStart) {
					count += 1;
				}
				colourRow = colourGrid[y];
				if (colourRow[x - edgeRange] >= aliveStart) {
					count += 1;
				}
				if (colourRow[x + edgeRange] >= aliveStart) {
					count += 1;
				}

				// survival
				if (colourRow[x] >= aliveStart) {
					count += 1;
				}

				// save count
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// 2-state asterisk
	HROT.prototype.nextGenerationAsterisk2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// asterisk
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x + j] >= aliveStart) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				for (i = -xrange; i <= xrange; i += 1) {
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
				for (j = 1; j <= xrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x + j] >= aliveStart) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// 2-state tripod
	HROT.prototype.nextGenerationTripod2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// tripod
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				for (i = -xrange; i <= 0; i += 1) {
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
				for (j = 1; j <= xrange; j += 1) {
					if (colourGrid[y + j][x + j] >= aliveStart) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// 2-state weighted
	HROT.prototype.nextGenerationWeighted2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ k,
			/** @type {number} */ l,
			/** @type {number} */ deadWeight,
			/** @type {number} */ aliveWeight,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// weighted
		if (this.weightedStates === null) {
			// no weighted states
			if (xrange === 1 && yrange === 1 && !this.isTriangular) {
				this.nextGenerationWeighted2R1(bottomY, topY, leftX, rightX, xrange);
			} else {
				for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
					countRow = counts[y];
					x = leftX - xrange;
					while (x <= rightX + xrange) {
						if (this.isTriangular && (((x + y) & 1) !== 0)) {
							l = -(xrange + xrange + 1);
							k = this.weightedNeighbourhood.length + l;
							l += l;
						} else {
							k = 0;
							l = 0;
						}
						count = 0;
						for (j = -yrange; j <= yrange; j += 1) {
							colourRow = colourGrid[y + j];
							for (i = -xrange; i <= xrange; i += 1) {
								if (colourRow[x + i] >= aliveStart) {
									count += this.weightedNeighbourhood[k];
								}
								k += 1;
							}
							k += l;
						}
						countRow[x] = count;
						x += 1;
					}
				}
			}
		} else {
			// weighted states
			deadWeight = this.weightedStates[0];
			aliveWeight = this.weightedStates[1];
			for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
				countRow = counts[y];
				x = leftX - xrange;
				while (x <= rightX + xrange) {
					if (this.isTriangular && (((x + y) & 1) !== 0)) {
						l = -(xrange + xrange + 1);
						k = this.weightedNeighbourhood.length + l;
						l += l;
					} else {
						k = 0;
						l = 0;
					}
					count = 0;
					for (j = -yrange; j <= yrange; j += 1) {
						colourRow = colourGrid[y + j];
						for (i = -xrange; i <= xrange; i += 1) {
							if (colourRow[x + i] >= aliveStart) {
								count += this.weightedNeighbourhood[k] * aliveWeight;
							} else {
								count += this.weightedNeighbourhood[k] * deadWeight;
							}
							k += 1;
						}
						k += l;
					}
					countRow[x] = count;
					x += 1;
				}
			}
		}
	};

	// 2-state custom
	HROT.prototype.nextGenerationCustom2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ k,
			/** @type {number} */ l,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int16Array} */ neighbourList = this.neighbourList,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// custom
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				j = 0;
				while (j < neighbourList.length) {
					// get the row number
					i = neighbourList[j];
					if (this.isTriangular && (((x + y) & 1) === 0)) {
						i = -i;
					}
					j += 1;
					colourRow = colourGrid[y + i];

					// get the count of items in the row
					k = neighbourList[j];
					j += 1;
					for (l = j; l < j + k; l += 1) {
						if (colourRow[x + neighbourList[l]] >= aliveStart) {
							count += 1;
						}
					}
					j += k;
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// 2-state hash
	HROT.prototype.nextGenerationHash2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ rowCount,
			/** @type {number} */ rowCount2,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// hash
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell count the entire neighbourhood
			count = 0;
			rowCount = 0;
			rowCount2 = 0;
			for (j = -yrange; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				if (j === 1) {
					for (i = -xrange; i <= xrange; i += 1) {
						if (colourRow[x + i] >= aliveStart) {
							rowCount += 1;
						}
					}
				} else {
					if (j === -1) {
						for (i = -xrange; i <= xrange; i += 1) {
							if (colourRow[x + i] >= aliveStart) {
								rowCount2 += 1;
							}
						}
					} else {
						if (colourRow[x - 1] >= aliveStart) {
							count += 1;
						}
						if (colourRow[x + 1] >= aliveStart) {
							count += 1;
						}
					}
				}
			}
			if (colourGrid[y][x] >= aliveStart) {
				count += 1;
			}
			countRow[x] = count + rowCount + rowCount2;
			x += 1;

			// handle remaining rows
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (j === 1) {
						if (colourRow[x - xrange - 1] >= aliveStart) {
							rowCount -= 1;
						}
						if (colourRow[x + xrange] >= aliveStart) {
							rowCount += 1;
						}
					} else {
						if (j === -1) {
							if (colourRow[x - xrange - 1] >= aliveStart) {
								rowCount2 -= 1;
							}
							if (colourRow[x + xrange] >= aliveStart) {
								rowCount2 += 1;
							}
						} else {
							if (colourRow[x - 1] >= aliveStart) {
								count += 1;
							}
							if (colourRow[x + 1] >= aliveStart) {
								count += 1;
							}
						}
					}
				}
				// check for survival
				if (colourGrid[y][x] >= aliveStart) {
					count += 1;
				}
				countRow[x] = count + rowCount + rowCount2;
				x += 1;
			}
		}	
	};

	// 2-state checkerboard or aligned checkerboard
	HROT.prototype.nextGenerationCheckerBoth2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange, /** @type {number} */ start) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ count2,
			/** @type {number} */ offset,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// checkerboard
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;

			// for the first two cells in a row count the entire neighbourhood
			count = 0;
			offset = start;
			for (j = -yrange; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				for (i = -xrange + offset; i <= xrange - offset; i += 2) {
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
				offset = 1 - offset;
			}

			// check for survival
			if (start === 1) {
				if (colourGrid[y][x] >= aliveStart) {
					count += 1;
				}
			}
			countRow[x] = count;
			x += 1;

			// check if there are two cells in the row
			if (x <= rightX + xrange) {
				count2 = 0;
				offset = start;
				for (j = -yrange; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					for (i = -xrange + offset; i <= xrange - offset; i += 2) {
						if (colourRow[x + i] >= aliveStart) {
							count2 += 1;
						}
					}
					offset = 1 - offset;
				}

				// check for survival
				if (start === 1) {
					if (colourGrid[y][x] >= aliveStart) {
						count2 += 1;
					}
				}
				countRow[x] = count2;
				x += 1;

				// for the remaining cell pairs on the row subtract the left and add the right cells
				while (x <= rightX + xrange) {
					offset = start;
					for (j = -yrange; j <= yrange; j += 1) {
						colourRow = colourGrid[y + j];
						if (colourRow[x - xrange + offset - 2] >= aliveStart) {
							count -= 1;
						}
						if (colourRow[x + xrange - offset] >= aliveStart) {
							count += 1;
						}
						offset = 1 - offset;
					}

					// check for survival
					if (start === 1) {
						if (colourGrid[y][x - 2] >= aliveStart) {
							count -= 1;
						}
						if (colourGrid[y][x] >= aliveStart) {
							count += 1;
						}
					}
					countRow[x] = count;
					x += 1;

					if (x <= rightX + xrange) {
						offset = start;
						for (j = -yrange; j <= yrange; j += 1) {
							colourRow = colourGrid[y + j];
							if (colourRow[x - xrange + offset - 2] >= aliveStart) {
								count2 -= 1;
							}
							if (colourRow[x + xrange - offset] >= aliveStart) {
								count2 += 1;
							}
							offset = 1 - offset;
						}

						// check for survival
						if (start === 1) {
							if (colourGrid[y][x - 2] >= aliveStart) {
								count2 -= 1;
							}
							if (colourGrid[y][x] >= aliveStart) {
								count2 += 1;
							}
						}
						countRow[x] = count2;
						x += 1;
					}
				}
			}
		}
	};

	// 2-state checkerboard
	HROT.prototype.nextGenerationCheckerboard2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		this.nextGenerationCheckerBoth2(leftX, bottomY, rightX, topY, xrange, yrange, 1);
	};

	// 2-state aligned checkerboard
	HROT.prototype.nextGenerationAlignedCheckerboard2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		this.nextGenerationCheckerBoth2(leftX, bottomY, rightX, topY, xrange, yrange, 0);
	};

	// 2-state hexagonal
	HROT.prototype.nextGenerationHexagonal2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// hexagonal
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell count the entire neighbourhood
			count = 0;
			for (j = -yrange; j < 0; j += 1) {
				colourRow = colourGrid[y + j];
				for (i = -xrange; i <= xrange + j; i += 1) {
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
			}
			for (j = 0; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				for (i = -xrange + j; i <= xrange; i += 1) {
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
			}
			countRow[x] = count;
			x += 1;

			// for the remaining rows subtract the left and add the right cells
			while (x <= rightX + xrange) {
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - xrange - 1] >= aliveStart) {
						count -= 1;
					}
					if (colourRow[x + xrange + j] >= aliveStart) {
						count += 1;
					}
				}
				for (j = 0; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - xrange + j - 1] >= aliveStart) {
						count -= 1;
					}
					if (colourRow[x + xrange] >= aliveStart) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// 2-state saltire
	HROT.prototype.nextGenerationSaltire2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// saltire
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = 1; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - j] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x + j] >= aliveStart) {
						count += 1;
					}
					colourRow = colourGrid[y - j];
					if (colourRow[x - j] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x + j] >= aliveStart) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				if (colourRow[x] >= aliveStart) {
					count += 1;
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// 2-state star
	HROT.prototype.nextGenerationStar2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// star
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = 1; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - j] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x + j] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					colourRow = colourGrid[y - j];
					if (colourRow[x - j] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x + j] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				for (i = -xrange; i <= xrange; i += 1) {
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// 2-state cross
	HROT.prototype.nextGenerationCross2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ rowCount,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// cross
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell count the entire neighbourhood
			count = 0;
			rowCount = 0;
			for (j = 1; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				if (colourRow[x] >= aliveStart) {
					count += 1;
				}
				colourRow = colourGrid[y - j];
				if (colourRow[x] >= aliveStart) {
					count += 1;
				}
			}
			colourRow = colourGrid[y];
			for (i = -xrange; i <= xrange; i += 1) {
				if (colourRow[x + i] >= aliveStart) {
					rowCount += 1;
				}
			}
			countRow[x] = count + rowCount;
			x += 1;

			// for remaining rows subtract the left and the right cells
			while (x <= rightX + xrange) {
				count = 0;
				for (j = 1; j <= yrange; j += 1) {
					if (colourGrid[y + j][x] >= aliveStart) {
						count += 1;
					}
					if (colourGrid[y - j][x] >= aliveStart) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				if (colourRow[x - xrange - 1] >= aliveStart) {
					rowCount -= 1;
				}
				if (colourRow[x + xrange] >= aliveStart) {
					rowCount += 1;
				}
				countRow[x] = count + rowCount;
				x += 1;
			}
		}	
	};

	// 2-state triangular
	HROT.prototype.nextGenerationTriangular2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ k,
			/** @type {number} */ l,
			/** @type {number} */ count,
			/** @type {number} */ width,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// triangular
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;

			// for the first cell compute the whole neighbourhood
			count = 0;
			k = (x + y) & 1;
			if (k === 0) {
				width = yrange + 1;
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] >= aliveStart) {
							count += 1;
						}
						if (colourRow[x + i + 1] >= aliveStart) {
							count += 1;
						}
					}
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
					width += 1;
				}
				for (j = 0; j <= yrange; j += 1) {
					width -= 1;
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] >= aliveStart) {
							count += 1;
						}
						if (colourRow[x + i + 1] >= aliveStart) {
							count += 1;
						}
					}
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
			} else {
				width = yrange;
				for (j = -yrange; j <= 0; j += 1) {
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] >= aliveStart) {
							count += 1;
						}
						if (colourRow[x + i + 1] >= aliveStart) {
							count += 1;
						}
					}
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
					width += 1;
				}
				for (j = 1; j <= yrange; j += 1) {
					width -= 1;
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] >= aliveStart) {
							count += 1;
						}
						if (colourRow[x + i + 1] >= aliveStart) {
							count += 1;
						}
					}
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
				}
			}
			countRow[x] = count;

			// for the remaining cells compute the edge differences
			x += 1;
			while (x <= rightX + xrange) {
				k = (x + y) & 1;
				if (k === 0) {
					l = yrange;
					for (j = -yrange; j < 0; j += 1) {
						colourRow = colourGrid[y + j];
						if (colourRow[x + l] >= aliveStart) {
							count += 1;
						}
						l += 1;
						if (colourRow[x + l] >= aliveStart) {
							count += 1;
						}
					}

					// j === 0 case
					colourRow = colourGrid[y];
					if (colourRow[x - l - 1] >= aliveStart) {
						count -= 1;
					}
					if (colourRow[x + l] >= aliveStart) {
						count += 1;
					}
					l += 1;

					for (j = 1; j <= yrange; j += 1) {
						l -= 1;
						colourRow = colourGrid[y + j];
						if (colourRow[x - l - 1] >= aliveStart) {
							count -= 1;
						}
						if (colourRow[x - l] >= aliveStart) {
							count -= 1;
						}
					}
				} else {
					l = yrange + 1;
					for (j = -yrange; j < 0; j += 1) {
						colourRow = colourGrid[y + j];
						if (colourRow[x - l - 1] >= aliveStart) {
							count -= 1;
						}
						if (colourRow[x - l] >= aliveStart) {
							count -= 1;
						}
						l += 1;
					}

					// j === 0 case
					l -= 1;
					colourRow = colourGrid[y];
					if (colourRow[x - l - 1] >= aliveStart) {
						count -= 1;
					}
					if (colourRow[x + l] >= aliveStart) {
						count += 1;
					}

					for (j = 1; j <= yrange; j += 1) {
						l -= 1;
						colourRow = colourGrid[y + j];
						if (colourRow[x + l] >= aliveStart) {
							count += 1;
						}
						if (colourRow[x + l + 1] >= aliveStart) {
							count += 1;
						}
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// 2-state gaussian
	HROT.prototype.nextGenerationGaussian2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ inc,
			/** @type {number} */ weight,
			/** @type {number} */ count,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// gaussian
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j < 0; j += 1) {
					inc = j + yrange + 1;
					weight = inc;
					colourRow = colourGrid[y + j];
					for (i = -xrange; i <= 0; i += 1) {
						if (colourRow[x + i] >= aliveStart) {
							count += weight;
						}
						weight += inc;
					}
					weight -= inc + inc;
					for (i = 1; i <= xrange; i += 1) {
						if (colourRow[x + i] >= aliveStart) {
							count += weight;
						}
						weight -= inc;
					}
					inc = j + yrange + 1;
					weight = inc;
					colourRow = colourGrid[y - j];
					for (i = -xrange; i <= 0; i += 1) {
						if (colourRow[x + i] >= aliveStart) {
							count += weight;
						}
						weight += inc;
					}
					weight -= inc + inc;
					for (i = 1; i <= xrange; i += 1) {
						if (colourRow[x + i] >= aliveStart) {
							count += weight;
						}
						weight -= inc;
					}
				}
				inc = xrange + 1;
				weight = inc;
				colourRow = colourGrid[y];
				for (i = -xrange; i <= 0; i += 1) {
					if (colourRow[x + i] >= aliveStart) {
						count += weight;
					}
					weight += inc;
				}
				weight -= inc + inc;
				for (i = 1; i <= xrange; i += 1) {
					if (colourRow[x + i] >= aliveStart) {
						count += weight;
					}
					weight -= inc;
				}
				if (colourRow[x] >= aliveStart) {
					count += 1;
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// 2-state shaped
	HROT.prototype.nextGenerationShaped2 = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ width,
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @type {Uint32Array} */ widths = this.widths,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// L2, circular, or short range von Neumann
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell in the row count the entire neighborhood
			count = 0;
			for (j = -yrange; j <= yrange; j += 1) {
				width = widths[j + yrange];
				colourRow = colourGrid[y + j];
				for (i = -width; i < width; i += 2) {
					if (colourRow[x + i] >= aliveStart) {
						count += 1;
					}
					if (colourRow[x + i + 1] >= aliveStart) {
						count += 1;
					}
				}
				if (colourRow[x + i] >= aliveStart) {
					count += 1;
				}
			}
			countRow[x] = count;
			x += 1;

			// for the remaining rows subtract the left and add the right cells
			while (x <= rightX + xrange) {
				for (j = -yrange; j <= yrange; j += 1) {
					width = widths[j + yrange];
					colourRow = colourGrid[y + j];
					if (colourRow[x - width - 1] >= aliveStart) {
						count -= 1;
					}
					if (colourRow[x + width] >= aliveStart) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// update the life grid region using HROT for 2 state patterns
	HROT.prototype.nextGenerationHROT2 = function(/** @type {boolean} */ useAlternate) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ leftX = this.engine.zoomBox.leftX,
			/** @type {number} */ rightX = this.engine.zoomBox.rightX,
			/** @type {number} */ bottomY = this.engine.zoomBox.bottomY,
			/** @type {number} */ topY = this.engine.zoomBox.topY,
			/** @const {number} */ xrange = this.xrange,
			/** @const {number} */ yrange = this.yrange,
			/** @const {Uint8Array} */ birthList = useAlternate ? this.altBirths : this.births,
			/** @const {Uint8Array} */ survivalList = useAlternate ? this.altSurvivals : this.survivals,
			/** @const {number} */ rx2 = xrange + xrange,
			/** @const {number} */ ry2 = yrange + yrange,
			/** @const {number} */ rxp1 = xrange + 1,
			/** @const {number} */ ryp1 = yrange + 1,
			/** @const {number} */ scount = this.scount,
			/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @const {number} */ type = this.type,
			/** @const {number} */ maxGeneration = scount - 1,
			/** @type {number} */ count = 0,
			/** @type {number} */ minX = this.engine.width,
			/** @type {number} */ maxX = 0,
			/** @type {number} */ minY = this.engine.height,
			/** @type {number} */ maxY = 0,
			/** @type {number} */ minX1 = minX,
			/** @type {number} */ maxX1 = maxX,
			/** @type {number} */ minY1 = minY,
			/** @type {number} */ maxY1 = maxY,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Array<Uint16Array>} */ colourTileHistoryGrid = this.engine.colourTileHistoryGrid,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Int32Array} */ countRowYpr = null,
			/** @type {Int32Array} */ countRowYmrp1 = null,
			/** @type {Uint16Array} */ colourTileRow = null,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Int32Array} */ prevCountRow = null,
			/** @const {number} */ bgWidth = this.engine.boundedGridWidth,
			/** @const {number} */ bgHeight = this.engine.boundedGridHeight,
			/** @type {number} */ gridLeftX = 0,
			/** @type {number} */ gridRightX = 0,
			/** @type {number} */ gridBottomY = 0,
			/** @type {number} */ gridTopY = 0,
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ xpr = 0,
			/** @type {number} */ xmrp1 = 0,
			/** @type {boolean} */ rowAlive = false,
			/** @type {boolean} */ colAlive = false,
			/** @type {boolean} */ liveRowAlive = false,
			/** @type {boolean} */ liveColAlive = false,
			/** @const {number} */ chunk = 8,  // must be the same as the unrolled loop!
			/** @const {number} */ aliveStart = LifeConstants.aliveStart,
			/** @const {number} */ deadMin = LifeConstants.deadMin,
			/** @type {number} */ aliveIndex = 0,
			/** @type {Uint16Array} */ colourLookup = this.engine.colourLookup16,
			/** @type {Uint8Array} */ colUsed = this.colUsed,
			/** @type {number} */ im1 = 0,
			/** @type {number} */ im2 = 0,
			/** @type {number} */ iprm1 = 0,
			/** @type {number} */ imrm1 = 0,
			/** @type {number} */ imrm2 = 0,
			/** @type {number} */ ipminrow = 0,
			/** @type {number} */ ipr = 0,
			/** @type {number} */ jpr = 0,
			/** @type {number} */ jmr = 0,
			/** @type {number} */ jpmincol = 0,
			/** @type {boolean} */ useRandom = this.useRandom,
			/** @type {Random} */ myRand = this.myRand,
			/** @type {Float32Array} */ birthChances = this.birthChances,
			/** @type {Float32Array} */ survivalChances = this.survivalChances,
			/** @type {Float32Array} */ immunityChances = this.immunityChances,
			/** @type {Int32Array} */ countRowIm1 = null,
			/** @type {Int32Array} */ countRowIm2 = null,
			/** @type {Int32Array} */ countRowIpr = null,
			/** @type {Int32Array} */ countRowIprm1 = null,
			/** @type {Int32Array} */ countRowImrm1 = null,
			/** @type {Int32Array} */ countRowImrm2 = null;

		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			// get grid extent
			gridLeftX = Math.round((this.engine.width - bgWidth) / 2);
			gridBottomY = Math.round((this.engine.height - bgHeight) / 2);
			gridRightX = gridLeftX + bgWidth - 1;
			gridTopY = gridBottomY + bgHeight - 1;

			// if B0 then process every cell
			if (birthList[0] === 1) {
				leftX = gridLeftX + xrange;
				rightX = gridRightX - xrange;
				topY = gridTopY - yrange;
				bottomY = gridBottomY + yrange;
			}

			// check if the bounded grid is a torus
			if (this.engine.boundedGridType === 1) {
				// extend range if needed for wrap
				if (leftX - gridLeftX < xrange) {
					rightX = gridRightX;
				}
				if (gridRightX - rightX < xrange) {
					leftX = gridLeftX;
				}
				if (gridTopY - topY < yrange) {
					bottomY = gridBottomY;
				}
				if (bottomY - gridBottomY < yrange) {
					topY = gridTopY;
				}
				this.wrapTorusHROT(gridLeftX, gridBottomY, gridRightX, gridTopY);
			}

			// check if the bounded grid is a plane and there are just 2 states
			if (this.engine.boundedGridType === 0 && maxGeneration === 1) {
				// clear bounded grid cells since they have value 255
				// they will be replaced before rendering
				this.engine.drawBoundedGridBorder(colourGrid, 0);
			}

			// fit to bounded grid
			if (leftX - gridLeftX < xrange) {
				leftX = gridLeftX + xrange;
			}
			if (gridRightX - rightX < xrange) {
				rightX = gridRightX - xrange;
			}
			if (gridTopY - topY < yrange) {
				topY = gridTopY - yrange;
			}
			if (bottomY - gridBottomY < yrange) {
				bottomY = gridBottomY + yrange;
			}

			if (type === this.manager.mooreHROT) {
				leftX -= rx2;
				bottomY -= ry2;
				rightX += rx2;
				topY += ry2;
			} else {
				if (type === this.manager.vonNeumannHROT && xrange > this.rangeVN) {
					leftX -= xrange;
					bottomY -= yrange;
					rightX += xrange;
					topY += yrange;
				}
			}
		}

		// compute counts for given neighborhood
		if (type === this.manager.mooreHROT) {
			// temporarily expand bounding box
			leftX -= rx2;
			bottomY -= ry2;
			rightX += rx2;
			topY += ry2;

			// put zeros in top 2*range rows
			for (y = bottomY; y < bottomY + ry2; y += 1) {
				counts[y].fill(0, leftX, rightX + 1);
			}

			// put zeros in left 2*range columns
			for (y = bottomY + ry2; y <= topY; y += 1) {
				counts[y].fill(0, leftX, leftX + rx2 + 1);
			}

			// calculate cumulative counts for each column
			prevCountRow = counts[bottomY + ry2 - 1];
			for (y = bottomY + ry2; y <= topY; y += 1) {
				countRow = counts[y];
				colourRow = colourGrid[y];
				count = 0;
				x = leftX + rx2;
				while (x + chunk <= rightX) {
					// unrolled loop must match chunk value
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
				}
				while (x <= rightX) {
					if (colourRow[x] >= aliveStart) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
					x += 1;
				}
				prevCountRow = countRow;
			}

			// restore limits
			leftX += xrange;
			bottomY += yrange;
			rightX -= xrange;
			topY -= yrange;

			if (this.engine.boundedGridType !== -1) {
				leftX += rx2;
				bottomY += ry2;
				rightX -= rx2;
				topY -= ry2;
			}

			// calculate final neighborhood counts and update cells

			// process bottom left cell
			state = colourGrid[bottomY][leftX];
			count = counts[bottomY + yrange][leftX + xrange];
			aliveIndex = 0;
			if (state < aliveStart) {
				// this cell is dead
				if (birthList[count] === 1) {
					if (useRandom) {
						if (myRand.random() >= birthChances[count]) {
							// new cell is born
							births += 1;
							aliveIndex = 128;
						}
					} else {
						// new cell is born
						births += 1;
						aliveIndex = 128;
					}
				}
			} else {
				// this cell is alive
				if (survivalList[count] === 0) {
					if (useRandom) {
						// check for immunity
						if (myRand.random() >= immunityChances[count]) {
							// this cell survives
							aliveIndex = 128;
						} else {
							deaths += 1;
						}
					} else {
						// cell dies
						deaths += 1;
					}
				} else {
					// cell survives
					if (useRandom) {
						if (myRand.random() >= survivalChances[count]) {
							// this cell survives
							aliveIndex = 128;
						} else {
							// cell dies
							deaths += 1;
						}
					} else {
						aliveIndex = 128;
					}
				}
			}

			// update the cell
			state = colourLookup[state + aliveIndex];
			colourGrid[bottomY][leftX] = state;
			if (state > deadMin) {
				colUsed[leftX] |= 1;
				minY = bottomY;
				maxY = bottomY;
				colourTileHistoryGrid[bottomY >> 4][leftX >> 8] |= (1 << (~(leftX >> 4) & 15));
				if (state >= aliveStart) {
					population += 1;
					colUsed[leftX] |= 2;
					minY1 = bottomY;
					maxY1 = bottomY;
				}
			}

			// process remainder of bottom row (bottom left cell was done above)
			rowAlive = false;
			liveRowAlive = false;
			countRow = counts[bottomY + yrange];
			prevCountRow = counts[bottomY + yrange];
			colourRow = colourGrid[bottomY];
			colourTileRow = colourTileHistoryGrid[bottomY >> 4];

			// check for non-deterministic algo
			if (useRandom) {
				// non-deterministic version
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRow[x + xrange] - prevCountRow[x - rxp1];
					aliveIndex = 0;
					if (state < aliveStart) {
						// this cell is dead
						if (birthList[count] === 1) {
							if (myRand.random() >= birthChances[count]) {
								// new cell is born
								births += 1;
								aliveIndex = 128;
							}
						}
					} else {
						// this cell is alive
						if (survivalList[count] === 0) {
							// check for immunity
							if (myRand.random() >= immunityChances[count]) {
								// this cell survives
								aliveIndex = 128;
							} else {
								// cell dies
								deaths += 1;
							}
						} else {
							// cell survives
							if (myRand.random() >= survivalChances[count]) {
								// this cell survives
								aliveIndex = 128;
							} else {
								// cell dies
								deaths += 1;
							}
						}
					}

					// update the cell
					state = colourLookup[state + aliveIndex];
					colourRow[x] = state;
					if (state > deadMin) {
						colUsed[x] |= 1;
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (state >= aliveStart) {
							population += 1;
							colUsed[x] |= 2;
							liveRowAlive = true;
						}
					}
				}
			} else {
				// deterministic version
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRow[x + xrange] - prevCountRow[x - rxp1];
					aliveIndex = 0;
					if (state < aliveStart) {
						// this cell is dead
						if (birthList[count] === 1) {
							// new cell is born
							births += 1;
							aliveIndex = 128;
						}
					} else {
						// this cell is alive
						if (survivalList[count] === 0) {
							// cell dies
							deaths += 1;
						} else {
							aliveIndex = 128;
						}
					}

					// update the cell
					state = colourLookup[state + aliveIndex];
					colourRow[x] = state;
					if (state > deadMin) {
						colUsed[x] |= 1;
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (state >= aliveStart) {
							population += 1;
							colUsed[x] |= 2;
							liveRowAlive = true;
						}
					}
				}
			}

			if (rowAlive) {
				minY = bottomY;
				maxY = bottomY;
			}
			if (liveRowAlive) {
				minY1 = bottomY;
				maxY1 = bottomY;
			}

			// process remainder of left column (bottom left cell was done above)
			colAlive = false;
			liveColAlive = false;
			xpr = leftX + xrange;
			for (y = bottomY + 1; y <= topY; y += 1) {
				state = colourGrid[y][leftX];
				count = counts[y + yrange][xpr] - counts[y - ryp1][xpr];
				aliveIndex = 0;
				if (state < aliveStart) {
					// this cell is dead
					if (birthList[count] === 1) {
						if (useRandom) {
							if (myRand.random() >= birthChances[count]) {
								// new cell is born
								births += 1;
								aliveIndex = 128;
							}
						} else {
							// new cell is born
							births += 1;
							aliveIndex = 128;
						}
					}
				} else {
					// this cell is alive
					if (survivalList[count] === 0) {
						if (useRandom) {
							if (myRand.random() >= immunityChances[count]) {
								// this cell survives
								aliveIndex = 128;
							} else {
								deaths += 1;
							}
						} else {
							// cell dies
							deaths += 1;
						}
					} else {
						// cell survives
						if (useRandom) {
							if (myRand.random() >= survivalChances[count]) {
								// this cell survives
								aliveIndex = 128;
							} else {
								// cell dies
								deaths += 1;
							}
						} else {
							aliveIndex = 128;
						}
					}
				}

				// update the cell
				state = colourLookup[state + aliveIndex];
				colourGrid[y][leftX] = state;
				if (state > deadMin) {
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
					colAlive = true;
					colourTileHistoryGrid[y >> 4][leftX >> 8] |= (1 << (~(leftX >> 4) & 15));
					if (state >= aliveStart) {
						population += 1;
						if (y < minY1) {
							minY1 = y;
						}
						if (y > maxY1) {
							maxY1 = y;
						}
						liveColAlive = true;
					}
				}
			}
			if (colAlive) {
				colUsed[leftX] |= 1;
			}
			if (liveColAlive) {
				colUsed[leftX] |= 2;
			}

			// compute the rest of the grid
			for (y = bottomY + 1; y <= topY; y += 1) {
				colourRow = colourGrid[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				countRowYpr = counts[y + yrange];
				countRowYmrp1 = counts[y - ryp1];
				xpr = leftX + 1 + xrange;
				xmrp1 = leftX + 1 - rxp1;
				rowAlive = false;
				liveRowAlive = false;

				// check for non-deterministic algo
				if (useRandom) {
					// non-deterministic version
					for (x = leftX + 1; x <= rightX; x += 1) {
						state = colourRow[x];
						count = countRowYpr[xpr] + 
							countRowYmrp1[xmrp1] -
							countRowYpr[xmrp1] -
							countRowYmrp1[xpr];
						aliveIndex = 0;
						if (state < aliveStart) {
							// this cell is dead
							if (birthList[count] === 1) {
								if (myRand.random() >= birthChances[count]) {
									// new cell is born
									aliveIndex = 128;
									births += 1;
								}
							}
						} else {
							// this cell is alive
							if (survivalList[count] === 0) {
								// check for immunity
								if (myRand.random() >= immunityChances[count]) {
									// this cell survives
									aliveIndex = 128;
								} else {
									// cell dies
									deaths += 1;
								}
							} else {
								// cell survives
								if (myRand.random() >= survivalChances[count]) {
									// this cell survives
									aliveIndex = 128;
								} else {
									// cell dies
									deaths += 1;
								}
							}
						}

						// update the cell
						state = colourLookup[state + aliveIndex];
						colourRow[x] = state;
						if (state > deadMin) {
							rowAlive = true;
							colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
							colUsed[x] |= 1;
							if (state >= aliveStart) {
								population += 1;
								liveRowAlive = true;
								colUsed[x] |= 2;
							}
						}
						xpr += 1;
						xmrp1 += 1;
					}
				} else {
					// deterministic version
					for (x = leftX + 1; x <= rightX; x += 1) {
						state = colourRow[x];
						count = countRowYpr[xpr] + 
							countRowYmrp1[xmrp1] -
							countRowYpr[xmrp1] -
							countRowYmrp1[xpr];
						aliveIndex = 0;
						if (state < aliveStart) {
							// this cell is dead
							if (birthList[count] === 1) {
								// new cell is born
								aliveIndex = 128;
								births += 1;
							}
						} else {
							// this cell is alive
							if (survivalList[count] === 0) {
								// cell dies
								deaths += 1;
							} else {
								aliveIndex = 128;
							}
						}

						// update the cell
						state = colourLookup[state + aliveIndex];
						colourRow[x] = state;
						if (state > deadMin) {
							rowAlive = true;
							colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
							colUsed[x] |= 1;
							if (state >= aliveStart) {
								population += 1;
								liveRowAlive = true;
								colUsed[x] |= 2;
							}
						}
						xpr += 1;
						xmrp1 += 1;
					}
				}

				if (rowAlive) {
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
				if (liveRowAlive) {
					if (y < minY1) {
						minY1 = y;
					}
					if (y > maxY1) {
						maxY1 = y;
					}
				}
			}

			// update min and max column from array
			for (x = leftX; x <= rightX; x += 1) {
				if (colUsed[x]) {
					if (x < minX) {
						minX = x;
					}
					if (x > maxX) {
						maxX = x;
					}
					if ((colUsed[x] & 2) !== 0) {
						if (x < minX1) {
							minX1 = x;
						}
						if (x > maxX1) {
							maxX1 = x;
						}
					}
					colUsed[x] = 0;
				}
			}

			// save statistics
			this.engine.population = population;
			this.engine.births = births;
			this.engine.deaths = deaths;

			// don't update bounding box if zero population
			if (population > 0) {
				this.engine.zoomBox.leftX = minX;
				this.engine.zoomBox.rightX = maxX;
				this.engine.zoomBox.bottomY = minY;
				this.engine.zoomBox.topY = maxY;
				this.engine.HROTBox.leftX = minX1;
				this.engine.HROTBox.rightX = maxX1;
				this.engine.HROTBox.bottomY = minY1;
				this.engine.HROTBox.topY = maxY1;
			}
		} else {
			if (type === this.manager.vonNeumannHROT && xrange > this.rangeVN) {
				// set variables to use in getCount
				leftX -= xrange;
				rightX += xrange;
				bottomY -= yrange;
				topY += yrange;
				if (this.engine.boundedGridType === -1) {
					leftX -= xrange;
					rightX += xrange;
					bottomY -= yrange;
					topY += yrange;
				}
				this.nrows = topY - bottomY + 1;
				this.ncols = rightX - leftX + 1;
				this.ccht = (this.nrows + (this.ncols - 1) / 2) | 0;
				this.halfccwd = (this.ncols / 2) | 0;

				// calculate cumulative counts in top left corner of colcounts
				for (i = 0; i < this.ccht; i += 1) {
					countRow = counts[i];
					colourRow = colourGrid[i + bottomY];
					im1 = i - 1;
					im2 = im1 - 1;
					countRowIm1 = counts[im1];
					countRowIm2 = counts[im2];
					for (j = 0; j <= this.ncols; j += 1) {
						countRow[j] = this.getCount2(im1, j - 1, countRowIm1) + this.getCount2(im1, j + 1, countRowIm1) - this.getCount2(im2, j, countRowIm2);
						if (i < this.nrows) {
							if (colourRow[j + leftX] >= aliveStart) {
								countRow[j] += 1;
							}
						}
					}
				}

				// calculate final neighborhood counts and update the corresponding cells in the grid
				for (i = yrange; i <= this.nrows - yrange; i += 1) {
					im1 = i - 1;
					countRowIm1 = counts[im1];
					ipr = i + yrange;
					countRowIpr = counts[ipr];
					iprm1 = ipr - 1;
					countRowIprm1 = counts[iprm1];
					imrm1 = i - yrange - 1;
					countRowImrm1 = counts[imrm1];
					imrm2 = imrm1 - 1;
					countRowImrm2 = counts[imrm2];
					ipminrow = i + bottomY;
					colourRow = colourGrid[ipminrow];
					colourTileRow = colourTileHistoryGrid[ipminrow >> 4];
					rowAlive = false;
					liveRowAlive = false;

					// check for non-deterministic algo
					if (useRandom) {
						// non-deterministic version
						for (j = xrange; j <= this.ncols - xrange; j += 1) {
							jpr = j + xrange;
							jmr = j - xrange;
							count = this.getCount2(ipr , j, countRowIpr)   - this.getCount2(im1 , jpr + 1, countRowIm1) - this.getCount2(im1 , jmr - 1, countRowIm1) + this.getCount2(imrm2 , j, countRowImrm2) +
									this.getCount2(iprm1 , j, countRowIprm1) - this.getCount2(im1 , jpr, countRowIm1)     - this.getCount2(im1 , jmr, countRowIm1)     + this.getCount2(imrm1 , j, countRowImrm1);
							jpmincol = j + leftX;
							state = colourRow[jpmincol];
							aliveIndex = 0;
							if (state < aliveStart) {
								if (birthList[count] === 1) {
									if (myRand.random() >= birthChances[count]) {
										// new cell is born
										aliveIndex = 128;
										births += 1;
									}
								}
							} else {
								// this cell is alive
								if (survivalList[count] === 0) {
									// check for immunity
									if (myRand.random() >= immunityChances[count]) {
										// this cell survives
										aliveIndex = 128;
									} else {
										// cell dies
										deaths += 1;
									}
								} else {
									// cell survivces
									if (myRand.random() >= survivalChances[count]) {
										// this cell survives
										aliveIndex = 128;
									} else {
										// cell dies
										deaths += 1;
									}
								}
							}

							// update the cell
							state = colourLookup[state + aliveIndex];
							colourRow[jpmincol] = state;
							if (state > deadMin) {
								if (jpmincol < minX) {
									minX = jpmincol;
								}
								if (jpmincol > maxX) {
									maxX = jpmincol;
								}
								rowAlive = true;
								colourTileRow[jpmincol >> 8] |= (1 << (~(jpmincol >> 4) & 15));
								if (state >= aliveStart) {
									population += 1;
									liveRowAlive = true;
									if (jpmincol < minX1) {
										minX1 = jpmincol;
									}
									if (jpmincol > maxX1) {
										maxX1 = jpmincol;
									}
								}
							}
						}
					} else {
						// deterministic version
						for (j = xrange; j <= this.ncols - xrange; j += 1) {
							jpr = j + xrange;
							jmr = j - xrange;
							count = this.getCount2(ipr , j, countRowIpr)   - this.getCount2(im1 , jpr + 1, countRowIm1) - this.getCount2(im1 , jmr - 1, countRowIm1) + this.getCount2(imrm2 , j, countRowImrm2) +
									this.getCount2(iprm1 , j, countRowIprm1) - this.getCount2(im1 , jpr, countRowIm1)     - this.getCount2(im1 , jmr, countRowIm1)     + this.getCount2(imrm1 , j, countRowImrm1);
							jpmincol = j + leftX;
							state = colourRow[jpmincol];
							aliveIndex = 0;
							if (state < aliveStart) {
								if (birthList[count] === 1) {
									// new cell is born
									aliveIndex = 128;
									births += 1;
								}
							} else {
								// this cell is alive
								if (survivalList[count] === 0) {
									// cell dies
									deaths += 1;
								} else {
									aliveIndex = 128;
								}
							}

							// update the cell
							state = colourLookup[state + aliveIndex];
							colourRow[jpmincol] = state;
							if (state > deadMin) {
								if (jpmincol < minX) {
									minX = jpmincol;
								}
								if (jpmincol > maxX) {
									maxX = jpmincol;
								}
								rowAlive = true;
								colourTileRow[jpmincol >> 8] |= (1 << (~(jpmincol >> 4) & 15));
								if (state >= aliveStart) {
									population += 1;
									liveRowAlive = true;
									if (jpmincol < minX1) {
										minX1 = jpmincol;
									}
									if (jpmincol > maxX1) {
										maxX1 = jpmincol;
									}
								}
							}
						}
					}

					if (rowAlive) {
						if (ipminrow < minY) {
							minY = ipminrow;
						}
						if (ipminrow > maxY) {
							maxY = ipminrow;
						}
					}
					if (liveRowAlive) {
						if (ipminrow < minY1) {
							minY1 = ipminrow;
						}
						if (ipminrow > maxY1) {
							maxY1 = ipminrow;
						}
					}
				}

				// save statistics
				this.engine.population = population;
				this.engine.births = births;
				this.engine.deaths = deaths;

				// don't update bounding box if zero population
				if (population > 0) {
					this.engine.zoomBox.leftX = minX;
					this.engine.zoomBox.rightX = maxX;
					this.engine.zoomBox.bottomY = minY;
					this.engine.zoomBox.topY = maxY;
					this.engine.HROTBox.leftX = minX1;
					this.engine.HROTBox.rightX = maxX1;
					this.engine.HROTBox.bottomY = minY1;
					this.engine.HROTBox.topY = maxY1;
				}
			} else {
				// determine neighbourhood type
				switch (type) {
					case this.manager.cornerEdgeHROT:
						// corner/edge
						this.nextGenerationCornerEdge2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.asteriskHROT:
						// asterisk
						this.nextGenerationAsterisk2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.tripodHROT:
						// tripod
						this.nextGenerationTripod2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.weightedHROT:
						// weighted
						this.nextGenerationWeighted2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.customHROT:
						// custom
						this.nextGenerationCustom2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.hashHROT:
						// hash
						this.nextGenerationHash2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.checkerHROT:
						// checkerboard
						this.nextGenerationCheckerboard2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.alignedCheckerHROT:
						// aligned checkerboard
						this.nextGenerationAlignedCheckerboard2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.hexHROT:
						// hexagonal
						this.nextGenerationHexagonal2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.saltireHROT:
						// saltire
						this.nextGenerationSaltire2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.starHROT:
						// star
						this.nextGenerationStar2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.crossHROT:
						// cross
						this.nextGenerationCross2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.triangularHROT:
						// triangular
						this.nextGenerationTriangular2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.gaussianHROT:
						// gaussian
						this.nextGenerationGaussian2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					default:
						// L2, circular, or short range von Neumann
						this.nextGenerationShaped2(leftX, bottomY, rightX, topY, xrange, yrange);
						break;
				}
			}
		}

		// adjust range if using bounded grid
		if (this.engine.boundedGridType !== -1) {
			if (leftX < gridLeftX + xrange) {
				leftX = gridLeftX + xrange;
			}
			if (rightX > gridRightX - xrange) {
				rightX = gridRightX - xrange;
			}
			if (bottomY < gridBottomY + yrange) {
				bottomY = gridBottomY + yrange;
			}
			if (topY > gridTopY - yrange) {
				topY = gridTopY - yrange;
			}
		}

		// compute next generation from counts if not Moore which was done above
		if (type !== this.manager.mooreHROT && !(type === this.manager.vonNeumannHROT && xrange > this.rangeVN)) {
			this.updateGridFromCountsHROT(leftX, bottomY, rightX, topY, useAlternate);
		}

		// check if there is a Torus bounded grid
		if (this.engine.boundedGridType === 1) {
			// clear outside
			this.clearHROTOutside(gridLeftX, gridBottomY, gridRightX, gridTopY);
		}
	};

	// n-state corner/edge
	HROT.prototype.nextGenerationCornerEdgeN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @const {number} */ cornerRange = this.cornerRange,
			/** @const {number} */ edgeRange = this.edgeRange,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// corner/edge
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;

				// corners
				colourRow = colourGrid[y - cornerRange];
				if (colourRow[x - cornerRange] === maxGenState) {
					count += 1;
				}
				if (colourRow[x + cornerRange] === maxGenState) {
					count += 1;
				}
				colourRow = colourGrid[y + cornerRange];
				if (colourRow[x - cornerRange] === maxGenState) {
					count += 1;
				}
				if (colourRow[x + cornerRange] === maxGenState) {
					count += 1;
				}

				// edges
				if (colourGrid[y - edgeRange][x] === maxGenState) {
					count += 1;
				}
				if (colourGrid[y + edgeRange][x] === maxGenState) {
					count += 1;
				}
				colourRow = colourGrid[y];
				if (colourRow[x - edgeRange] === maxGenState) {
					count += 1;
				}
				if (colourRow[x + edgeRange] === maxGenState) {
					count += 1;
				}

				if (colourRow[x] === maxGenState) {
					count += 1;
				}

				// save count
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// n-state asterisk
	HROT.prototype.nextGenerationAsteriskN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// asterisk
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x] === maxGenState) {
						count += 1;
					}
					if (colourRow[x + j] === maxGenState) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				for (i = -xrange; i <= xrange; i += 1) {
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
				for (j = 1; j <= xrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x] === maxGenState) {
						count += 1;
					}
					if (colourRow[x + j] === maxGenState) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// n-state tripod
	HROT.prototype.nextGenerationTripodN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// tripod
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x] === maxGenState) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				for (i = -xrange; i <= 0; i += 1) {
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
				for (j = 1; j <= xrange; j += 1) {
					if (colourGrid[y + j][x + j] === maxGenState) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// n-state weighted
	HROT.prototype.nextGenerationWeightedN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ k,
			/** @type {number} */ l,
			/** @type {number} */ deadWeight,
			/** @type {number} */ aliveWeight,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// weighted
		if (this.weightedStates === null) {
			// no weighted states
			for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
				countRow = counts[y];
				x = leftX - xrange;
				while (x <= rightX + xrange) {
					if (this.isTriangular && (((x + y) & 1) !== 0)) {
						l = -(xrange + xrange + 1);
						k = this.weightedNeighbourhood.length + l;
						l += l;
					} else {
						k = 0;
						l = 0;
					}
					count = 0;
					for (j = -yrange; j <= yrange; j += 1) {
						colourRow = colourGrid[y + j];
						for (i = -xrange; i <= xrange; i += 1) {
							if (colourRow[x + i] === maxGenState) {
								count += this.weightedNeighbourhood[k];
							}
							k += 1;
						}
						k += l;
					}
					countRow[x] = count;
					x += 1;
				}
			}
		} else {
			// weighted states
			if (xrange === 1 && yrange === 1 && !this.isTriangular) {
				this.nextGenerationWeightedGenerations(bottomY, topY, leftX, rightX, xrange);
			} else {
				deadWeight = this.weightedStates[0];
				aliveWeight = this.weightedStates[1];
				for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
					countRow = counts[y];
					x = leftX - xrange;
					while (x <= rightX + xrange) {
						if (this.isTriangular && (((x + y) & 1) !== 0)) {
							l = -(xrange + xrange + 1);
							k = this.weightedNeighbourhood.length + l;
							l += l;
						} else {
							k = 0;
							l = 0;
						}
						count = 0;
						for (j = -yrange; j <= yrange; j += 1) {
							colourRow = colourGrid[y + j];
							for (i = -xrange; i <= xrange; i += 1) {
								if (colourRow[x + i] === maxGenState) {
									count += this.weightedNeighbourhood[k] * aliveWeight;
								} else {
									count += this.weightedNeighbourhood[k] * deadWeight;
								}
								k += 1;
							}
							k += l;
						}
						countRow[x] = count;
						x += 1;
					}
				}
			}
		}
	};

	// n-state custom
	HROT.prototype.nextGenerationCustomN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ k,
			/** @type {number} */ l,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int16Array} */ neighbourList = this.neighbourList,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// custom
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				j = 0;
				while (j < neighbourList.length) {
					// get the row number
					i = neighbourList[j];
					if (this.isTriangular && (((x + y) & 1) === 0)) {
						i = -i;
					}
					j += 1;
					colourRow = colourGrid[y + i];

					// get the count of items in the row
					k = neighbourList[j];
					j += 1;
					for (l = j; l < j + k; l += 1) {
						if (colourRow[x + neighbourList[l]] === maxGenState) {
							count += 1;
						}
					}
					j += k;
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// n-state hash
	HROT.prototype.nextGenerationHashN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ rowCount,
			/** @type {number} */ rowCount2,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// hash
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell count the entire neighbourhood
			count = 0;
			rowCount = 0;
			rowCount2 = 0;
			for (j = -yrange; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				if (j === 1) {
					for (i = -xrange; i <= xrange; i += 1) {
						if (colourRow[x + i] === maxGenState) {
							rowCount += 1;
						}
					}
				} else {
					if (j === -1) {
						for (i = -xrange; i <= xrange; i += 1) {
							if (colourRow[x + i] === maxGenState) {
								rowCount2 += 1;
							}
						}
					} else {
						if (colourRow[x - 1] === maxGenState) {
							count += 1;
						}
						if (colourRow[x + 1] === maxGenState) {
							count += 1;
						}
					}
				}
			}
			if (colourGrid[y][x] === maxGenState) {
				count += 1;
			}
			countRow[x] = count + rowCount + rowCount2;
			x += 1;

			// handle remaining rows
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (j === 1) {
						if (colourRow[x - xrange - 1] === maxGenState) {
							rowCount -= 1;
						}
						if (colourRow[x + xrange] === maxGenState) {
							rowCount += 1;
						}
					} else {
						if (j === -1) {
							if (colourRow[x - xrange - 1] === maxGenState) {
								rowCount2 -= 1;
							}
							if (colourRow[x + xrange] === maxGenState) {
								rowCount2 += 1;
							}
						} else {
							if (colourRow[x - 1] === maxGenState) {
								count += 1;
							}
							if (colourRow[x + 1] === maxGenState) {
								count += 1;
							}
						}
					}
				}
				// check for survival
				if (colourGrid[y][x] === maxGenState) {
					count += 1;
				}
				countRow[x] = count + rowCount + rowCount2;
				x += 1;
			}
		}	
	};

	// n-state checkerboard or aligned checkerboard
	HROT.prototype.nextGenerationCheckerBothN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange, /** @type {number} */ start) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ count2,
			/** @type {number} */ offset,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// checkerboard
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;

			// for the first two cells in a row count the entire neighbourhood
			count = 0;
			offset = start;
			for (j = -yrange; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				for (i = -xrange + offset; i <= xrange - offset; i += 2) {
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
				offset = 1 - offset;
			}

			// check for survival
			if (start === 1) {
				if (colourGrid[y][x] === maxGenState) {
					count += 1;
				}
			}
			countRow[x] = count;
			x += 1;

			// check if there are two cells in the row
			if (x <= rightX + xrange) {
				count2 = 0;
				offset = start;
				for (j = -yrange; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					for (i = -xrange + offset; i <= xrange - offset; i += 2) {
						if (colourRow[x + i] === maxGenState) {
							count2 += 1;
						}
					}
					offset = 1 - offset;
				}

				// check for survival
				if (start === 1) {
					if (colourGrid[y][x] === maxGenState) {
						count2 += 1;
					}
				}
				countRow[x] = count2;
				x += 1;

				// for the remaining cell pairs on the row subtract the left and add the right cells
				while (x <= rightX + xrange) {
					offset = start;
					for (j = -yrange; j <= yrange; j += 1) {
						colourRow = colourGrid[y + j];
						if (colourRow[x - xrange + offset - 2] === maxGenState) {
							count -= 1;
						}
						if (colourRow[x + xrange - offset] === maxGenState) {
							count += 1;
						}
						offset = 1 - offset;
					}

					// check for survival
					if (start === 1) {
						if (colourGrid[y][x - 2] === maxGenState) {
							count -= 1;
						}
						if (colourGrid[y][x] === maxGenState) {
							count += 1;
						}
					}
					countRow[x] = count;
					x += 1;

					if (x <= rightX + xrange) {
						offset = start;
						for (j = -yrange; j <= yrange; j += 1) {
							colourRow = colourGrid[y + j];
							if (colourRow[x - xrange + offset - 2] === maxGenState) {
								count2 -= 1;
							}
							if (colourRow[x + xrange - offset] === maxGenState) {
								count2 += 1;
							}
							offset = 1 - offset;
						}

						// check for survival
						if (start === 1) {
							if (colourGrid[y][x - 2] === maxGenState) {
								count2 -= 1;
							}
							if (colourGrid[y][x] === maxGenState) {
								count2 += 1;
							}
						}
						countRow[x] = count2;
						x += 1;
					}
				}
			}
		}
	};

	// n-state checkerboard
	HROT.prototype.nextGenerationCheckerboardN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		this.nextGenerationCheckerBothN(leftX, bottomY, rightX, topY, xrange, yrange, 1);
	};

	// n-state aligned checkerboard
	HROT.prototype.nextGenerationAlignedCheckerboardN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		this.nextGenerationCheckerBothN(leftX, bottomY, rightX, topY, xrange, yrange, 0);
	};

	// n-state hexagonal
	HROT.prototype.nextGenerationHexagonalN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// hexagonal
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell count the entire neighbourhood
			count = 0;
			for (j = -yrange; j < 0; j += 1) {
				colourRow = colourGrid[y + j];
				for (i = -xrange; i <= xrange + j; i += 1) {
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
			}
			for (j = 0; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				for (i = -xrange + j; i <= xrange; i += 1) {
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
			}
			countRow[x] = count;
			x += 1;

			// for the remaining rows subtract the left and add the right cells
			while (x <= rightX + xrange) {
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - xrange - 1] === maxGenState) {
						count -= 1;
					}
					if (colourRow[x + xrange + j] === maxGenState) {
						count += 1;
					}
				}
				for (j = 0; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - xrange + j - 1] === maxGenState) {
						count -= 1;
					}
					if (colourRow[x + xrange] === maxGenState) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// n-state saltire
	HROT.prototype.nextGenerationSaltireN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			colourRow = null,
			colourGrid = this.engine.colourGrid;

		// saltire
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = 1; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - j] === maxGenState) {
						count += 1;
					}
					if (colourRow[x + j] === maxGenState) {
						count += 1;
					}
					colourRow = colourGrid[y - j];
					if (colourRow[x - j] === maxGenState) {
						count += 1;
					}
					if (colourRow[x + j] === maxGenState) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				if (colourRow[x] === maxGenState) {
					count += 1;
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// n-state star
	HROT.prototype.nextGenerationStarN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// star
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = 1; j <= yrange; j += 1) {
					colourRow = colourGrid[y + j];
					if (colourRow[x - j] === maxGenState) {
						count += 1;
					}
					if (colourRow[x + j] === maxGenState) {
						count += 1;
					}
					if (colourRow[x] === maxGenState) {
						count += 1;
					}
					colourRow = colourGrid[y - j];
					if (colourRow[x - j] === maxGenState) {
						count += 1;
					}
					if (colourRow[x + j] === maxGenState) {
						count += 1;
					}
					if (colourRow[x] === maxGenState) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				for (i = -xrange; i <= xrange; i += 1) {
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// n-state cross
	HROT.prototype.nextGenerationCrossN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ rowCount,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// cross
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell count the entire neighbourhood
			count = 0;
			rowCount = 0;
			for (j = 1; j <= yrange; j += 1) {
				colourRow = colourGrid[y + j];
				if (colourRow[x] === maxGenState) {
					count += 1;
				}
				colourRow = colourGrid[y - j];
				if (colourRow[x] === maxGenState) {
					count += 1;
				}
			}
			colourRow = colourGrid[y];
			for (i = -xrange; i <= xrange; i += 1) {
				if (colourRow[x + i] === maxGenState) {
					rowCount += 1;
				}
			}
			countRow[x] = count + rowCount;
			x += 1;

			// for remaining rows subtract the left and the right cells
			while (x <= rightX + xrange) {
				count = 0;
				for (j = 1; j <= yrange; j += 1) {
					if (colourGrid[y + j][x] === maxGenState) {
						count += 1;
					}
					if (colourGrid[y - j][x] === maxGenState) {
						count += 1;
					}
				}
				colourRow = colourGrid[y];
				if (colourRow[x - xrange - 1] === maxGenState) {
					rowCount -= 1;
				}
				if (colourRow[x + xrange] === maxGenState) {
					rowCount += 1;
				}
				countRow[x] = count + rowCount;
				x += 1;
			}
		}	
	};

	// n-state triangular
	HROT.prototype.nextGenerationTriangularN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ k,
			/** @type {number} */ l,
			/** @type {number} */ count,
			/** @type {number} */ width,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// triangular
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;

			// for the first cell compute the whole neighbourhood
			count = 0;
			k = (x + y) & 1;
			if (k === 0) {
				width = yrange + 1;
				for (j = -yrange; j < 0; j += 1) {
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] === maxGenState) {
							count += 1;
						}
						if (colourRow[x + i + 1] === maxGenState) {
							count += 1;
						}
					}
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
					width += 1;
				}
				for (j = 0; j <= yrange; j += 1) {
					width -= 1;
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] === maxGenState) {
							count += 1;
						}
						if (colourRow[x + i + 1] === maxGenState) {
							count += 1;
						}
					}
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
			} else {
				width = yrange;
				for (j = -yrange; j <= 0; j += 1) {
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] === maxGenState) {
							count += 1;
						}
						if (colourRow[x + i + 1] === maxGenState) {
							count += 1;
						}
					}
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
					width += 1;
				}
				for (j = 1; j <= yrange; j += 1) {
					width -= 1;
					colourRow = colourGrid[y + j];
					for (i = -width; i < width; i += 2) {
						if (colourRow[x + i] === maxGenState) {
							count += 1;
						}
						if (colourRow[x + i + 1] === maxGenState) {
							count += 1;
						}
					}
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
				}
			}
			countRow[x] = count;

			// for the remaining cells compute the edge differences
			x += 1;
			while (x <= rightX + xrange) {
				k = (x + y) & 1;
				if (k === 0) {
					l = yrange;
					for (j = -yrange; j < 0; j += 1) {
						colourRow = colourGrid[y + j];
						if (colourRow[x + l] === maxGenState) {
							count += 1;
						}
						l += 1;
						if (colourRow[x + l] === maxGenState) {
							count += 1;
						}
					}

					// j === 0 case
					colourRow = colourGrid[y];
					if (colourRow[x - l - 1] === maxGenState) {
						count -= 1;
					}
					if (colourRow[x + l] === maxGenState) {
						count += 1;
					}
					l += 1;

					for (j = 1; j <= yrange; j += 1) {
						l -= 1;
						colourRow = colourGrid[y + j];
						if (colourRow[x - l - 1] === maxGenState) {
							count -= 1;
						}
						if (colourRow[x - l] === maxGenState) {
							count -= 1;
						}
					}
				} else {
					l = yrange + 1;
					for (j = -yrange; j < 0; j += 1) {
						colourRow = colourGrid[y + j];
						if (colourRow[x - l - 1] === maxGenState) {
							count -= 1;
						}
						if (colourRow[x - l] === maxGenState) {
							count -= 1;
						}
						l += 1;
					}

					// j === 0 case
					l -= 1;
					colourRow = colourGrid[y];
					if (colourRow[x - l - 1] === maxGenState) {
						count -= 1;
					}
					if (colourRow[x + l] === maxGenState) {
						count += 1;
					}

					for (j = 1; j <= yrange; j += 1) {
						l -= 1;
						colourRow = colourGrid[y + j];
						if (colourRow[x + l] === maxGenState) {
							count += 1;
						}
						if (colourRow[x + l + 1] === maxGenState) {
							count += 1;
						}
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// n-state gaussian
	HROT.prototype.nextGenerationGaussianN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ inc,
			/** @type {number} */ weight,
			/** @type {number} */ count,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// gaussian
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			while (x <= rightX + xrange) {
				count = 0;
				for (j = -yrange; j < 0; j += 1) {
					inc = j + yrange + 1;
					weight = inc;
					colourRow = colourGrid[y + j];
					for (i = -xrange; i <= 0; i += 1) {
						if (colourRow[x + i] === maxGenState) {
							count += weight;
						}
						weight += inc;
					}
					weight -= inc + inc;
					for (i = 1; i <= xrange; i += 1) {
						if (colourRow[x + i] === maxGenState) {
							count += weight;
						}
						weight -= inc;
					}
					inc = j + yrange + 1;
					weight = inc;
					colourRow = colourGrid[y - j];
					for (i = -xrange; i <= 0; i += 1) {
						if (colourRow[x + i] === maxGenState) {
							count += weight;
						}
						weight += inc;
					}
					weight -= inc + inc;
					for (i = 1; i <= xrange; i += 1) {
						if (colourRow[x + i] === maxGenState) {
							count += weight;
						}
						weight -= inc;
					}
				}
				inc = xrange + 1;
				weight = inc;
				colourRow = colourGrid[y];
				for (i = -xrange; i <= 0; i += 1) {
					if (colourRow[x + i] === maxGenState) {
						count += weight;
					}
					weight += inc;
				}
				weight -= inc + inc;
				for (i = 1; i <= xrange; i += 1) {
					if (colourRow[x + i] === maxGenState) {
						count += weight;
					}
					weight -= inc;
				}
				if (colourRow[x] === maxGenState) {
					count += 1;
				}
				countRow[x] = count;
				x += 1;
			}
		}
	};

	// n-state shaped
	HROT.prototype.nextGenerationShapedN = function(/** @type {number} */ leftX, /** @type {number} */ bottomY, /** @type {number} */ rightX, /** @type {number} */ topY, /** @type {number} */ xrange, /** @type {number} */ yrange) {
		var	/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @type {number} */ x,
			/** @type {number} */ y,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {number} */ count,
			/** @type {number} */ width,
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,
			/** @type {Uint32Array} */ widths = this.widths,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid;

		// L2, circular, or short range von Neumann
		for (y = bottomY - yrange; y <= topY + yrange; y += 1) {
			countRow = counts[y];
			x = leftX - xrange;
			// for the first cell in the row count the entire neighborhood
			count = 0;
			for (j = -yrange; j <= yrange; j += 1) {
				width = widths[j + yrange];
				colourRow = colourGrid[y + j];
				for (i = -width; i < width; i += 2) {
					if (colourRow[x + i] === maxGenState) {
						count += 1;
					}
					if (colourRow[x + i + 1] === maxGenState) {
						count += 1;
					}
				}
				if (colourRow[x + i] === maxGenState) {
					count += 1;
				}
			}
			countRow[x] = count;
			x += 1;

			// for the remaining rows subtract the left and add the right cells
			while (x <= rightX + xrange) {
				for (j = -yrange; j <= yrange; j += 1) {
					width = widths[j + yrange];
					colourRow = colourGrid[y + j];
					if (colourRow[x - width - 1] === maxGenState) {
						count -= 1;
					}
					if (colourRow[x + width] === maxGenState) {
						count += 1;
					}
				}
				countRow[x] = count;
				x += 1;
			}
		}	
	};

	// update the life grid region using HROT for >2 state patterns
	HROT.prototype.nextGenerationHROTN = function(/** @type {boolean} */ useAlternate) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ leftX = this.engine.zoomBox.leftX,
			/** @type {number} */ rightX = this.engine.zoomBox.rightX,
			/** @type {number} */ bottomY = this.engine.zoomBox.bottomY,
			/** @type {number} */ topY = this.engine.zoomBox.topY,
			/** @type {number} */ xrange = this.xrange,
			/** @type {number} */ yrange = this.yrange,
			// deal with alternate rules
			/** @type {Uint8Array} */ birthList = useAlternate ? this.altBirths : this.births,
			/** @type {Uint8Array} */ survivalList = useAlternate ? this.altSurvivals : this.survivals,
			/** @const {number} */ rx2 = xrange + xrange,
			/** @const {number} */ ry2 = yrange + yrange,
			/** @const {number} */ rxp1 = xrange + 1,
			/** @const {number} */ ryp1 = yrange + 1,
			/** @type {Array<Int32Array>} */ counts = this.counts,
			/** @const {number} */ type = this.type,
			/** @type {number} */ count = 0,
			/** @type {number} */ minX = this.engine.width,
			/** @type {number} */ maxX = 0,
			/** @type {number} */ minY = this.engine.height,
			/** @type {number} */ maxY = 0,
			/** @type {number} */ minX1 = minX,
			/** @type {number} */ maxX1 = maxX,
			/** @type {number} */ minY1 = minY,
			/** @type {number} */ maxY1 = maxY,
			/** @type {Array<Uint8Array>} */ colourGrid = this.engine.colourGrid,
			/** @type {Array<Uint16Array>} */ colourTileHistoryGrid = this.engine.colourTileHistoryGrid,
			/** @type {Uint8Array} */ colourRow = null,
			/** @type {Int32Array} */ countRowYpr = null,
			/** @type {Int32Array} */ countRowYmrp1 = null,
			/** @type {Uint16Array} */ colourTileRow = null,
			/** @type {Int32Array} */ countRow = null,
			/** @type {Int32Array} */ prevCountRow = null,
			/** @const {number} */ bgWidth = this.engine.boundedGridWidth,
			/** @const {number} */ bgHeight = this.engine.boundedGridHeight,
			/** @type {number} */ gridLeftX = 0,
			/** @type {number} */ gridRightX = 0,
			/** @type {number} */ gridBottomY = 0,
			/** @type {number} */ gridTopY = 0,
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ xpr = 0,
			/** @type {number} */ xmrp1 = 0,
			/** @type {boolean} */ rowAlive = false,
			/** @type {boolean} */ colAlive = false,
			/** @type {boolean} */ liveRowAlive = false,
			/** @type {boolean} */ liveColAlive = false,
			/** @type {number} */ im1 = 0,
			/** @type {number} */ im2 = 0,
			/** @type {number} */ iprm1 = 0,
			/** @type {number} */ imrm1 = 0,
			/** @type {number} */ imrm2 = 0,
			/** @type {number} */ ipminrow = 0,
			/** @type {number} */ ipr = 0,
			/** @type {number} */ jpr = 0,
			/** @type {number} */ jmr = 0,
			/** @type {number} */ jpmincol = 0,
			/** @type {boolean} */ useRandom = this.useRandom,
			/** @type {Random} */ myRand = this.myRand,
			/** @type {Float32Array} */ birthChances = this.birthChances,
			/** @type {Float32Array} */ survivalChances = this.survivalChances,
			/** @type {Float32Array} */ immunityChances = this.immunityChances,

			// maximum generations state
			/** @const {number} */ maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,

			// maximum dead state number
			/** @const {number} */ deadState = this.engine.historyStates,

			// minimum dead state number
			/** @const {number} */ minDeadState = (this.engine.historyStates > 0 ? 1 : 0),
			/** @type {Int32Array} */ countRowIm1 = null,
			/** @type {Int32Array} */ countRowIm2 = null,
			/** @type {Int32Array} */ countRowIpr = null,
			/** @type {Int32Array} */ countRowIprm1 = null,
			/** @type {Int32Array} */ countRowImrm1 = null,
			/** @type {Int32Array} */ countRowImrm2 = null;

		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			// get grid extent
			gridLeftX = Math.round((this.engine.width - bgWidth) / 2);
			gridBottomY = Math.round((this.engine.height - bgHeight) / 2);
			gridRightX = gridLeftX + bgWidth - 1;
			gridTopY = gridBottomY + bgHeight - 1;

			// if B0 then process every cell
			if (birthList[0] === 1) {
				leftX = gridLeftX + xrange;
				rightX = gridRightX - xrange;
				topY = gridTopY - yrange;
				bottomY = gridBottomY + yrange;
			}

			// check if the bounded grid is a torus
			if (this.engine.boundedGridType === 1) {
				// extend range if needed for wrap
				if (leftX - gridLeftX < xrange) {
					rightX = gridRightX;
				}
				if (gridRightX - rightX < xrange) {
					leftX = gridLeftX;
				}
				if (gridTopY - topY < yrange) {
					bottomY = gridBottomY;
				}
				if (bottomY - gridBottomY < yrange) {
					topY = gridTopY;
				}
				this.wrapTorusHROT(gridLeftX, gridBottomY, gridRightX, gridTopY);
			}

			// fit to bounded grid
			if (leftX - gridLeftX < xrange) {
				leftX = gridLeftX + xrange;
			}
			if (gridRightX - rightX < xrange) {
				rightX = gridRightX - xrange;
			}
			if (gridTopY - topY < yrange) {
				topY = gridTopY - yrange;
			}
			if (bottomY - gridBottomY < yrange) {
				bottomY = gridBottomY + yrange;
			}

			if (type === this.manager.mooreHROT) {
				leftX -= rx2;
				bottomY -= ry2;
				rightX += rx2;
				topY += ry2;
			} else {
				if (type === this.manager.vonNeumannHROT && xrange > this.rangeVN) {
					leftX -= xrange;
					bottomY -= yrange;
					rightX += xrange;
					topY += yrange;
				}
			}
		}

		// compute counts for given neighborhood
		if (type === this.manager.mooreHROT) {
			// temporarily expand bounding box
			leftX -= rx2;
			bottomY -= ry2;
			rightX += rx2;
			topY += ry2;

			// put zeros in top 2*range rows
			for (y = bottomY; y < bottomY + ry2; y += 1) {
				counts[y].fill(0, leftX, rightX + 1);
			}

			// put zeros in left 2*range columns
			for (y = bottomY + ry2; y <= topY; y += 1) {
				counts[y].fill(0, leftX, leftX + rx2);
			}

			// calculate cumulative counts for each column
			for (y = bottomY + ry2; y <= topY; y += 1) {
				prevCountRow = counts[y - 1];
				countRow = counts[y];
				colourRow = colourGrid[y];
				count = 0;
				for (x = leftX + rx2; x <= rightX; x += 1) {
					if (colourRow[x] === maxGenState) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
				}
			}

			// restore limits
			leftX += xrange;
			bottomY += yrange;
			rightX -= xrange;
			topY -= yrange;

			if (this.engine.boundedGridType !== -1) {
				leftX += rx2;
				bottomY += ry2;
				rightX -= rx2;
				topY -= ry2;
			}

			// calculate final neighborhood counts and update cells

			// process bottom left cell
			state = colourGrid[bottomY][leftX];
			count = counts[bottomY + yrange][leftX + xrange];
			if (state <= deadState) {
				// this cell is dead
				if (birthList[count] === 1) {
					if (useRandom) {
						if (myRand.random() >= birthChances[count]) {
							// new cell is born
							state = maxGenState;
							births += 1;
						} else {
							if (state > minDeadState) {
								state -= 1;
							}
						}
					} else {
						// new cell is born
						state = maxGenState;
						births += 1;
					}
				} else {
					if (state > minDeadState) {
						state -= 1;
					}
				}
			} else if (state === maxGenState) {
				// this cell is alive
				if (survivalList[count] === 0) {
					if (useRandom) {
						// check for immunity
						if (myRand.random() >= immunityChances[count]) {
							// this cell survives
						} else {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// cell decays by one state
						state -= 1;
						deaths += 1;
					}
				} else {
					if (useRandom) {
						if (myRand.random() >= survivalChances[count]) {
							// this cell survives
						} else {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					}
				}
			} else {
				// this cell will eventually die
				if (state > minDeadState) {
					state -= 1;
				}
			}

			// update the cell
			colourGrid[bottomY][leftX] = state;
			if (state > 0) {
				minX = leftX;
				maxX = leftX;
				minY = bottomY;
				maxY = bottomY;
				colourTileHistoryGrid[bottomY >> 4][leftX >> 8] |= (1 << (~(leftX >> 4) & 15));
				if (state === maxGenState) {
					population += 1;
				}
				if (state > deadState) {
					minX1 = leftX;
					maxX1 = leftX;
					minY1 = bottomY;
					maxY1 = bottomY;
				}
			}

			// process remainder of bottom row (bottom left cell was done above)
			rowAlive = false;
			liveRowAlive = false;
			countRow = counts[bottomY + yrange];
			prevCountRow = counts[bottomY + yrange];
			colourRow = colourGrid[bottomY];
			colourTileRow = colourTileHistoryGrid[bottomY >> 4];

			// check for non-deterministic algo
			if (useRandom) {
				// non-deterministic version
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRow[x + xrange] - prevCountRow[x - rxp1];
					if (state <= deadState) {
						// this cell is dead
						if (birthList[count] === 1) {
							if (myRand.random() >= birthChances[count]) {
								// new cell is born
								state = maxGenState;
								births += 1;
							} else {
								if (state > minDeadState) {
									state -= 1;
								}
							}
						} else {
							if (state > minDeadState) {
								state -= 1;
							}
						}
					} else if (state === maxGenState) {
						// this cell is alive
						if (survivalList[count] === 0) {
							if (myRand.random() >= immunityChances[count]) {
								// cell survivces
							} else {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						} else {
							if (myRand.random() >= survivalChances[count]) {
								// cell survives
							} else {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						}
					} else {
						// this cell will eventually die
						if (state > minDeadState) {
							state -= 1;
						}
					}

					// update the cell
					colourRow[x] = state;
					if (state > 0) {
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (state === maxGenState) {
							population += 1;
						}
						if (state > deadState) {
							if (x < minX1) {
								minX1 = x;
							}
							if (x > maxX1) {
								maxX1 = x;
							}
							liveRowAlive = true;
						}
					}
				}
			} else {
				// deterministic version
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRow[x + xrange] - prevCountRow[x - rxp1];
					if (state <= deadState) {
						// this cell is dead
						if (birthList[count] === 1) {
							// new cell is born
							state = maxGenState;
							births += 1;
						} else {
							if (state > minDeadState) {
								state -= 1;
							}
						}
					} else if (state === maxGenState) {
						// this cell is alive
						if (survivalList[count] === 0) {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// this cell will eventually die
						if (state > minDeadState) {
							state -= 1;
						}
					}

					// update the cell
					colourRow[x] = state;
					if (state > 0) {
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						rowAlive = true;
						colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
						if (state === maxGenState) {
							population += 1;
						}
						if (state > deadState) {
							if (x < minX1) {
								minX1 = x;
							}
							if (x > maxX1) {
								maxX1 = x;
							}
							liveRowAlive = true;
						}
					}
				}
			}

			if (rowAlive) {
				minY = bottomY;
				maxY = bottomY;
			}
			if (liveRowAlive) {
				minY1 = bottomY;
				maxY1 = bottomY;
			}

			// process remainder of left column (bottom left cell was done above)
			colAlive = false;
			liveColAlive = false;
			xpr = leftX + xrange;

			// check for non-deterministic algo
			if (useRandom) {
				// non-determinsitic version
				for (y = bottomY + 1; y <= topY; y += 1) {
					state = colourGrid[y][leftX];
					count = counts[y + yrange][xpr] - counts[y - ryp1][xpr];
					if (state <= deadState) {
						// this cell is dead
						if (birthList[count] === 1) {
							if (myRand.random() >= birthChances[count]) {
								// new cell is born
								state = maxGenState;
								births += 1;
							} else {
								if (state > minDeadState) {
									state -= 1;
								}
							}
						} else {
							if (state > minDeadState) {
								state -= 1;
							}
						}
					} else if (state === maxGenState) {
						// this cell is alive
						if (survivalList[count] === 0) {
							if (myRand.random() >= immunityChances[count]) {
								// cell survives
							} else {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						} else {
							if (myRand.random() >= survivalChances[count]) {
								// cell survives
							} else {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						}
					} else {
						// this cell will eventually die
						if (state > minDeadState) {
							state -= 1;
						}
					}

					// update the cell
					colourGrid[y][leftX] = state;
					if (state > 0) {
						if (y < minY) {
							minY = y;
						}
						if (y > maxY) {
							maxY = y;
						}
						colAlive = true;
						colourTileHistoryGrid[y >> 4][leftX >> 8] |= (1 << (~(leftX >> 4) & 15));
						if (state === maxGenState) {
							population += 1;
						}
						if (state > deadState) {
							if (y < minY1) {
								minY1 = y;
							}
							if (y > maxY1) {
								maxY1 = y;
							}
							liveColAlive = true;
						}
					}
				}
			} else {
				// deterministic version
				for (y = bottomY + 1; y <= topY; y += 1) {
					state = colourGrid[y][leftX];
					count = counts[y + yrange][xpr] - counts[y - ryp1][xpr];
					if (state <= deadState) {
						// this cell is dead
						if (birthList[count] === 1) {
							// new cell is born
							state = maxGenState;
							births += 1;
						} else {
							if (state > minDeadState) {
								state -= 1;
							}
						}
					} else if (state === maxGenState) {
						// this cell is alive
						if (survivalList[count] === 0) {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// this cell will eventually die
						if (state > minDeadState) {
							state -= 1;
						}
					}

					// update the cell
					colourGrid[y][leftX] = state;
					if (state > 0) {
						if (y < minY) {
							minY = y;
						}
						if (y > maxY) {
							maxY = y;
						}
						colAlive = true;
						colourTileHistoryGrid[y >> 4][leftX >> 8] |= (1 << (~(leftX >> 4) & 15));
						if (state === maxGenState) {
							population += 1;
						}
						if (state > deadState) {
							if (y < minY1) {
								minY1 = y;
							}
							if (y > maxY1) {
								maxY1 = y;
							}
							liveColAlive = true;
						}
					}
				}
			}

			if (colAlive) {
				if (leftX < minX) {
					minX = leftX;
				}
				if (leftX > maxX) {
					maxX = leftX;
				}
			}
			if (liveColAlive) {
				if (leftX < minX1) {
					minX1 = leftX;
				}
				if (leftX > maxX1) {
					maxX1 = leftX;
				}
			}

			// compute the rest of the grid
			for (y = bottomY + 1; y <= topY; y += 1) {
				colourRow = colourGrid[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				countRowYpr = counts[y + yrange];
				countRowYmrp1 = counts[y - ryp1];
				rowAlive = false;
				liveRowAlive = false;
				xpr = leftX + 1 + xrange;
				xmrp1 = leftX + 1 - rxp1;

				// check for non-deterministic algo
				if (useRandom) {
					// non-deterministic version
					for (x = leftX + 1; x <= rightX; x += 1) {
						state = colourRow[x];
						count = countRowYpr[xpr] +
							countRowYmrp1[xmrp1] -
							countRowYpr[xmrp1] -
							countRowYmrp1[xpr];
						if (state <= deadState) {
							// this cell is dead
							if (birthList[count] === 1) {
								if (myRand.random() >= birthChances[count]) {
									// new cell is born
									state = maxGenState;
									births += 1;
								} else {
									if (state > minDeadState) {
										state -= 1;
									}
								}
							} else {
								if (state > minDeadState) {
									state -= 1;
								}
							}
						} else if (state === maxGenState) {
							// this cell is alive
							if (survivalList[count] === 0) {
								if (myRand.random() >= immunityChances[count]) {
									// cell survives
								} else {
									// cell decays by one state
									state -= 1;
									deaths += 1;
								}
							} else {
								if (myRand.random() >= survivalChances[count]) {
									// cell survives
								} else {
									// cell decays by one state
									state -= 1;
									deaths += 1;
								}
							}
						} else {
							// this cell will eventually die
							if (state > minDeadState) {
								state -= 1;
							}
						}

						// update the cell
						colourRow[x] = state;
						if (state > 0) {
							colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
							if (x < minX) {
								minX = x;
							}
							if (x > maxX) {
								maxX = x;
							}
							rowAlive = true;
							if (state === maxGenState) {
								population += 1;
							}
							if (state > deadState) {
								liveRowAlive = true;
								if (x < minX1) {
									minX1 = x;
								}
								if (x > maxX1) {
									maxX1 = x;
								}
							}
						}
						xpr += 1;
						xmrp1 += 1;
					}
				} else {
					// deterministic version
					for (x = leftX + 1; x <= rightX; x += 1) {
						state = colourRow[x];
						count = countRowYpr[xpr] +
							countRowYmrp1[xmrp1] -
							countRowYpr[xmrp1] -
							countRowYmrp1[xpr];
						if (state <= deadState) {
							// this cell is dead
							if (birthList[count] === 1) {
								// new cell is born
								state = maxGenState;
								births += 1;
							} else {
								if (state > minDeadState) {
									state -= 1;
								}
							}
						} else if (state === maxGenState) {
							// this cell is alive
							if (survivalList[count] === 0) {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						} else {
							// this cell will eventually die
							if (state > minDeadState) {
								state -= 1;
							}
						}

						// update the cell
						colourRow[x] = state;
						if (state > 0) {
							colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
							if (x < minX) {
								minX = x;
							}
							if (x > maxX) {
								maxX = x;
							}
							rowAlive = true;
							if (state === maxGenState) {
								population += 1;
							}
							if (state > deadState) {
								liveRowAlive = true;
								if (x < minX1) {
									minX1 = x;
								}
								if (x > maxX1) {
									maxX1 = x;
								}
							}
						}
						xpr += 1;
						xmrp1 += 1;
					}
				}

				if (rowAlive) {
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
				if (liveRowAlive) {
					if (y < minY1) {
						minY1 = y;
					}
					if (y > maxY1) {
						maxY1 = y;
					}
				}
			}

			// save statistics
			this.engine.population = population;
			this.engine.births = births;
			this.engine.deaths = deaths;

			// don't update bounding box if zero population
			if (population > 0) {
				this.engine.zoomBox.leftX = minX;
				this.engine.zoomBox.rightX = maxX;
				this.engine.zoomBox.bottomY = minY;
				this.engine.zoomBox.topY = maxY;
				this.engine.HROTBox.leftX = minX1;
				this.engine.HROTBox.rightX = maxX1;
				this.engine.HROTBox.bottomY = minY1;
				this.engine.HROTBox.topY = maxY1;
			}
		} else {
			if (type === this.manager.vonNeumannHROT && xrange > this.rangeVN) {
				// set variables to use in getCount
				leftX -= xrange;
				rightX += xrange;
				bottomY -= yrange;
				topY += yrange;
				if (this.engine.boundedGridType === -1) {
					leftX -= xrange;
					rightX += xrange;
					bottomY -= yrange;
					topY += yrange;
				}
				this.nrows = topY - bottomY + 1;
				this.ncols = rightX - leftX + 1;
				this.ccht = (this.nrows + (this.ncols - 1) / 2) | 0;
				this.halfccwd = (this.ncols / 2) | 0;

				// calculate cumulative counts in top left corner of colcounts
				for (i = 0; i < this.ccht; i += 1) {
					countRow = counts[i];
					colourRow = colourGrid[i + bottomY];
					im1 = i - 1;
					im2 = im1 - 1;
					countRowIm1 = counts[im1];
					countRowIm2 = counts[im2];
					for (j = 0; j <= this.ncols; j += 1) {
						countRow[j] = this.getCount2(im1, j - 1, countRowIm1) + this.getCount2(im1, j + 1, countRowIm1) - this.getCount2(im2, j, countRowIm2);
						if (i < this.nrows) {
							if (colourRow[j + leftX] === maxGenState) {
								countRow[j] += 1;
							}
						}
					}
				}

				// calculate final neighborhood counts and update the corresponding cells in the grid
				for (i = yrange; i <= this.nrows - yrange; i += 1) {
					im1 = i - 1;
					countRowIm1 = counts[im1];
					ipr = i + yrange;
					countRowIpr = counts[ipr];
					iprm1 = ipr - 1;
					countRowIprm1 = counts[iprm1];
					imrm1 = i - yrange - 1;
					countRowImrm1 = counts[imrm1];
					imrm2 = imrm1 - 1;
					countRowImrm2 = counts[imrm2];
					ipminrow = i + bottomY;
					colourRow = colourGrid[ipminrow];
					colourTileRow = colourTileHistoryGrid[ipminrow >> 4];
					rowAlive = false;
					liveRowAlive = false;

					// check for non-deterministic algo
					if (useRandom) {
						// non-deterministic version
						for (j = xrange; j <= this.ncols - xrange; j += 1) {
							jpr = j + xrange;
							jmr = j - xrange;
							count = this.getCount2(ipr , j, countRowIpr)   - this.getCount2(im1 , jpr + 1, countRowIm1) - this.getCount2(im1 , jmr - 1, countRowIm1) + this.getCount2(imrm2 , j, countRowImrm2) +
									this.getCount2(iprm1 , j, countRowIprm1) - this.getCount2(im1 , jpr, countRowIm1)     - this.getCount2(im1 , jmr, countRowIm1)     + this.getCount2(imrm1 , j, countRowImrm1);
							jpmincol = j + leftX;
							state = colourRow[jpmincol];
							if (state <= deadState) {
								if (birthList[count] === 1) {
									if (myRand.random() >= birthChances[count]) {
										// new cell is born
										state = maxGenState;
										births += 1;
									} else {
										if (state > minDeadState) {
											state -= 1;
										}
									}
								} else {
									if (state > minDeadState) {
										state -= 1;
									}
								}
							} else if (state === maxGenState) {
								// this cell is alive
								if (survivalList[count] === 0) {
									if (myRand.random() >= immunityChances[count]) {
										// cell survives
									} else {
										// cell decays by one state
										state -= 1;
										deaths += 1;
									}
								} else {
									if (myRand.random() >= survivalChances[count]) {
										// cell survives
									} else {
										// cell decays by one state
										state -= 1;
										deaths += 1;
									}
								}
							} else {
								// this cell will eventually die
								if (state > minDeadState) {
									state -= 1;
								}
							}

							// update the cell
							colourRow[jpmincol] = state;
							if (state > 0) {
								colourTileRow[jpmincol >> 8] |= (1 << (~(jpmincol >> 4) & 15));
								if (jpmincol < minX) {
									minX = jpmincol;
								}
								if (jpmincol > maxX) {
									maxX = jpmincol;
								}
								rowAlive = true;
								if (state === maxGenState) {
									population += 1;
								}
								if (state > deadState) {
									liveRowAlive = true;
									if (jpmincol < minX1) {
										minX1 = jpmincol;
									}
									if (jpmincol > maxX1) {
										maxX1 = jpmincol;
									}
								}
							}
						}
					} else {
						// deterministic version
						for (j = xrange; j <= this.ncols - xrange; j += 1) {
							jpr = j + xrange;
							jmr = j - xrange;
							count = this.getCount2(ipr , j, countRowIpr)   - this.getCount2(im1 , jpr + 1, countRowIm1) - this.getCount2(im1 , jmr - 1, countRowIm1) + this.getCount2(imrm2 , j, countRowImrm2) +
									this.getCount2(iprm1 , j, countRowIprm1) - this.getCount2(im1 , jpr, countRowIm1)     - this.getCount2(im1 , jmr, countRowIm1)     + this.getCount2(imrm1 , j, countRowImrm1);
							jpmincol = j + leftX;
							state = colourRow[jpmincol];
							if (state <= deadState) {
								if (birthList[count] === 1) {
									// new cell is born
									state = maxGenState;
									births += 1;
								} else {
									if (state > minDeadState) {
										state -= 1;
									}
								}
							} else if (state === maxGenState) {
								// this cell is alive
								if (survivalList[count] === 0) {
									// cell decays by one state
									state -= 1;
									deaths += 1;
								}
							} else {
								// this cell will eventually die
								if (state > minDeadState) {
									state -= 1;
								}
							}

							// update the cell
							colourRow[jpmincol] = state;
							if (state > 0) {
								colourTileRow[jpmincol >> 8] |= (1 << (~(jpmincol >> 4) & 15));
								if (jpmincol < minX) {
									minX = jpmincol;
								}
								if (jpmincol > maxX) {
									maxX = jpmincol;
								}
								rowAlive = true;
								if (state === maxGenState) {
									population += 1;
								}
								if (state > deadState) {
									liveRowAlive = true;
									if (jpmincol < minX1) {
										minX1 = jpmincol;
									}
									if (jpmincol > maxX1) {
										maxX1 = jpmincol;
									}
								}
							}
						}
					}

					if (rowAlive) {
						if (ipminrow < minY) {
							minY = ipminrow;
						}
						if (ipminrow > maxY) {
							maxY = ipminrow;
						}
					}
					if (liveRowAlive) {
						if (ipminrow < minY1) {
							minY1 = ipminrow;
						}
						if (ipminrow > maxY1) {
							maxY1 = ipminrow;
						}
					}
				}

				// save statistics
				this.engine.population = population;
				this.engine.births = births;
				this.engine.deaths = deaths;

				// don't update bounding box if zero population
				if (population > 0) {
					this.engine.zoomBox.leftX = minX;
					this.engine.zoomBox.rightX = maxX;
					this.engine.zoomBox.bottomY = minY;
					this.engine.zoomBox.topY = maxY;
					this.engine.HROTBox.leftX = minX1;
					this.engine.HROTBox.rightX = maxX1;
					this.engine.HROTBox.bottomY = minY1;
					this.engine.HROTBox.topY = maxY1;
				}
			} else {
				// determine neighbourhood type
				switch (type) {
					case this.manager.cornerEdgeHROT:
						// corner/edge
						this.nextGenerationCornerEdgeN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.asteriskHROT:
						// asterisk
						this.nextGenerationAsteriskN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.tripodHROT:
						// tripod
						this.nextGenerationTripodN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.weightedHROT:
						// weighted
						this.nextGenerationWeightedN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.customHROT:
						// custom
						this.nextGenerationCustomN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.hashHROT:
						// hash
						this.nextGenerationHashN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.checkerHROT:
						// checkerboard
						this.nextGenerationCheckerboardN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.alignedCheckerHROT:
						// checkerboard
						this.nextGenerationAlignedCheckerboardN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.hexHROT:
						// hexagonal
						this.nextGenerationHexagonalN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.saltireHROT:
						// saltire
						this.nextGenerationSaltireN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.starHROT:
						// star
						this.nextGenerationStarN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.crossHROT:
						// cross
						this.nextGenerationCrossN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.triangularHROT:
						// triangular
						this.nextGenerationTriangularN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					case this.manager.gaussianHROT:
						// gaussian
						this.nextGenerationGaussianN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;

					default:
						// L2, circular, or short range von Neumann
						this.nextGenerationShapedN(leftX, bottomY, rightX, topY, xrange, yrange);
						break;
				}

			}
		}

		// adjust range if using bounded grid
		if (this.engine.boundedGridType !== -1) {
			if (leftX < gridLeftX + xrange) {
				leftX = gridLeftX + xrange;
			}
			if (rightX > gridRightX - xrange) {
				rightX = gridRightX - xrange;
			}
			if (bottomY < gridBottomY + yrange) {
				bottomY = gridBottomY + yrange;
			}
			if (topY > gridTopY - yrange) {
				topY = gridTopY - yrange;
			}
		}

		// compute next generation from counts if not Moore which was done above
		if (type !== this.manager.mooreHROT && !(type === this.manager.vonNeumannHROT && xrange > this.rangeVN)) {
			this.updateGridFromCountsHROT(leftX, bottomY, rightX, topY, useAlternate);
		}

		// check if there is a Torus bounded grid
		if (this.engine.boundedGridType === 1) {
			// clear outside
			this.clearHROTOutside(gridLeftX, gridBottomY, gridRightX, gridTopY);
		}
	};

	// update the life grid using HROT
	HROT.prototype.nextGenerationHROT = function(/** @type {number} */ counter) {
		// whether to use the alternate rule
		var	/** @type {boolean} */ useAlternate = false;

		// use alternate rule if specified and odd generation
		if (this.altSpecified && ((counter & 1) === 1)) {
			useAlternate = true;
		}

		if (this.scount === 2) {
			// use 2 state version
			this.nextGenerationHROT2(useAlternate);
		} else {
			// use >2 state version
			this.nextGenerationHROTN(useAlternate);
		}
	};
