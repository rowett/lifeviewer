// LifeViewer snapshot
// Snapshot system to allow step back feature.

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

	// Snapshot object
	/**
	 * @constructor
	 */
	function Snapshot(/** @type {SnapshotManager} */ manager, /** @type {number} */ index, /** @type {boolean} */ usingOverlay) {
		// buffer index number
		/** @type {number} */ this.index = index;

		// tile map for grid and colour grid
		/** @type {Array<Uint16Array>} */ this.tileGrid = manager.tileGrids[index];
		/** @type {Array<Uint16Array>} */ this.colourTileGrid = manager.colourTileGrids[index];
		/** @type {Array<Uint16Array>} */ this.overlayTileGrid = manager.overlayTileGrids[index];

		// buffer for grid tile map and colour tile map save
		/** @type {Array<Uint32Array>} */ this.gridBuffer = manager.gridBuffers[index];
		/** @type {Array<Uint32Array>} */ this.colourBuffer = manager.colourBuffers[index];
		/** @type {Array<Uint32Array>} */ this.overlayBuffer = null;

		if (usingOverlay) {
			this.overlayBuffer = manager.overlayBuffers[index];
		}

		// zoom box
		/** @type {BoundingBox} */ this.zoomBox = new BoundingBox(0, 0, 0, 0);
		/** @type {BoundingBox} */ this.HROTBox = new BoundingBox(0, 0, 0, 0);

		// statistics
		/** @type {number} */ this.population = 0;
		/** @type {number} */ this.births = 0;
		/** @type {number} */ this.deaths = 0;

		// generation and Margolus generation
		/** @type {number} */ this.counter = 0;
		/** @type {number} */ this.fixedCounter = 0;
		/** @type {number} */ this.counterMargolus = 0;
		/** @type {number} */ this.maxMargolusGen = 0;

		// manager
		/** @type {SnapshotManager} */ this.manager = manager;
	}

	// restore grid using tile map
	Snapshot.prototype.restoreGridUsingTile = function(/** @type {Array<Uint8Array>} */ grid, /** @type {Array<Uint16Array>} */ tile, /** @type {Life} */ life) {
		// length of tile array
		var	/** @type {number} */ l = tile.length,

			// width of tile row arrays
			/** @type {number} */ w = tile[0].length,

			// iterators
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ b = 0,
			/** @type {number} */ tx = 0,
			/** @type {number} */ ty = 0,

			// buffer index
			/** @type {number} */ bufInd = 0,

			// tile row
			/** @type {Uint16Array} */ tileRow = null,

			// tile group (16 tiles)
			/** @type {number} */ tileGroup = 0,

			// tile width (in 2 byte chunks) and height
			/** @type {number} */ xSize = life.tileX >> 1,
			/** @type {number} */ ySize = life.tileY,

			// tile on the grid
			/** @type {number} */ leftX = 0,
			/** @type {number} */ bottomY = 0,

			// grid buffer
			/** @type {Array<Uint32Array>} */ buffer = this.gridBuffer,

			// row index
			/** @type {number} */ rowIndex = 0,

			// buffer row
			/** @type {Uint32Array} */ bufferRow = buffer[rowIndex],

			// row size
			/** @type {number} */ rowSize = bufferRow.length,

			// next bytes from the buffer
			/** @type {number} */ value = 0,

			/** @type {Array<Uint16Array>} */ input16 = Array.matrixView(Type.Uint16, grid, "Snapshot.input16");

		// restore the tile grid
		Array.copy(this.tileGrid, tile);

		// copy the buffer onto the grid
		for (y = 0; y < l; y += 1) {
			// get the next tile row
			tileRow = this.tileGrid[y];

			// set tile column on grid
			leftX = 0;

			// get each set of tiles in the row
			for (x = 0; x < w; x += 1) {
				// get the next tile group
				tileGroup = tileRow[x];

				// check if any tiles are present in the tile group
				if (tileGroup) {
					// check each tile in the group
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is used
						if ((tileGroup & (1 << b)) !== 0) {
							// get the coordinates of the tile on the grid
							ty = bottomY;
							tx = leftX;

							// get the data from the buffer
							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							value = bufferRow[bufInd];
							bufInd += 1;
							input16[ty][tx] = value >> 16;
							input16[ty + 1][tx] = value & 65535;
							ty += 2;

							// check if buffer row is full
							if (bufInd >= rowSize) {
								// get the next row
								rowIndex += 1;
								bufferRow = buffer[rowIndex];

								// reset index
								bufInd = 0;
							}
						}

						// next tile column
						leftX += xSize;
					}
				} else {
					// skip empty tile group
					leftX += xSize << 4;
				}
			}

			// next tile row
			bottomY += ySize;
		}
	};

	// save grid using tile map
	Snapshot.prototype.saveGridUsingTile = function(/** @type {Array<Uint8Array>} */ grid, /** @type {Array<Uint16Array>} */ tile, /** @type {Life} */ life) {
		// length of tile array
		var	/** @type {number} */ l = tile.length,

			// width of tile row arrays
			/** @type {number} */ w = tile[0].length,

			// iterators
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ b = 0,
			/** @type {number} */ tx = 0,
			/** @type {number} */ ty = 0,

			// buffer index
			/** @type {number} */ bufInd = 0,

			// tile row
			/** @type {Uint16Array} */ tileRow = null,

			// tile group (16 tiles)
			/** @type {number} */ tileGroup = 0,

			// count of used tiles
			/** @type {number} */ usedCount = 0,

			// tile width (in 2 byte chunks) and height
			/** @type {number} */ xSize = life.tileX >> 1,
			/** @type {number} */ ySize = life.tileY,

			// tile on the grid
			/** @type {number} */ leftX = 0,
			/** @type {number} */ bottomY = 0,

			// grid buffer 
			/** @type {Array<Uint32Array>} */ buffer = this.gridBuffer,

			// row index
			/** @type {number} */ rowIndex = 0,

			// first buffer row
			/** @type {Uint32Array} */ bufferRow = buffer[rowIndex],

			// row size
			/** @type {number} */ rowSize = bufferRow.length,

			// number of rows
			/** @type {number} */ numRows = buffer.length,

			// bit counts (from manager)
			/** @type {Uint8Array} */ bitCounts = this.manager.bitCounts,

			/** @type {Array<Uint16Array>} */ input16 = Array.matrixView(Type.Uint16, grid, "Snapshot.input16");

		// save the tile grid
		Array.copy(tile, this.tileGrid);

		// count tiles used
		for (y = 0; y < l; y += 1) {
			// get the next tile row
			tileRow = tile[y];

			// get each set of tiles in the row
			for (x = 0; x < w; x += 1) {
				// get the next tile group
				tileGroup = tileRow[x];

				// count the tiles in the group
				if (tileGroup) {
					usedCount += bitCounts[tileGroup];
				}
			}
		}

		// allocate array to store grid
		if (usedCount) {
			// copy the grid in to the buffer
			for (y = 0; y < l; y += 1) {
				// get the next tile row
				tileRow = tile[y];

				// set tile column on grid
				leftX = 0;

				// get each set of tiles in the row
				for (x = 0; x < w; x += 1) {
					// get the next tile group
					tileGroup = tileRow[x];

					// check if any tiles are present in the tile group
					if (tileGroup) {
						// check each tile in the group
						for (b = 15; b >= 0; b -= 1) {
							// check if this tile is used
							if ((tileGroup & (1 << b)) !== 0) {
								// get the coordinates of the tile on the grid
								ty = bottomY;
								tx = leftX;

								// copy the tile from the grid to the buffer
								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								bufferRow[bufInd] = (input16[ty][tx] << 16) | input16[ty + 1][tx];
								bufInd += 1;
								ty += 2;

								// check if buffer row is full
								if (bufInd >= rowSize) {
									// go to the next row
									rowIndex += 1;

									// reset index
									bufInd = 0;

									// check if there is a next row
									if (rowIndex >= numRows) {
										// allocate a new row
										Array.addRow(buffer, 0, "Snapshot.gridBufferRow");
										numRows += 1;
									}
								}

								// get the next row
								bufferRow = buffer[rowIndex];
							}

							// next tile column
							leftX += xSize;
						}
					} else {
						// skip empty tile group
						leftX += xSize << 4;
					}
				}

				// next tile row
				bottomY += ySize;
			}
		}
	};

	// restore colour grid using tile map
	Snapshot.prototype.restoreColourGridUsingTile = function(/** @type {Array<Uint8Array>} */ grid, /** @type {Array<Uint16Array>} */ tile, /** @type {Life} */ life, /** @type {Array<Uint32Array>} */ buffer) {
		// length of tile array
		var	/** @type {number} */ l = tile.length,

			// width of tile row arrays
			/** @type {number} */ w = tile[0].length,

			// iterators
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ b = 0,
			/** @type {number} */ tx = 0,
			/** @type {number} */ ty = 0,

			// buffer index
			/** @type {number} */ bufInd = 0,

			// tile row
			/** @type {Uint16Array} */ tileRow = null,

			// tile group (16 tiles)
			/** @type {number} */ tileGroup = 0,

			// tile width (in 4 byte chunks) and height
			/** @type {number} */ xSize = life.tileX << 1,
			/** @type {number} */ ySize = life.tileY,

			// tile on the grid
			/** @type {number} */ leftX = 0,
			/** @type {number} */ bottomY = 0,

			// row index
			/** @type {number} */ rowIndex = 0,

			// buffer row
			/** @type {Uint32Array} */ bufferRow = buffer[rowIndex],

			// row size
			/** @type {number} */ rowSize = bufferRow.length,

			/** @type {Array<Uint32Array>} */ input32 = Array.matrixView(Type.Uint32, grid, "Snapshot.input32"),
			/** @type {Uint32Array} */ row32 = null;

		// restore the colour tile grid
		Array.copy(this.colourTileGrid, tile);

		// copy the buffer onto the colour grid
		for (y = 0; y < l; y += 1) {
			// get the next tile row
			tileRow = tile[y];

			// set tile column on grid
			leftX = 0;

			// get each set of tiles in the row
			for (x = 0; x < w; x += 1) {
				// get the next tile group
				tileGroup = tileRow[x];

				// check if any tiles are present in the tile group
				if (tileGroup) {
					// check each tile in the group
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is used
						if ((tileGroup & (1 << b)) !== 0) {
							// copy the tile
							tx = leftX;
							ty = bottomY;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							row32 = input32[ty];
							row32[tx] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 1] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 2] = bufferRow[bufInd];
							bufInd += 1;
							row32[tx + 3] = bufferRow[bufInd];
							bufInd += 1;
							ty += 1;

							// check if buffer row is full
							if (bufInd >= rowSize) {
								// get the next row
								rowIndex += 1;
								bufferRow = buffer[rowIndex];

								// reset index
								bufInd = 0;
							}
						}

						// next tile column
						leftX += xSize;
					}
				} else {
					// skip empty tile group
					leftX += xSize << 4;
				}
			}

			// next tile row
			bottomY += ySize;
		}
	};

	// save colour grid using tile map
	Snapshot.prototype.saveColourGridUsingTile = function(/** @type {Array<Uint8Array>} */ grid, /** @type {Array<Uint16Array>} */ tile, /** @type {Life} */ life, /** @type {Array<Uint32Array>} */ buffer, /** @type {Array<Uint16Array>} */ colourTileGrid) {
		// length of tile array
		var	/** @type {number} */ l = tile.length,

			// width of tile row arrays
			/** @type {number} */ w = tile[0].length,

			// iterators
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ b = 0,
			/** @type {number} */ tx = 0,
			/** @type {number} */ ty = 0,

			// buffer index
			/** @type {number} */ bufInd = 0,

			// tile row
			/** @type {Uint16Array} */ tileRow = null,

			// tile group (16 tiles)
			/** @type {number} */ tileGroup = 0,

			// count of used tiles
			/** @type {number} */ usedCount = 0,

			// tile width (in 4 byte chunks) and height
			/** @type {number} */ xSize = life.tileX << 1,
			/** @type {number} */ ySize = life.tileY,

			// tile on the grid
			/** @type {number} */ leftX = 0,
			/** @type {number} */ bottomY = 0,

			// row index
			/** @type {number} */ rowIndex = 0,

			// first buffer row
			/** @type {Uint32Array} */ bufferRow = buffer[rowIndex],

			// row size
			/** @type {number} */ rowSize = bufferRow.length,

			// number of rows
			/** @type {number} */ numRows = buffer.length,

			// bit counts (from manager)
			/** @type {Uint8Array} */ bitCounts = this.manager.bitCounts,

			/** @type {Array<Uint32Array>} */ input32 = Array.matrixView(Type.Uint32, grid, "Snapshot.input32"),
			/** @type {Uint32Array} */ row32 = null;

		// save the colour tile grid
		Array.copy(tile, colourTileGrid);

		// count tiles used
		for (y = 0; y < l; y += 1) {
			// get the next tile row
			tileRow = tile[y];

			// get each set of tiles in the row
			for (x = 0; x < w; x += 1) {
				// get the next tile group
				tileGroup = tileRow[x];

				// count the tiles in the group
				if (tileGroup) {
					usedCount += bitCounts[tileGroup];
				}
			}
		}

		// allocate array to store grid
		if (usedCount) {
			// copy the grid in to the buffer
			for (y = 0; y < l; y += 1) {
				// get the next tile row
				tileRow = tile[y];

				// set tile column on grid
				leftX = 0;

				// get each set of tiles in the row
				for (x = 0; x < w; x += 1) {
					// get the next tile group
					tileGroup = tileRow[x];

					// check if any tiles are present in the tile group
					if (tileGroup) {
						// check each tile in the group
						for (b = 15; b >= 0; b -= 1) {
							// check if this tile is used
							if ((tileGroup & (1 << b)) !== 0) {
								// copy the tile
								tx = leftX;
								ty = bottomY;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								row32 = input32[ty];
								bufferRow[bufInd] = row32[tx];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 1];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 2];
								bufInd += 1;
								bufferRow[bufInd] = row32[tx + 3];
								bufInd += 1;
								ty += 1;

								// check if buffer row is full
								if (bufInd >= rowSize) {
									// go to next row
									rowIndex += 1;

									// reset index
									bufInd = 0;

									// check if there is a next row
									if (rowIndex >= numRows) {
										// allocate a new row
										Array.addRow(buffer, 0, "Snapshot.colourGridBufferRow");
										numRows += 1;
									}

									// get the next row
									bufferRow = buffer[rowIndex];
								}
							}
							leftX += xSize;
						}
					} else {
						// skip empty tile group
						leftX += xSize << 4;
					}
				}

				// next tile row
				bottomY += ySize;
			}
		}
	};

	// SnapshotManager object
	/**
	 * @constructor
	 */
	function SnapshotManager(/** @type {Allocator} */ allocator, /** @type {Uint8Array} */ bitcounts) {
		// allocator
		/** @type {Allocator} */ this.allocator = allocator;

		// snapshots
		/** @type {Array<Snapshot>} */ this.snapshots = [];

		// whether buffer used
		/** @type {Array<boolean>} */ this.bufferUsed = [];

		// tile grids
		/** @type {Array<Array<Uint16Array>>} */ this.tileGrids = [];

		// colour tile grids
		/** @type {Array<Array<Uint16Array>>} */ this.colourTileGrids = [];

		// overlay tile grids
		/** @type {Array<Array<Uint16Array>>} */ this.overlayTileGrids = [];

		// grid buffers
		/** @type {Array<Array<Uint32Array>>} */ this.gridBuffers = [];

		// colour buffers
		/** @type {Array<Array<Uint32Array>>} */ this.colourBuffers = [];

		// overlay buffers
		/** @type {Array<Array<Uint32Array>>} */ this.overlayBuffers = [];

		// number of buffers allocated
		/** @type {number} */ this.numBuffers = 0;

		// current snapshot index
		/** @type {number} */ this.index = -1;

		// maximum number of snapshots
		/** @type {number} */ this.maxSnapshots = 51;

		// bit counts for bytes
		/** @type {Uint8Array} */ this.bitCounts = bitcounts;

		// default number of tiles to allocate
		/** @type {number} */ this.defaultTiles = 128;

		// reset snapshot
		/** @type {Snapshot} */ this.resetSnapshot = null;
	}

	// return buffer size in bytes
	/** @returns {number} */
	SnapshotManager.prototype.bufferSize = function() {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ i = 0;

		// sum each snapshot buffer
		while (i < this.bufferUsed.length) {
			// add tile size
			result += this.tileGrids[i].length * this.tileGrids[i][0].length * 2;

			// add colour tile size
			result += this.colourTileGrids[i].length * this.colourTileGrids[i][0].length * 2;

			// add grid buffer
			result += this.gridBuffers[i].length * this.gridBuffers[i][0].length * 4;

			// add colour grid buffer
			result += this.colourBuffers[i].length * this.colourBuffers[i][0].length * 4;

			// add overlay tile and grid buffer if used
			if (this.overlayBuffers[i]) {
				result += this.overlayTileGrids[i].length * this.overlayTileGrids[i][0].length * 2;
				result += this.overlayBuffers[i].length * this.overlayBuffers[i][0].length * 4;
			}

			i += 1;
		}

		// return size
		return result;
	};

	// return number of buffers used
	/** @returns {number} */
	SnapshotManager.prototype.usedBuffers = function() {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ i = 0;

		// check each buffer
		while (i < this.bufferUsed.length) {
			if (this.bufferUsed[i]) {
				result += 1;
			}
			i += 1;
		}

		// return number used
		return result;
	};

	// return number of buffers allocated
	/** @returns {number} */
	SnapshotManager.prototype.buffers = function() {
		return this.bufferUsed.length;
	};

	// reset the snapshot manager
	SnapshotManager.prototype.reset = function() {
		// clear the snapshots
		this.snapshots = [];
		this.bufferUsed = [];
		this.numBuffers = 0;
		this.index = -1;
	};

	// get the snapshot before the target generation
	/** @returns {Snapshot} */
	SnapshotManager.prototype.snapshotBefore = function(/** @type {number} */ generation) {
		var	/** @type {Snapshot} */ result = null,
			/** @type {number} */ numSnapshots = this.snapshots.length;

		// check if there are any snapshots
		if (numSnapshots > 0) {
			// start at the current snapshot
			result = this.snapshots[this.index];

			// check if the snapshot is before the required generation
			while (result && result.counter > generation) {
				result = null;

				// check if this is the only snapshot
				if (this.index > 0) {
					// free the buffer
					this.freeBuffer(this.snapshots[this.index].index);

					// remove the snapshot
					this.snapshots.pop();

					// see if there is an earlier snapshot
					this.index -= 1;

					if (this.index >= 0) {
						result = this.snapshots[this.index];
					}
				}
			}
		}

		// return the snapshot if found
		return result;
	};

	// save snapshot
	SnapshotManager.prototype.saveSnapshot = function(/** @type {Array<Uint8Array>} */ grid, /** @type {Array<Uint16Array>} */ tileGrid, /** @type {Array<Uint8Array>} */ colourGrid, /** @type {Array<Uint16Array>} */ colourTileGrid, /** @type {Array<Uint8Array>} */ overlayGrid, /** @type {Array<Uint16Array>} */ overlayTileGrid, /** @type {BoundingBox} */ zoomBox, /** @type {BoundingBox} */ HROTBox, /** @type {number} */ population, /** @type {number} */ births, /** @type {number} */ deaths,
		/** @type {number} */ counter, /** @type {number} */ fixedCounter, /** @type {number} */ counterMargolus, /** @type {number} */ maxMargolusGen, /** @type {number} */ width, /** @type {number} */ height, /** @type {Life} */ life, /** @type {boolean} */ isReset) {
		var	/** @type {Snapshot} */ snapshot = null,
			/** @type {number} */ i = 0,
			/** @type {boolean} */ usingOverlay = (overlayGrid !== null);

		// check if saving to the reset snapshot
		if (isReset) {
			// use the reset snapshot
			snapshot = this.resetSnapshot;
		} else {
			// check whether to create a new snapshot
			if (this.snapshots.length < this.maxSnapshots) {
				// create a new snapshot
				snapshot = this.createSnapshot(width, height, false, usingOverlay);
				this.index += 1;
			} else {
				// get the next snapshot index
				this.index += 1;
				if (this.index >= this.maxSnapshots) {
					this.index = this.maxSnapshots - 1;

					// free the oldest snapshot
					this.freeBuffer(this.snapshots[0].index);

					// move the snapshots down
					for (i = 0; i < this.maxSnapshots - 1; i += 1) {
						this.snapshots[i] = this.snapshots[i + 1];
					}

					// remove the final element
					this.snapshots.pop();

					// create a new final element
					snapshot = this.createSnapshot(width, height, false, usingOverlay);
				}

				// get the snapshot at the index
				snapshot = this.snapshots[this.index];
			}
		}

		// save the grid
		snapshot.saveGridUsingTile(grid, tileGrid, life);

		// save the colour grid
		snapshot.saveColourGridUsingTile(colourGrid, colourTileGrid, life, snapshot.colourBuffer, snapshot.colourTileGrid);

		if (usingOverlay) {
			// save the overlay grid
			snapshot.saveColourGridUsingTile(overlayGrid, overlayTileGrid, life, snapshot.overlayBuffer, snapshot.overlayTileGrid);
		}

		// save the bounding box
		snapshot.zoomBox.leftX = zoomBox.leftX;
		snapshot.zoomBox.rightX = zoomBox.rightX;
		snapshot.zoomBox.bottomY = zoomBox.bottomY;
		snapshot.zoomBox.topY = zoomBox.topY;
		snapshot.HROTBox.leftX = HROTBox.leftX;
		snapshot.HROTBox.rightX = HROTBox.rightX;
		snapshot.HROTBox.bottomY = HROTBox.bottomY;
		snapshot.HROTBox.topY = HROTBox.topY;

		// save the population
		snapshot.population = population;
		snapshot.births = births;
		snapshot.deaths = deaths;

		// save the generation
		snapshot.counter = counter;
		snapshot.fixedCounter = fixedCounter;
		snapshot.counterMargolus = counterMargolus;
		snapshot.maxMargolusGen = maxMargolusGen;
	};

	// free a buffer
	SnapshotManager.prototype.freeBuffer = function(/** @type {number} */ number) {
		// mark the buffer as available
		this.bufferUsed[number] = false;
	};

	// create or return a buffer
	/** @returns {number} */
	SnapshotManager.prototype.getBuffers = function(/** @type {number} */ width, /** @type {number} */ height, /** @type {boolean} */ usingOverlay) {
		var	/** @type {number} */ result = 0,
			/** @type {number} */ i = 0,
			/** @type {boolean} */ found = false;

		// check if there is a free buffer
		while (i < this.numBuffers && !found) {
			// check if the buffer is used
			if (!this.bufferUsed[i]) {
				// mark found
				found = true;
			} else {
				// check next buffer
				i += 1;
			}
		}

		// check if a buffer was found
		if (found) {
			// return the buffer number
			result = i;

			// mark buffer used
			this.bufferUsed[i] = true;
		} else {
			// create a new buffer
			this.tileGrids[i] = Array.matrix(Type.Uint16, height, width, 0, this.allocator, "Snapshot.tileGrid" + i);
			this.colourTileGrids[i] = Array.matrix(Type.Uint16, height, width, 0, this.allocator, "Snapshot.colourTileGrid" + i);
			this.gridBuffers[i] = Array.matrix(Type.Uint32, 1, this.defaultTiles * 8, 0, this.allocator, "Snapshot.gridBuffer" + i);
			this.colourBuffers[i] = Array.matrix(Type.Uint32, 1, this.defaultTiles * 64, 0, this.allocator, "Snapshot.colourGridBuffer" + i);
			if (usingOverlay) {
				this.overlayTileGrids[i] = Array.matrix(Type.Uint16, height, width, 0, this.allocator, "Snapshot.overlayTileGrid" + i);
				this.overlayBuffers[i] = Array.matrix(Type.Uint32, 1, this.defaultTiles * 64, 0, this.allocator, "Snapshot.overlayGridBuffer" + i);
			}
			this.bufferUsed[i] = true;

			// increment number of buffers allocated
			this.numBuffers += 1;
			result = i;
		}

		// return the allocation number
		return result;
	};

	// create a snapshot
	/** @returns {Snapshot} */
	SnapshotManager.prototype.createSnapshot = function(/** @type {number} */ w, /** @type {number} */ h, /** @type {boolean} */ isReset, /** @type {boolean} */ usingOverlay) {
		// lookup or create a buffer
		var	/** @type {number} */ bufNum = this.getBuffers(w, h, usingOverlay),

			// create the new snapshot
			/** @type {Snapshot} */ result = null;

		// check if this is the reset snapshot
		if (isReset) {
			// create the reset snapshot
			result = new Snapshot(this, bufNum, usingOverlay);
			this.resetSnapshot = result;
		} else {
			// add to the list of snapshots
			result = new Snapshot(this, bufNum, usingOverlay);
			this.snapshots[this.snapshots.length] = result;
		}

		// return the new snapshot
		return result;
	};

	// copy to center of grid
	// TBD src has no type information because of a type check issue
	SnapshotManager.prototype.copyToCenter = function(/** @type {Uint16Array} */ dest, src, /** @type {number} */ offset) {
		dest.set(src, offset);
	};

	// resize a snapshot
	SnapshotManager.prototype.resizeSnapshot = function(/** @type {Snapshot} */ snapshot, /** @type {number} */ newWidth, /** @type {number} */ newHeight, /** @type {number} */ xOffset, /** @type {number} */ yOffset, /** @type {number} */ xOffsetPixels, /** @type {number} */ yOffsetPixels, /** @type {boolean} */ useOverlay) {
		// get current snapshot tile grid and colour tile grid
		var	/** @type {Array<Uint16Array>} */ currentTileGrid = snapshot.tileGrid,
			/** @type {Array<Uint16Array>} */ currentColourTileGrid = snapshot.colourTileGrid,
			/** @type {Array<Uint16Array>} */ currentOverlayTileGrid = snapshot.overlayTileGrid,
			/** @type {number} */ currentHeight = snapshot.tileGrid.length,
			/** @type {number} */ y = 0,
			/** @type {number} */ index = snapshot.index;

		// allocate the new tile grids in the buffer
		this.tileGrids[index] = Array.matrix(Type.Uint16, newHeight, newWidth, 0, this.allocator, "Snapshot.tileGrid" + index);
		this.colourTileGrids[index] = Array.matrix(Type.Uint16, newHeight, newWidth, 0, this.allocator, "Snapshot.colourTileGrid" + index);
		if (useOverlay) {
			this.overlayTileGrids[index] = Array.matrix(Type.Uint16, newHeight, newWidth, 0, this.allocator, "Snapshot.overlayTileGrid" + index);
		}

		// set them in the snapshot
		snapshot.tileGrid = this.tileGrids[index];
		snapshot.colourTileGrid = this.colourTileGrids[index];
		if (useOverlay) {
			snapshot.overlayTileGrid = this.overlayTileGrids[index];
		}

		// if the snapshot has grown then copy the old grids to the center of the new ones
		if (xOffset > 0 || yOffset > 0) {
			while (y < currentHeight) {
				this.copyToCenter(snapshot.tileGrid[y + yOffset], currentTileGrid[y], xOffset);
				//snapshot.tileGrid[y + yOffset].set(currentTileGrid[y], xOffset);
				this.copyToCenter(snapshot.colourTileGrid[y + yOffset], currentColourTileGrid[y], xOffset);
				//snapshot.colourTileGrid[y + yOffset].set(currentColourTileGrid[y], xOffset);
				if (useOverlay) {
					this.copyToCenter(snapshot.overlayTileGrid[y + yOffset], currentOverlayTileGrid[y], xOffset);
					//snapshot.overlayTileGrid[y + yOffset].set(currentOverlayTileGrid[y], xOffset);
				}
				y += 1;
			}
		}

		// update the zoom box
		snapshot.zoomBox.leftX += xOffsetPixels;
		snapshot.zoomBox.rightX += xOffsetPixels;
		snapshot.zoomBox.bottomY += yOffsetPixels;
		snapshot.zoomBox.topY += yOffsetPixels;
		snapshot.HROTBox.leftX += xOffsetPixels;
		snapshot.HROTBox.rightX += xOffsetPixels;
		snapshot.HROTBox.bottomY += yOffsetPixels;
		snapshot.HROTBox.topY += yOffsetPixels;
	};

	// resize snapshots to fit the new grid
	SnapshotManager.prototype.resizeSnapshots = function(/** @type {number} */ newWidth, /** @type {number} */ newHeight, /** @type {number} */ xOffset, /** @type {number} */ yOffset, /** @type {number} */ xOffsetPixels, /** @type {number} */ yOffsetPixels, /** @type {boolean} */ useOverlay) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ l = 0;

		// grow the reset snapshot
		if (this.resetSnapshot) {
			this.resizeSnapshot(this.resetSnapshot, newWidth, newHeight, xOffset, yOffset, xOffsetPixels, yOffsetPixels, useOverlay);
		}

		// grow each saved snapshot
		i = 0;
		l = this.snapshots.length;
		while (i < l) {
			this.resizeSnapshot(this.snapshots[i], newWidth, newHeight, xOffset, yOffset, xOffsetPixels, yOffsetPixels, useOverlay);
			i += 1;
		}

		// grow any unallocated buffers
		i = 0;
		while (i < this.bufferUsed.length) {
			if (!this.bufferUsed[i]) {
				// grow the buffer
				this.tileGrids[i] = Array.matrix(Type.Uint16, newHeight, newWidth, 0, this.allocator, "Snapshot.tileGrid" + i);
				this.colourTileGrids[i] = Array.matrix(Type.Uint16, newHeight, newWidth, 0, this.allocator, "Snapshot.colourTileGrid" + i);
				if (useOverlay) {
					this.overlayTileGrids[i] = Array.matrix(Type.Uint16, newHeight, newWidth, 0, this.allocator, "Snapshot.overlayTileGrid" + i);
				}
			}
			i += 1;
		}
	};
