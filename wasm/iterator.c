// LifeViewer WebAssembly functions
// Faster versions of LifeViewer functions implemented using WebAssembly SIMD Intrinstics
// See: https://emscripten.org/docs/porting/simd.html#webassembly-simd-intrinsics
//
// Iterators
//	convertToPens2 (Life-like)
//	convertToPensAge (Life-like)
//	convertToPensNeighbours (Life-like)
//	nextGeneration (Life-like)
//	nextGenerationGenerations (Generations)
//	nextGenerationSuperMoore (Super, Moore)
//	nextGenerationSuperHex (Super, Hex)
//	nextGenerationSuperVN (Super, von Neumann)
//	nextGenerationInvestigatorMoore (Investigator, Moore)
//	nextGenerationInvestigatorHex (Investigator, Hex)
//	nextGenerationInvestigatorVN (Investigator, von Neumann)
//	nextGenerationRuleTreeMoore (RuleTree, Moore)
//	nextGenerationRuleTreeMoorePartial4 (RuleTree, Moore)
//	nextGenerationRuleTreeVN (RuleTree, von Neumann)
//	nextGenerationRuleTableMoore (RuleTable, Moore)
//	nextGenerationRuleTableHex (RuleTable, Moore)
//	nextGenerationRuleTableVN (RuleTable, Moore)
//	nextGenerationRuleLoaderMooreLookupN (RuleLoader, Moore)
//	nextGenerationRuleLoaderVNLookupN (RuleLoader, von Neumann)
//	nextGenerationRuleLoaderHexLookupN (RuleLoader, Hex)
//	resetColourGridNormal (Life-like)
//	resetPopulationBit (Life-like)
//	resetBoxesBit (Life-like)
//	shrinkTileGrid (Life-like)

// TODO:
//	check grid boundaries in convertToPensNeighbours

/*
This file is part of LifeViewer
 Copyright (C) 2015-2025 Chris Rowett

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

#include <stdint.h>
#include <string.h>
#include <wasm_simd128.h>
#include <emscripten.h>


// update bounding box from the column and row occupancy arrays and append to shared memory, return next shared memory slot
uint32_t* updateBoundingBox(
	const uint16_t *const columnOccupied16,
	const int32_t columnOccupiedWidth,
	const uint16_t *const rowOccupied16,
	const int32_t rowOccupiedWidth,
	const int32_t width,
	const int32_t height,
	uint32_t *shared
) {
	// new box extent
	int32_t newBottomY = height;
	int32_t newTopY = -1;
	int32_t newLeftX = width;
	int32_t newRightX = -1;

	// update bounding box
	for (int32_t tw = 0; tw < columnOccupiedWidth; tw++) {
		if (columnOccupied16[tw]) {
			if (tw < newLeftX) {
				newLeftX = tw;
			}
			if (tw > newRightX) {
				newRightX = tw;
			}
		}
	}

	for (int32_t th = 0; th < rowOccupiedWidth; th++) {
		if (rowOccupied16[th]) {
			if (th < newBottomY) {
				newBottomY = th;
			}
			if (th > newTopY) {
				newTopY = th;
			}
		}
	}

	// convert new width to pixels
	newLeftX = (newLeftX << 4) + (__builtin_clz(columnOccupied16[newLeftX]) - 16);
	newRightX = (newRightX << 4) + (15 - __builtin_ctz(columnOccupied16[newRightX]));

	// convert new height to pixels
	newBottomY = (newBottomY << 4) + (__builtin_clz(rowOccupied16[newBottomY]) - 16);
	newTopY = (newTopY << 4) + (15 - __builtin_ctz(rowOccupied16[newTopY]));

	// ensure the box is not blank
	if (newTopY < 0) {
		newTopY = height - 1;
	}
	if (newBottomY >= height) {
		newBottomY = 0;
	}
	if (newLeftX >= width) {
		newLeftX = 0;
	}
	if (newRightX < 0) {
		newRightX = width - 1;
	}

	// clip to the screen
	if (newTopY > height - 1) {
		newTopY = height - 1;
	}
	if (newBottomY < 0) {
		newBottomY = 0;
	}
	if (newLeftX < 0) {
		newLeftX = 0;
	}
	if (newRightX > width - 1) {
		newRightX = width - 1;
	}

	// return data to JS
	*shared++ = newLeftX;
	*shared++ = newBottomY;
	*shared++ = newRightX;
	*shared++ = newTopY;

	return shared;
}


EMSCRIPTEN_KEEPALIVE
// shrink the tile grid to the pattern
void shrinkTileGrid(
	uint16_t *const grid,
	const uint32_t gridWidth,
	uint16_t *const tileGrid,
	uint16_t *const nextTileGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridWholeBytes,
	const uint32_t leftMask,
	const uint32_t rightMask,
	const uint32_t ySize,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileWidth,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	const uint32_t width
) {
	uint32_t belowNextTiles, aboveNextTiles;

	// tile width in 16 bit chunks
	const uint32_t xSize = tileX >> 1;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// flags for edges of tile occupied
	uint32_t neighbours = 0;

	// width of the grid in 16 bit chunks
	const uint32_t width16 = width >> 4;

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridWholeBytes);

	// scan each row of tiles
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;

		// get the tile row
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = tileRow[tw];
			uint32_t currentX = leftX;

			// check if any are occupied
			if (tiles) {
				// get the destination (with any set because of edges)
				uint32_t nextTiles = nextTileRow[tw];
				belowNextTiles = belowNextTileRow[tw];
				aboveNextTiles = aboveNextTileRow[tw];

				// compute next generation for each set tile
				while (tiles) {
					// get the next alive tile in the set
					uint32_t b = 31 - __builtin_clz(tiles);
					tiles &= ~(1 <<  b);

					leftX = currentX + xSize * (15 - b);

					// mark tile not alive
					bool tileAlive = false;

					// clear the edge flags
					neighbours = 0;

					// process the bottom row
					uint32_t h = bottomY;
					uint16_t *gridRow = grid + h * gridWidth;

					// get the cells from the grid
					uint32_t output = *(gridRow + leftX);

					// check if any cells were alive
					if (output) {
						// set tile alive
						tileAlive = true;

						if (output & leftMask) {
							neighbours |= leftSet;
							neighbours |= bottomLeftSet;
						}

						if (output & rightMask) {
							neighbours |= rightSet;
							neighbours |= bottomRightSet;
						}
						neighbours |= bottomSet;
					}
					h++;
					gridRow += gridWidth;

					// process middle rows of the tile
					while (h < topY - 1) {
						// get next row
						output = *(gridRow + leftX);

						// check if any cells were alive
						if (output) {
							tileAlive = true;

							if (output & leftMask) {
								neighbours |= leftSet;
							}

							if (output & rightMask) {
								neighbours |= rightSet;
							}
						}

						// next row
						h++;
						gridRow += gridWidth;
					}

					// process top row of tile
					output = *(gridRow + leftX);

					// check if any cells are alive
					if (output) {
						tileAlive = true;
						if (output & leftMask) {
							neighbours |= leftSet;
							neighbours |= topLeftSet;
						}

						if (output & rightMask) {
							neighbours |= rightSet;
							neighbours |= topRightSet;
						}

						neighbours |= topSet;
					}

					// check if the source was alive
					if (tileAlive) {
						// update
						nextTiles |= (1 << b);

						// check for neighbours
						if (neighbours) {
							// check whether left edge occupied
							if (neighbours & leftSet) {
								if (b < 15) {
									nextTiles |= (1 << (b + 1));
								} else {
									// set in previous set if not at left edge
									if ((tw > 0) && (leftX > 0)) {
										nextTileRow[tw - 1] |= 1;
									}
								}
							}

							// check whether right edge occupied
							if (neighbours & rightSet) {
								if (b > 0) {
									nextTiles |= (1 << (b - 1));
								} else {
									// set carry over to go into next set if not at right edge
									if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
										nextTileRow[tw + 1] |= (1 << 15);
									}
								}
							}

							// check whether bottom edge occupied
							if (neighbours & bottomSet) {
								// set in lower tile set
								belowNextTiles |= (1 << b);
							}

							// check whether top edge occupied
							if (neighbours & topSet) {
								// set in upper tile set
								aboveNextTiles |= (1 << b);
							}

							// check whether bottom left occupied
							if (neighbours & bottomLeftSet) {
								if (b < 15) {
									belowNextTiles |= (1 << (b + 1));
								} else {
									if ((tw > 0) && (leftX > 0)) {
										belowNextTileRow[tw - 1] |= 1;
									}
								}
							}

							// check whether bottom right occupied
							if (neighbours & bottomRightSet) {
								if (b > 0) {
									belowNextTiles |= (1 << (b - 1));
								} else {
									if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
										belowNextTileRow[tw + 1] |= (1 << 15);
									}
								}
							}

							// check whether top left occupied
							if (neighbours & topLeftSet) {
								if (b < 15) {
									aboveNextTiles |= (1 << (b + 1));
								} else {
									if ((tw > 0) && (leftX > 0)) {
										aboveNextTileRow[tw - 1] |= 1;
									}
								}
							}

							// check whether top right occupied
							if (neighbours & topRightSet) {
								if (b > 0) {
									aboveNextTiles |= (1 << (b - 1));
								} else {
									if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
										aboveNextTileRow[tw + 1] |= (1 << 15);
									}
								}
							}
						}
					}
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			}

			// next tile set
			leftX = currentX + (xSize << 4);
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileWidth * sizeof(*blankTileRow));
}


EMSCRIPTEN_KEEPALIVE
// reset the bounding box from the bit grid
void resetBoxesBit(
	uint16_t *const grid,
	const uint32_t gridWidth,
	uint16_t *const tileGrid,
	uint16_t *const nextTileGrid,
	const uint32_t tileGridWidth,
	uint16_t *const columnOccupied16,
	const int32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const int32_t rowOccupiedWidth,
	const int32_t width,
	const int32_t height,
	const int32_t tilePower,
	const uint32_t shrinkNeeded,
	uint32_t *shared
) {
	// bounding box
	int32_t bottomY = height;
	int32_t topY = -1;
	int32_t leftX, rightX;

	// width in 16 bit chunks
	const int32_t w16 = width >> 4;

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// check each row
	uint32_t gridAlive = 0;

	for (int32_t h = 0; h < height; h++) {
		uint16_t *gridRow = grid + h * gridWidth;

		uint32_t rowAlive = 0;

		// check each column
		for (int32_t w = 0; w < w16; w++) {
			uint32_t input = *gridRow;

			// update row alive flag
			rowAlive |= input;

			// update column alive flag
			columnOccupied16[w] |= input;

			gridRow++;
		}

		// check if the row was alive
		if (rowAlive) {
			if (h < bottomY) {
				bottomY = h;
			}
			if (h > topY) {
				topY = h;
			}
			gridAlive |= rowAlive;
		}
	}

	// check if there were any cells
	if (gridAlive) {
		// update the bounding box
		(void) updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);

		// use rows calculated above
		shared[1] = bottomY;
		shared[3] = topY;
	} else {
		// set the box to the middle
		shared[0] = width >> 1;
		shared[1] = height >> 1;
		shared[2] = shared[0];
		shared[3] = shared[1];
	}

	leftX = shared[0] >> (tilePower + 4);
	bottomY = shared[1] >> tilePower;
	rightX = shared[2] >> (tilePower + 4);
	topY = shared[3] >> tilePower;

	uint16_t *fillGrid = shrinkNeeded ? tileGrid : nextTileGrid;

	for (int32_t h = bottomY; h <= topY; h++) {
		uint16_t *tileRow = fillGrid + h * tileGridWidth + leftX;

		for (int32_t w = leftX; w <= rightX; w++) {
			*tileRow = 65535;
			tileRow++;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
// reset the population from the bit grid
uint32_t resetPopulationBit(
	uint32_t *const grid,
	uint32_t gridWidth,
	uint32_t leftX,
	const uint32_t bottomY,
	uint32_t rightX,
	const uint32_t topY
) {
	// population count
	uint32_t population = 0;

	// convert x coordinates to 32 cell chunks
	leftX >>= 5;
	rightX >>= 5;
	gridWidth >>= 1;

	for (uint32_t y = bottomY; y <= topY; y++) {
		uint32_t *gridRow = grid + y * gridWidth;

		for (uint32_t x = leftX; x <= rightX; x++) {
			uint32_t bitCells = *(gridRow + x);

			population += __builtin_popcount(bitCells);
		}
	}

	return population;
}


EMSCRIPTEN_KEEPALIVE
// reset the initial colour grid from the bit grid for the normal renderer
void resetColourGridNormal(
	uint16_t *const grid,
	const uint32_t gridWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const uint32_t alive,
	uint32_t leftX,
	const uint32_t bottomY,
	uint32_t rightX,
	const uint32_t topY
) {
	// vector constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t aliveVec = wasm_u8x16_splat(alive);
	const v128_t maskVec = wasm_u64x2_splat(0x0102040810204080);	// mask to isolate cell bits

	// convert x coordinates to 16 cell chunks
	leftX >>= 4;
	rightX >>= 4;

	for (uint32_t y = bottomY; y <= topY; y++) {
		uint16_t *gridRow = grid + y * gridWidth;
		uint8_t *colourGridRow = colourGrid + y * colourGridWidth + (leftX << 4);

		for (uint32_t x = leftX; x <= rightX; x++) {
			// get the next 16 cells from the bit grid
			uint16_t bitCells = *(gridRow + x);

			if (bitCells) {
				// splat the upper and lower cell 8 bits across lanes
				// cells stores the lower 8 bits in the first byte and the upper in the second byte
				v128_t lower = wasm_u8x16_splat(bitCells >> 8);
				v128_t cells = wasm_u8x16_splat(bitCells & 0xff);

				// combine upper and lower into a single 128-bit vector
				cells = wasm_v8x16_shuffle(lower, cells, 0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23);

				// apply the bitmask to isolate individual bits in each lane
				cells = wasm_v128_and(cells, maskVec);

				// test for zero or non-zero in each lane to create 0 or 255
				cells = wasm_u8x16_gt(cells, zeroVec);

				// convert non-zero to 64
				cells = wasm_v128_and(cells, aliveVec);

				// store
				wasm_v128_store(colourGridRow, cells);
			} else {
				wasm_v128_store(colourGridRow, zeroVec);
			}

			colourGridRow += 16;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
// update the pens from the grid using alive or dead
void convertToPens2(
	uint8_t *const colourGrid,
	uint16_t *const colourTileHistoryGrid,
	uint16_t *const colourTileGrid,
	const int32_t tileY,
	const int32_t tileX,
	const int32_t tileRows,
	const int32_t tileCols,
	uint16_t *const grid,
	uint16_t *const tileGrid,
	const int32_t colourGridWidth
) {
	uint32_t bottomY = 0, topY = tileY;
	uint32_t tileRowOffset = 0;

	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;

	const uint32_t tileGridWidth = colourGridWidth >> 8;
	const uint32_t gridWidth = colourGridWidth >> 4;

	const v128_t zero = wasm_u8x16_splat(0);				// zero
	const v128_t penBaseSet = wasm_u8x16_splat(64);			// base pen color for newly set cells
	const v128_t mask = wasm_u64x2_splat(0x0102040810204080);	// mask to isolate cell bits

	// find each occupied tile
	for (int32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group
			uint16_t tiles = tileGrid[tw + tileRowOffset] | colourTileGrid[tw + tileRowOffset];
			uint16_t nextTiles = 0;

			// process each tile in the tile group
			while (tiles) {
				// get the next tile
				uint32_t b = 31 - __builtin_clz(tiles);
				tiles &= ~(1 << b);

				uint32_t currentX = leftX + xSize * (15 - b);
				uint32_t tileAlive = 0;

				const uint32_t colourRowOffset = (th << 4) * colourGridWidth;
				const uint32_t gridRowOffset = (th << 4) * gridWidth;

				uint32_t cr = currentX << 4;
				uint8_t *colourRow = colourGrid + cr + colourRowOffset;
				uint16_t *gridRow = grid + currentX + gridRowOffset;

				uint32_t h = bottomY;
				while (h < topY) {
					uint32_t nextCell = *gridRow;
					if (nextCell) {
						// expand the 16 bits into 16 lanes with a zero bit = 0 and a one bit = 255

						// splat the upper and lower cell 8 bits across lanes
						// cells stores the lower 8 bits in the first byte and the upper in the second byte
						v128_t lower = wasm_u8x16_splat(nextCell >> 8);
						v128_t cells = wasm_u8x16_splat(nextCell & 0xff);

						// combine upper and lower into a single 128-bit vector
						cells = wasm_v8x16_shuffle(lower, cells, 0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23);

						// apply the bitmask to isolate individual bits in each lane
						cells = wasm_v128_and(cells, mask);

						// test for zero or non-zero in each lane to create 0 or 255
						cells = wasm_u8x16_gt(cells, zero);

						// convert to 64 alive, 0 dead
						cells = wasm_v128_and(cells, penBaseSet);

						// store updated pens back to memory
						wasm_v128_store(colourRow, cells);

						// update the tile alive flags
						//cells = wasm_v128_or(cells, wasm_i32x4_shuffle(cells, cells, 1, 0, 3, 2));
						//cells = wasm_v128_or(cells, wasm_i32x4_shuffle(cells, cells, 2, 3, 0, 1));
						//tileAlive |= wasm_u32x4_extract_lane(cells, 0);
						tileAlive |= wasm_v128_any_true(cells);
					} else {
						wasm_v128_store(colourRow, zero);
					}

					h++;
					colourRow += colourGridWidth;
					gridRow += gridWidth;
				}

				// if any pens were alive then the tile is alive
				if (tileAlive) {
					nextTiles |= (1 << b);
				}
			}

			// save updated tiles
			colourTileGrid[tw + tileRowOffset] = nextTiles;
			colourTileHistoryGrid[tw + tileRowOffset] |= nextTiles;

			// next tile group
			leftX += xSize << 4;
		}

		// next tile row
		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// update the pens from the grid using cell age
void convertToPensAge(
	uint8_t *const colourGrid,
	uint16_t *const colourTileHistoryGrid,
	uint16_t *const colourTileGrid,
	const int32_t tileY,
	const int32_t tileX,
	const int32_t tileRows,
	const int32_t tileCols,
	uint16_t *const grid,
	uint16_t *const tileGrid,
	const int32_t colourGridWidth
) {
	uint32_t bottomY = 0, topY = tileY;
	uint32_t tileRowOffset = 0;

	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;

	const uint32_t tileGridWidth = colourGridWidth >> 8;
	const uint32_t gridWidth = colourGridWidth >> 4;

	const v128_t zero = wasm_u8x16_splat(0);				// zero
	const v128_t penBaseSet = wasm_u8x16_splat(64);			// base pen color for newly set cells
	const v128_t penMaxSet = wasm_u8x16_splat(127);			// maximum pen color for set cells after increment
	const v128_t penBaseClear = wasm_u8x16_splat(63);		// base pen color for newly cleared cells
	const v128_t penMinClear = wasm_u8x16_splat(1);			// minimum pen color for cleared cells after decrement
	const v128_t increment = wasm_u8x16_splat(1);			// increment/decrement by 1
	const v128_t mask = wasm_u64x2_splat(0x0102040810204080);	// mask to isolate cell bits

	// find each occupied tile
	for (int32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group
			uint16_t tiles = tileGrid[tw + tileRowOffset] | colourTileGrid[tw + tileRowOffset];
			uint16_t nextTiles = 0;

			// process each tile in the tile group
			while (tiles) {
				// get the next tile
				uint32_t b = 31 - __builtin_clz(tiles);
				tiles &= ~(1 << b);

				uint32_t currentX = leftX + xSize * (15 - b);
				uint32_t tileAlive = 0;

				const uint32_t colourRowOffset = (th << 4) * colourGridWidth;
				const uint32_t gridRowOffset = (th << 4) * gridWidth;

				uint32_t cr = currentX << 4;
				uint8_t *colourRow = colourGrid + cr + colourRowOffset;
				uint16_t *gridRow = grid + currentX + gridRowOffset;

				uint32_t h = bottomY;
				while (h < topY) {
					uint32_t nextCell = *gridRow;

					// expand the 16 bits into 16 lanes with a zero bit = 0 and a one bit = 255

					// splat the upper and lower cell 8 bits across lanes
					// cells stores the lower 8 bits in the first byte and the upper in the second byte
					v128_t lower = wasm_u8x16_splat(nextCell >> 8);
					v128_t cells = wasm_u8x16_splat(nextCell & 0xff);

					// combine upper and lower into a single 128-bit vector
					cells = wasm_v8x16_shuffle(lower, cells, 0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23);

					// apply the bitmask to isolate individual bits in each lane
					cells = wasm_v128_and(cells, mask);

					// test for zero or non-zero in each lane to create 0 or 255
					cells = wasm_u8x16_gt(cells, zero);

					// load the 16 pen values
					v128_t pens = wasm_v128_load(colourRow);

					// get a mask of which lanes are alive (i.e. pen value >= 64)
					v128_t pensIfAlive = wasm_u8x16_ge(pens, penBaseSet);

					// case 1: assume cells are alive
					//	pens < 64 become 64
					//	pens >= 64 increment to 127

					// increment the alive lanes and set dead lanes to 64
					v128_t pensAlive = wasm_v128_bitselect(wasm_i8x16_add(pens, increment), penBaseSet, pensIfAlive);

					// ensure increment didn't go above the maximum value of 127
					pensAlive = wasm_u8x16_min(pensAlive, penMaxSet);

					// case 2: assume cells are dead
					//	pens >= 64 become 63
					//	pens < 64 decrement to 1

					// determine which pens were originally 0 so we can ignore them during decrement saturation
					v128_t pensWereNotZero = wasm_u8x16_gt(pens, zero);

					// set alive lanes to 63 and decrement the dead lanes
					v128_t pensDead = wasm_v128_bitselect(penBaseClear, wasm_u8x16_sub_sat(pens, increment), pensIfAlive);

					// saturate dead lanes that were decremented to a minimum value of 1
					v128_t pensNeedingSat = wasm_u8x16_lt(pensDead, penMinClear);

					// remove any lanes that were originally 0
					pensNeedingSat = wasm_v128_and(pensNeedingSat, pensWereNotZero);
					pensDead = wasm_v128_bitselect(penMinClear, pensDead, pensNeedingSat);

					// now pick the dead or alive result based on the cells
					pens = wasm_v128_bitselect(pensAlive, pensDead, cells);

					// store updated pens back to memory
					wasm_v128_store(colourRow, pens);

					// update the tile alive flags
					pens = wasm_v128_or(pens, wasm_i32x4_shuffle(pens, pens, 1, 0, 3, 2));
					pens = wasm_v128_or(pens, wasm_i32x4_shuffle(pens, pens, 2, 3, 0, 1));
					tileAlive |= wasm_u32x4_extract_lane(pens, 0);

					h++;
					colourRow += colourGridWidth;
					gridRow += gridWidth;
				}

				// if any pens were > 1 then the tile is alive
				if (tileAlive & 0xfefefefe) {
					nextTiles |= (1 << b);
				}
			}

			// save updated tiles
			colourTileGrid[tw + tileRowOffset] = nextTiles;
			colourTileHistoryGrid[tw + tileRowOffset] |= nextTiles;

			// next tile group
			leftX += xSize << 4;
		}

		// next tile row
		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// update the pens from the grid using neighbour count
void convertToPensNeighbours(
	uint8_t *const colourGrid,
	uint16_t *const colourTileHistoryGrid,
	uint16_t *const colourTileGrid,
	const int32_t tileY,
	const int32_t tileX,
	const int32_t tileRows,
	const int32_t tileCols,
	uint16_t *const grid,
	uint16_t *const tileGrid,
	const int32_t colourGridWidth
) {
	uint32_t bottomY = 0, topY = tileY;
	uint32_t tileRowOffset = 0;

	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;

	const uint32_t tileGridWidth = colourGridWidth >> 8;
	const uint32_t gridWidth = colourGridWidth >> 4;

	const v128_t zeroVec = wasm_u8x16_splat(0);				// zero
	const v128_t oneVec = wasm_u8x16_splat(1);				// one
	const v128_t penBaseSet = wasm_u8x16_splat(64);				// base pen color for newly set cells
	const v128_t maskVec = wasm_u64x2_splat(0x0102040810204080);	// mask to isolate cell bits
	const v128_t leftVec = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15);
	const v128_t rightVec = wasm_u8x16_make(0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);

	// find each occupied tile
	for (int32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group
			uint16_t tiles = tileGrid[tw + tileRowOffset] | colourTileGrid[tw + tileRowOffset];
			uint16_t nextTiles = 0;

			// process each tile in the tile group
			while (tiles) {
				// get the next tile
				uint32_t b = 31 - __builtin_clz(tiles);
				tiles &= ~(1 << b);

				uint32_t currentX = leftX + xSize * (15 - b);
				uint32_t tileAlive = 0;

				const uint32_t colourRowOffset = (th << 4) * colourGridWidth;
				const uint32_t gridRowOffset = (th << 4) * gridWidth;

				uint32_t cr = currentX << 4;
				uint8_t *colourRow = colourGrid + cr + colourRowOffset;
				uint16_t *gridRow = grid + currentX + gridRowOffset;

				uint32_t h = bottomY;

				// vectors
				v128_t aboveVec;
				v128_t midVec;
				v128_t belowVec;
				v128_t lower;
				v128_t cells;
				v128_t aliveCells;
				v128_t pens;

				while (h < topY) {
					uint32_t midCells = *gridRow;

					if (midCells) {
						// expand the 16 bits into 16 lanes with a zero bit = 0 and a one bit = 255
						// splat the upper and lower cell 8 bits across lanes
						// cells stores the lower 8 bits in the first byte and the upper in the second byte
						lower = wasm_u8x16_splat(midCells >> 8);
						cells = wasm_u8x16_splat(midCells & 0xff);
	
						// combine upper and lower into a single 128-bit vector
						cells = wasm_v8x16_shuffle(lower, cells, 0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23);
	
						// apply the bitmask to isolate individual bits in each lane
						cells = wasm_v128_and(cells, maskVec);
	
						// test for zero or non-zero in each lane to create 0 or 255
						aliveCells = wasm_u8x16_gt(cells, zeroVec);
	
						// get middle row as 0 or 1 in each lane
						midVec = wasm_v128_and(aliveCells, oneVec);

						// get above lanes
						uint32_t aboveCells = *(gridRow - gridWidth);
						lower = wasm_u8x16_splat(aboveCells >> 8);
						cells = wasm_u8x16_splat(aboveCells & 0xff);
						cells = wasm_v8x16_shuffle(lower, cells, 0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23);
						cells = wasm_v128_and(cells, maskVec);
						cells = wasm_u8x16_gt(cells, zeroVec);
						aboveVec = wasm_v128_and(cells, oneVec);

						// get below lanes
						uint32_t belowCells = *(gridRow + gridWidth);
						lower = wasm_u8x16_splat(belowCells >> 8);
						cells = wasm_u8x16_splat(belowCells & 0xff);
						cells = wasm_v8x16_shuffle(lower, cells, 0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23);
						cells = wasm_v128_and(cells, maskVec);
						cells = wasm_u8x16_gt(cells, zeroVec);
						belowVec = wasm_v128_and(cells, oneVec);

						// get x5 versions: v5 = v + (v << 2)
						v128_t above5Vec = wasm_i8x16_add(aboveVec, wasm_i8x16_shl(aboveVec, 2));
						v128_t mid5Vec = wasm_i8x16_add(midVec, wasm_i8x16_shl(midVec, 2));
						v128_t below5Vec = wasm_i8x16_add(belowVec, wasm_i8x16_shl(belowVec, 2));
	
						// apply the following weighted neighbourhood
						// 1 5 1
						// 5 0 5
						// 1 5 1
	
						// above row = shifted one lane left + shifted one lane right + lane x 5
						aboveVec = wasm_i8x16_add(
							wasm_i8x16_swizzle(aboveVec, leftVec),
							wasm_i8x16_swizzle(aboveVec, rightVec)
						);
						aboveVec = wasm_i8x16_add(aboveVec, above5Vec);
	
						// middle row = shifted one lane left x 5 + shifted one lane right x 5
						midVec = wasm_i8x16_add(
							wasm_i8x16_swizzle(mid5Vec, leftVec),
							wasm_i8x16_swizzle(mid5Vec, rightVec)
						);

						// below row = shifted one lane left + shiftged one lane right + lane x 5
						belowVec = wasm_i8x16_add(
							wasm_i8x16_swizzle(belowVec, leftVec),
							wasm_i8x16_swizzle(belowVec, rightVec)
						);
						belowVec = wasm_i8x16_add(belowVec, below5Vec);

						// add the three rows
						pens = wasm_i8x16_add(aboveVec, midVec);
						pens = wasm_i8x16_add(pens, belowVec);

						// add the constant
						pens = wasm_i8x16_add(pens, penBaseSet);

						// now remove any dead cells
						pens = wasm_v128_bitselect(pens, zeroVec, aliveCells);

						// handle left hand side
						if (midCells & 32768) {
							// get the existing sum from the left lane
							uint8_t sum = wasm_u8x16_extract_lane(pens, 0);

							// subtract the middle column values
							sum -= (aboveCells >> 15) + 5 * (midCells >> 15) + (belowCells >> 15);

							// add the values from the right hand column of the tile to the left
							sum += (*(gridRow - gridWidth - 1) & 1) + 5 * (*(gridRow - 1) & 1) + (*(gridRow + gridWidth - 1) & 1);

							// update the left lane
							pens = wasm_u8x16_replace_lane(pens, 0, sum);
						}

						// handle right hand side
						if (midCells & 1) {
							// get the existing sum from the right lane
							uint8_t sum = wasm_u8x16_extract_lane(pens, 15);

							// subtract the middle column values
							sum -= (aboveCells & 1) + 5 * (midCells & 1) + (belowCells & 1);

							// add the values from the left hand column of the tile to the right
							sum += (*(gridRow - gridWidth + 1) >> 15) + (*(gridRow + 1) >> 15) * 5 + (*(gridRow + gridWidth + 1) >> 15);

							// update the right lane
							pens = wasm_u8x16_replace_lane(pens, 15, sum);
						}

						// store updated pens back to memory
						wasm_v128_store(colourRow, pens);

						// update the tile alive flags
						tileAlive |= wasm_v128_any_true(pens);
					} else {
						wasm_v128_store(colourRow, zeroVec);
					}

					h++;
					colourRow += colourGridWidth;
					gridRow += gridWidth;
				}

				// if any pens were > 1 then the tile is alive
				if (tileAlive & 0xfefefefe) {
					nextTiles |= (1 << b);
				}
			}

			// save updated tiles
			colourTileGrid[tw + tileRowOffset] = nextTiles;
			colourTileHistoryGrid[tw + tileRowOffset] |= nextTiles;

			// next tile group
			leftX += xSize << 4;
		}

		// next tile row
		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


// Function to vectorize the update of the colour grid, including population, births, and deaths
EMSCRIPTEN_KEEPALIVE
void nextGenerationGenerations(
	uint8_t *const colourGrid,
	uint16_t *const colourTileHistoryGrid,
	uint16_t *const colourTileGrid,
	const int32_t tileY,
	const int32_t tileX,
	const int32_t tileRows,
	const int32_t tileCols,
	uint16_t *const grid,
	uint16_t *const tileGrid,
	const int32_t colourGridWidth,
	uint32_t *shared,
	const uint32_t deadState,
	const uint32_t maxGenState,
	const uint32_t minDeadState,
	const uint32_t width,
	const uint32_t height
) {
	uint32_t bottomY = 0, topY = tileY;
	uint32_t tileRowOffset = 0;

	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;

	const uint32_t tileGridWidth = colourGridWidth >> 8;
	const uint32_t gridWidth = colourGridWidth >> 4;

	const v128_t zeroVec = wasm_u8x16_splat(0);				// zero
	const v128_t oneVec = wasm_u8x16_splat(1);				// one
	const v128_t deadStateVec = wasm_u8x16_splat(deadState);		// newly dead state
	const v128_t maxGenStateVec = wasm_u8x16_splat(maxGenState);	// state for alive cell
	const v128_t minDeadStateVec = wasm_u8x16_splat(minDeadState);	// minimum dead state
	const v128_t maskVec = wasm_u64x2_splat(0x0102040810204080);	// mask to isolate cell bits
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// bounding box
	uint32_t newLeftX = width;
	uint32_t newRightX = 0;
	uint32_t newBottomY = height;
	uint32_t newTopY = 0;

	// population statistics
	uint32_t population = 0;
	uint32_t births = 0;
	uint32_t deaths = 0;

	// find each occupied tile group
	for (int32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;
		const uint32_t gridRowOffset = (th << 4) * gridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group
			uint16_t tiles = tileGrid[tw + tileRowOffset] | colourTileGrid[tw + tileRowOffset];
			uint16_t nextTiles = 0;

			// process each tile in the tile group
			while (tiles) {
				// get the next tile
				uint32_t b = 31 - __builtin_clz(tiles);
				tiles &= ~(1 << b);

				uint32_t currentX = leftX + xSize * (15 - b);
				uint32_t tileAlive = 0;

				uint32_t cr = currentX << 4;
				uint8_t *colourRow = colourGrid + colourRowOffset + cr;
				uint16_t *gridRow = grid + currentX + gridRowOffset;

				// process each row of the tile
				uint32_t h = bottomY;
				while (h < topY) {
					// get the next 16 cells from the grid evolution (bits)
					uint32_t nextCell = *gridRow;

					// expand the 16 bits into 16 lanes with a zero bit = 0 and a one bit = 255

					// cells stores the lower 8 bits in the first byte and the upper in the second byte
					// combine upper and lower into a single 128-bit vector
					v128_t cells = wasm_v8x16_shuffle(
						wasm_u8x16_splat(nextCell >> 8),
						wasm_u8x16_splat(nextCell & 0xff),
						0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23
					);

					// apply the bitmask to isolate individual bits in each lane
					cells = wasm_v128_and(cells, maskVec);

					// test for zero or non-zero in each lane to create 0 or 255
					cells = wasm_u8x16_gt(cells, zeroVec);

					// load the colour cells from last generation
					v128_t colourVec = wasm_v128_load(colourRow);
					const v128_t origColourVec = wasm_i8x16_eq(colourVec, maxGenStateVec);

					// find which cells are (<= deadState || == maxGenState) && alive in bit cells
					// these will be set to maxGenState
					v128_t setToAliveMask = wasm_v128_and(
						cells,
						wasm_v128_or(
							wasm_i8x16_le(colourVec, deadStateVec),
							wasm_i8x16_eq(colourVec, maxGenStateVec)
						)
					);

					// the other cells will decrement if they are bigger than minDeadState
					// and their bit cells cleared
					v128_t biggerThanMinMask = wasm_u8x16_gt(colourVec, minDeadStateVec);
					v128_t decrementedValues = wasm_u8x16_sub_sat(colourVec, wasm_v128_and(biggerThanMinMask, oneVec));

					// set the alive cells to maxGenState and the others to the decremented values
					v128_t newColourVec = wasm_v128_bitselect(maxGenStateVec, decrementedValues, setToAliveMask);

					// update the population from the cells alive bitmask population count
					uint32_t aliveCells = wasm_i8x16_bitmask(wasm_i8x16_swizzle(setToAliveMask, reverseVec));
					population += __builtin_popcount(aliveCells);

					// update births and deaths
					births += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(setToAliveMask, origColourVec)));
					deaths += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(origColourVec, setToAliveMask)));

					// store updated cell colours
					wasm_v128_store(colourRow, newColourVec);

					// update cell bit grid
					*gridRow = aliveCells;

					// determine if any cells in the row are non-zero
					if (wasm_v128_any_true(wasm_i8x16_gt(newColourVec, minDeadStateVec))) {
						tileAlive = 1;

						// check if any cells in the row are alive
						uint32_t aliveBits = wasm_i8x16_bitmask(wasm_i8x16_gt(newColourVec, deadStateVec));

						// compute the left and right most occupied cell
						if (aliveBits) {
							uint32_t leftMost = 31 - __builtin_clz(aliveBits);
							uint32_t rightMost = __builtin_ctz(aliveBits);

							// update the min and max X
							if ((currentX << 4) + rightMost < newLeftX) {
								newLeftX = (currentX << 4) + rightMost;
							}
							if ((currentX << 4) + leftMost > newRightX) {
								newRightX = (currentX << 4) + leftMost;
							}
						}

						if (h < newBottomY) {
							newBottomY = h;
						}
						if (h > newTopY) {
							newTopY = h;
						}
					}

					// next row
					h++;
					colourRow += colourGridWidth;
					gridRow += gridWidth;
				}

				// update tile bits if this tile has occupied cells
				if (tileAlive) {
					nextTiles |= (1 << b);
				}
			}

			leftX += xSize << 4;
			colourTileGrid[tw + tileRowOffset] = nextTiles;
			colourTileHistoryGrid[tw + tileRowOffset] |= nextTiles;
		}

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;
	*shared++ = newLeftX;
	*shared++ = newBottomY;
	*shared++ = newRightX;
	*shared++ = newTopY;
}


EMSCRIPTEN_KEEPALIVE
// update the life grid region using tiles
void nextGeneration(
	uint16_t *const grid16,
	uint16_t *const nextGrid16,
	const uint32_t gridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	const uint32_t tileGridWidth,
	uint8_t *const indexLookup631,
	uint8_t *const indexLookup632,
	const uint32_t altSpecified,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	const uint32_t width,
	const uint32_t height,
	const uint32_t tileX,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileWidth,
	uint16_t *const blankRow16,
	const int32_t bWidth,
	const int32_t bHeight,
	const int32_t boundedGridType,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	const uint32_t tileGridWholeBytes,
	uint32_t *shared
) {
	uint32_t h;
	uint32_t val0, val1, val2;
	uint32_t output;
	uint32_t belowNextTiles, aboveNextTiles;
	uint32_t origValue, tileCells;
	const uint32_t width16 = width >> 4;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width in 16 bit chunks
	const uint32_t xSize = tileX >> 1;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// flags for edges of tile occupied
	uint32_t neighbours = 0;

	// bottom left
	const uint32_t bLeftX = (width - bWidth) / 2;
	const uint32_t bBottomY = (height - bHeight) / 2;

	// top right
	const uint32_t bRightX = bLeftX + bWidth - 1;
	const uint32_t bTopY = bBottomY + bHeight - 1;

	// grid
	uint16_t *grid = grid16;
	uint16_t *nextGrid = nextGrid16;
	uint16_t *tileGrid = tileGrid16;
	uint16_t *nextTileGrid = nextTileGrid16;
	uint8_t *indexLookup63 = indexLookup631;

	// switch buffers each generation
	if ((counter & 1) != 0) {
		grid = nextGrid16;
		nextGrid = grid16;
		tileGrid = nextTileGrid16;
		nextTileGrid = tileGrid16;

		// get alternate lookup buffer if specified
		if (altSpecified) {
			indexLookup63 = indexLookup632;
		}
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridWholeBytes);

	// scan each row of tiles
	for (uint32_t th = 0; th < height >> 4; th++) {
		// set initial tile column
		uint32_t leftX = 0;

		// get the tile row
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = tileRow[tw];
			uint32_t currentX = leftX;

			// check if any are occupied
			if (tiles) {
				// get the destination (with any set because of edges)
				uint32_t nextTiles = nextTileRow[tw];
				belowNextTiles = belowNextTileRow[tw];
				aboveNextTiles = aboveNextTileRow[tw];

				uint16_t *gridRow0 = NULL;
				uint16_t *gridRow1 = NULL;
				uint16_t *gridRow2 = NULL;
				uint16_t *nextRow = NULL;

				// compute next generation for each set tile
				while (tiles) {
					uint32_t b = 31 - __builtin_clz(tiles);
					tiles &= ~(1 <<  b);

					leftX = currentX + xSize * (15 - b);

					// mark no cells in this column
					uint32_t colOccupied = 0;

					// mark no cells in the tile rows
					uint32_t rowOccupied = 0;

					// clear the edge flags
					neighbours = 0;

					// process the bottom row of the tile
					h = bottomY;
					uint32_t rowIndex = 32768;

					// current row
					gridRow1 = grid + h * gridWidth + leftX;

					// deal with bottom row of the grid
					if (h == 0) {
						gridRow0 = blankRow16;
					} else {
						gridRow0 = gridRow1 - gridWidth;
					}

					// next row
					gridRow2 = gridRow1 + gridWidth;

					// row in destination grid
					nextRow = nextGrid + h * gridWidth + leftX;

					// get original value (used for top row only and then to determine if any cells were alive in tile)
					origValue = *gridRow1;

					// mix of original cells and cells computed in this tile
					tileCells = origValue;

					// check if at left edge of grid
					if (!leftX) {
						// process left edge tile first row
						val0 = (*gridRow0 << 1) | (*(gridRow0 + 1) >> 15);
						val1 = (origValue << 1) | (*(gridRow1 + 1) >> 15);
						val2 = (*gridRow2 << 1) | (*(gridRow2 + 1) >> 15);
						output = val0 | val1 | val2;
						if (output) {
							// get first 4 bits
							output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

							// add three sets of 4 bits
							output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
							output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
							output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

							// check if any cells are set
							if (output) {
								// update row and column occupied flags
								colOccupied |= output;
								rowOccupied |= rowIndex;

								// check for right column now set
								if (output & 1) {
									neighbours |= bottomRightSet;
								}

								// bottom row set
								neighbours |= bottomSet;

								// update population
								population += __builtin_popcount(output);
							}
						}

						// save output 16bits
						*nextRow = output;
						nextRow += gridWidth;

						// update statistics
						if (output | origValue) {
							births += __builtin_popcount(output & ~origValue);
							deaths += __builtin_popcount(origValue & ~output);
						}

						// process left edge tile middle rows
						h++;
						rowIndex >>= 1;
						while (h < topY - 1) {
							// get original value for next row
							origValue = *gridRow2;
							tileCells |= origValue;

							// next row
							gridRow2 += gridWidth;

							// read three rows
							val0 = val1;
							val1 = val2;
							val2 = (*gridRow2 << 1) | (*(gridRow2 + 1) >> 15);
							output = val0 | val1 | val2;
							if (output) {
								// get first 4 bits
								output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

								// add three sets of 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

								// check if any cells are set
								if (output) {
									// update row and column occupied flags
									colOccupied |= output;
									rowOccupied |= rowIndex;

									// update population
									population += __builtin_popcount(output);
								}
							}

							// save output 16bits
							*nextRow = output;
							nextRow += gridWidth;

							// update statistics
							if (output | origValue) {
								births += __builtin_popcount(output & ~origValue);
								deaths += __builtin_popcount(origValue & ~output);
							}

							// next row
							h++;
							rowIndex >>= 1;
						}

						// process left edge last row
						origValue = *gridRow2;
						tileCells |= origValue;

						// deal with top row
						if (h == height - 1) {
							gridRow2 = blankRow16;
						} else {
							gridRow2 += gridWidth;
						}

						// read three rows
						val0 = val1;
						val1 = val2;
						val2 = (*gridRow2 << 1) | (*(gridRow2 + 1) >> 15);
						output = val0 | val1 | val2;
						if (output) {
							// get first 4 bits
							output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

							// get next 4 bits
							output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
							output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
							output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

							// check if any cells are set
							if (output) {
								// update row and column occupied flags
								colOccupied |= output;
								rowOccupied |= rowIndex;

								// update population
								population += __builtin_popcount(output);

								// check for right column now set
								if (output & 1) {
									neighbours |= topRightSet;
								}

								// top row set
								neighbours |= topSet;
							}
						}

						// save output 16bits
						*nextRow = output;
						nextRow += gridWidth;

						// update statistics
						if (output | origValue) {
							births += __builtin_popcount(output & ~origValue);
							deaths += __builtin_popcount(origValue & ~output);
						}
					} else {
						// check if at right edge
						if (leftX >= width16 - 1) {
							// process right edge tile first row
							val0 = ((*(gridRow0 - 1) & 1) << 17) | (*gridRow0 << 1);
							val1 = ((*(gridRow1 - 1) & 1) << 17) | (origValue << 1);
							val2 = ((*(gridRow2 - 1) & 1) << 17) | (*gridRow2 << 1);
							output = val0 | val1 | val2;
							if (output) {
								// get first 4 bits
								output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

								// add three sets of 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

								// check if any cells are set
								if (output) {
									// update row and column occupied flags
									colOccupied |= output;
									rowOccupied |= rowIndex;

									// update population
									population += __builtin_popcount(output);

									// check for left column now set
									if (output & 32768) {
										neighbours |= bottomLeftSet;
									}

									// bottom row set
									neighbours |= bottomSet;
								}
							}

							// save output 16bits
							*nextRow = output;
							nextRow += gridWidth;

							// update statistics
							if (output | origValue) {
								births += __builtin_popcount(output & ~origValue);
								deaths += __builtin_popcount(origValue & ~output);
							}

							// process left edge tile middle rows
							h++;
							rowIndex >>= 1;

							while (h < topY - 1) {
								// get original value for next row
								origValue = *gridRow2;
								tileCells |= origValue;

								// next row
								gridRow2 += gridWidth;

								// read three rows
								val0 = val1;
								val1 = val2;
								val2 = ((*(gridRow2 - 1) & 1) << 17) | (*gridRow2 << 1);
								output = val0 | val1 | val2;
								if (output) {
									// get first 4 bits
									output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

									// check if any cells are set
									if (output) {
										// update row and column occupied flags
										colOccupied |= output;
										rowOccupied |= rowIndex;

										// update population
										population += __builtin_popcount(output);
									}
								}

								// save output 16bits
								*nextRow = output;
								nextRow += gridWidth;

								// update statistics
								if (output | origValue) {
									births += __builtin_popcount(output & ~origValue);
									deaths += __builtin_popcount(origValue & ~output);
								}

								// next row
								h++;
								rowIndex >>= 1;
							}

							// process left edge last row
							origValue = *gridRow2;
							tileCells |= origValue;

							// deal with top row
							if (h == height - 1) {
								gridRow2 = blankRow16;
							} else {
								gridRow2 += gridWidth;
							}

							// read three rows
							val0 = val1;
							val1 = val2;
							val2 = ((*(gridRow2 - 1) & 1) << 17) | (*gridRow2 << 1);
							output = val0 | val1 | val2;
							if (output) {
								// get first 4 bits
								output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

								// get next 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

								// check if any cells are set
								if (output) {
									// update row and column occupied flags
									colOccupied |= output;
									rowOccupied |= rowIndex;

									// update population
									population += __builtin_popcount(output);

									// check for left column now set
									if (output & 32768) {
										neighbours |= topLeftSet;
									}

									// top row set
									neighbours |= topSet;
								}
							}

							// save output 16bits
							*nextRow = output;
							nextRow += gridWidth;

							// update statistics
							if (output | origValue) {
								births += __builtin_popcount(output & ~origValue);
								deaths += __builtin_popcount(origValue & ~output);
							}
						} else {
							// process normal tile
							val0 = ((*(gridRow0 - 1) & 1) << 17) | (*gridRow0 << 1) | (*(gridRow0 + 1) >> 15);
							val1 = ((*(gridRow1 - 1) & 1) << 17) | (origValue << 1) | (*(gridRow1 + 1) >> 15);
							val2 = ((*(gridRow2 - 1) & 1) << 17) | (*gridRow2 << 1) | (*(gridRow2 + 1) >> 15);
							output = val0 | val1 | val2;
							if (output) {
								// get first 4 bits
								output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

								// add three sets of 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

								// check if any cells are set
								if (output) {
									// update row and column occupied flags
									colOccupied |= output;
									rowOccupied |= rowIndex;

									// update population
									population += __builtin_popcount(output);

									// check for left column now set
									if (output & 32768) {
										neighbours |= bottomLeftSet;
									}

									// check for right column now set
									if (output & 1) {
										neighbours |= bottomRightSet;
									}

									// bottom row set
									neighbours |= bottomSet;
								}
							}

							// save output 16bits
							*nextRow = output;
							nextRow += gridWidth;

							// update statistics
							if (output | origValue) {
								births += __builtin_popcount(output & ~origValue);
								deaths += __builtin_popcount(origValue & ~output);
							}

							// process middle rows of the tile
							h++;
							rowIndex >>= 1;

							while (h < topY - 1) {
								// get original value for next row
								origValue = *gridRow2;
								tileCells |= origValue;

								// next row
								gridRow2 += gridWidth;

								// read three rows
								val0 = val1;
								val1 = val2;
								val2 = ((*(gridRow2 - 1) & 1) << 17) | (*gridRow2 << 1) | (*(gridRow2 + 1) >> 15);
								output = val0 | val1 | val2;
								if (output) {
									// get first 4 bits
									output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

									// check if any cells are set
									if (output) {
										// update row and column occupied flags
										colOccupied |= output;
										rowOccupied |= rowIndex;

										// update population
										population += __builtin_popcount(output);
									}
								}

								// save output 16bits
								*nextRow = output;
								nextRow += gridWidth;

								// update statistics
								if (output | origValue) {
									births += __builtin_popcount(output & ~origValue);
									deaths += __builtin_popcount(origValue & ~output);
								}

								// next row
								h++;
								rowIndex >>= 1;
							}

							// get original value
							origValue = *gridRow2;
							tileCells |= origValue;

							// deal with top row
							if (h == height - 1) {
								gridRow2 = blankRow16;
							} else {
								gridRow2 += gridWidth;
							}

							// read three rows
							val0 = val1;
							val1 = val2;
							val2 = ((*(gridRow2 - 1) & 1) << 17) | (*gridRow2 << 1) | (*(gridRow2 + 1) >> 15);
							output = val0 | val1 | val2;
							if (output) {
								// get first 4 bits
								output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

								// get next 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

								// check if any cells are set
								if (output) {
									// update row and column occupied flag
									colOccupied |= output;
									rowOccupied |= rowIndex;

									// update population
									population += __builtin_popcount(output);

									// check for left column now set
									if (output & 32768) {
										neighbours |= topLeftSet;
									}

									// check for right column now set
									if (output & 1) {
										neighbours |= topRightSet;
									}

									// top row set
									neighbours |= topSet;
								}
							}

							// save output 16bits
							*nextRow = output;
							nextRow += gridWidth;

							// update statistics
							if (output | origValue) {
								births += __builtin_popcount(output & ~origValue);
								deaths += __builtin_popcount(origValue & ~output);
							}
						}
					}

					// check which columns contained cells
					if (colOccupied) {
						// check for left column set
						if (colOccupied & 32768) {
							neighbours |= leftSet;
						}

						// check for right column set
						if (colOccupied & 1) {
							neighbours |= rightSet;
						}
					}

					// save the column occupied cells
					columnOccupied16[leftX] |= colOccupied;

					// check if the source or output were alive
					if (colOccupied || tileCells) {
						// update
						nextTiles |= (1 << b);

						// check for neighbours
						if (neighbours) {
							// check whether left edge occupied
							if (neighbours & leftSet) {
								if (b < 15) {
									nextTiles |= (1 << (b + 1));
								} else {
									// set in previous set if not at left edge
									if ((tw > 0) && (leftX > 0)) {
										nextTileRow[tw - 1] |= 1;
									}
								}
							}

							// check whether right edge occupied
							if (neighbours & rightSet) {
								if (b > 0) {
									nextTiles |= (1 << (b - 1));
								} else {
									// set carry over to go into next set if not at right edge
									if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
										nextTileRow[tw + 1] |= (1 << 15);
									}
								}
							}

							// check whether bottom edge occupied
							if (neighbours & bottomSet) {
								// set in lower tile set
								belowNextTiles |= (1 << b);
							}

							// check whether top edge occupied
							if (neighbours & topSet) {
								// set in upper tile set
								aboveNextTiles |= (1 << b);
							}

							// check whether bottom left occupied
							if (neighbours & bottomLeftSet) {
								if (b < 15) {
									belowNextTiles |= (1 << (b + 1));
								} else {
									if ((tw > 0) && (leftX > 0)) {
										belowNextTileRow[tw - 1] |= 1;
									}
								}
							}

							// check whether bottom right occupied
							if (neighbours & bottomRightSet) {
								if (b > 0) {
									belowNextTiles |= (1 << (b - 1));
								} else {
									if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
										belowNextTileRow[tw + 1] |= (1 << 15);
									}
								}
							}

							// check whether top left occupied
							if (neighbours & topLeftSet) {
								if (b < 15) {
									aboveNextTiles |= (1 << (b + 1));
								} else {
									if ((tw > 0) && (leftX > 0)) {
										aboveNextTileRow[tw - 1] |= 1;
									}
								}
							}

							// check whether top right occupied
							if (neighbours & topRightSet) {
								if (b > 0) {
									aboveNextTiles |= (1 << (b - 1));
								} else {
									if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
										aboveNextTileRow[tw + 1] |= (1 << 15);
									}
								}
							}
						}
					}

					// save the row occupied falgs
					rowOccupied16[th] |= rowOccupied;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			}

			// next tile set
			leftX = currentX + (xSize << 4);
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// remove bounded grid column and row entries (+1 in all directions)
	if (boundedGridType != -1) {
		if (bWidth != 0) {
			columnOccupied16[(bLeftX - 1) >> 4] &= ~(1 << (~(bLeftX - 1) & 15));
			columnOccupied16[(bRightX + 1) >> 4] &= ~(1 << (~(bRightX + 1) & 15));
			columnOccupied16[(bLeftX - 2) >> 4] &= ~(1 << (~(bLeftX - 2) & 15));
			columnOccupied16[(bRightX + 2) >> 4] &= ~(1 << (~(bRightX + 2) & 15));
		}
		if (bHeight != 0) {
			rowOccupied16[(bBottomY - 1) >> 4] &= ~(1 << (~(bBottomY - 1) & 15));
			rowOccupied16[(bTopY + 1) >> 4] &= ~(1 << (~(bTopY + 1) & 15));
			rowOccupied16[(bBottomY - 2) >> 4] &= ~(1 << (~(bBottomY - 2) & 15));
			rowOccupied16[(bTopY + 2) >> 4] &= ~(1 << (~(bTopY + 2) & 15));
		}
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileWidth * sizeof(*blankTileRow));

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute super rule next generation (after state 0 and 1) for Moore neighbourhood
void nextGenerationSuperMoore(
	uint16_t *const grid16,
	uint16_t *const nextGrid16,
	const uint32_t gridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileGrid,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	uint8_t *const colourGrid8,
	uint8_t *const nextColourGrid8,
	const uint32_t colourGridWidth,
	uint16_t *const columnOccupied16,
	uint16_t *const columnAliveOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	uint16_t *const rowAliveOccupied16,
	const uint32_t rowOccupiedWidth,
	const uint32_t width,
	const uint32_t height,
	const uint32_t tileX,
	const uint32_t ySize,
	const uint32_t tileCols,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	uint32_t population,
	uint32_t births,
	uint32_t deaths,
	uint32_t *shared
) {
	uint32_t c, e, value;
	uint32_t ccol, rcol;
	int32_t calc;

	// constants
	const uint32_t aliveWith14 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 7) | (1 << 9) | (1 << 11) | (1 << 13) | (1 << 14) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t aliveWith14or18 = aliveWith14 | (1 << 18);
	const uint32_t alive1or3or5or7 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 7);
	const uint32_t alive9to25 = (1 << 9) | (1 << 11) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive1or3or5or9or11 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 9) | (1 << 11);
	const uint32_t alive7or13or15or17or19or21or23or25 = (1 << 7) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive1or5or7or9or11 = (1 << 1) | (1 << 5) | (1 << 7) | (1 << 9) | (1 << 11);
	const uint32_t alive13or15or17or19or21or23or25 = (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive9or11 = (1 << 9) | (1 << 11);
	const uint32_t alive1or3or5or13or15or17or19or21or23or25 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);

	// tile width in 16 bit chunks
	const uint32_t xSize = tileX >> 1;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// grid
	uint16_t *grid = grid16;
	uint16_t *tileGrid = tileGrid16;
	uint8_t *colourGrid = nextColourGrid8;
	uint8_t *outputGrid = colourGrid8;

	// select the correct grid
	if (counter & 1) {
		grid = nextGrid16;
		tileGrid = nextTileGrid16;
		colourGrid = colourGrid8;
		outputGrid = nextColourGrid8;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));
	memset(columnAliveOccupied16, 0, columnOccupiedWidth * sizeof(*columnAliveOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));
	memset(rowAliveOccupied16, 0, rowOccupiedWidth * sizeof(*rowAliveOccupied16));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < height >> 4; th++) {
		// set initial tile column
		uint32_t leftX = 0;

		// get the tile row and colour tile rows
		uint16_t *tileGridRow = tileGrid + th * tileGridWidth;
		uint16_t *colourTileRow = colourTileGrid + th * tileGridWidth;
		uint16_t *colourTileHistoryRow = colourTileHistoryGrid + th * tileGridWidth;

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = tileGridRow[tw] | colourTileRow[tw];
			uint32_t currentX = leftX;
			uint32_t origTiles = tiles;

			// compute next colour for each tile in the set
			while (tiles) {
				uint32_t b = 31 - __builtin_clz(tiles);
				tiles &= ~(1 << b);

				leftX = currentX + xSize * (15 - b);

				// mark no cells in this column
				uint32_t colOccupied = 0;
				uint32_t colAliveOccupied = 0;

				// mark no cells in the tile rows
				uint32_t rowOccupied = 0;
				uint32_t rowAliveOccupied = 0;
				uint32_t rowIndex = 32768;

				// clear type mask
				uint32_t typeMask = 0;

				// process each row
				for (uint32_t h = bottomY; h < topY; h++) {
					// get correct starting colour index
					uint32_t cr = (leftX << 4);

					// get the grid and colour grid row
					uint16_t *gridRow = grid + h * gridWidth + leftX;
					uint8_t *colourGridRow = colourGrid + h * colourGridWidth + cr;
					uint8_t *aboveRow = colourGridRow - colourGridWidth;
					uint8_t *belowRow = colourGridRow + colourGridWidth;

					// deal with bottom row of the grid
					if (h == 0) {
						aboveRow = blankColourRow;
					}
					if (h == height - 1) {
						belowRow = blankColourRow;
					}

					// destination to write bit cells
					uint8_t *destRow = outputGrid + h * colourGridWidth + cr;

					// get initial neighbours
					uint32_t lcol = 0;
					if (cr == 0) {
						c = 0;
						ccol = 0;
					} else {
						c = *(colourGridRow - 1);
						ccol = (1 << *(aboveRow - 1)) | (1 << c) | (1 << *(belowRow - 1));
					}
					e = *colourGridRow;
					rcol = (1 << e) | (1 << *belowRow) | (1 << *aboveRow);

					// process each 16bit chunk (16 cells) along the row
					uint32_t nextCell = *gridRow;

					// process each cell in the chunk
					uint32_t colIndex = 1 << 15;
					while (colIndex > 0) {
						// get next column
						colourGridRow++;
						belowRow++;
						aboveRow++;

						// shift neighbourhood left
						c = e;
						e = *colourGridRow;
						lcol = ccol;
						ccol = rcol;
						rcol = (1 << e) | (1 << *belowRow) | (1 << *aboveRow);
						value = c;

						// typemask has a bit set per state in the neighbouring cells
						typeMask = lcol | ccol | rcol;

						// handle state 6
						bool process = true;

						if (typeMask & (1 << 6)) {
							process = false;

							if (c == 1) {
								value = 2;
							} else if (c == 3 || c == 5) {
								value = 9;
							} else if (c == 7 || c == 8 || c >= 13) {
								value = 0;
							} else if (c == 9) {
								value = 10;
							} else if (c == 11) {
								value = 12;
							} else {
								process = true;
							}

							// clear cell in bit grid
							if (!process && (c & 1)) {
								if (nextCell & colIndex) {
									*gridRow &= ~colIndex;
									deaths++;
									population--;
								}
							}
						}

						// check whether state still needs processing
						if (process) {
							// get cell state from bit grid
							if (nextCell & colIndex) {
								// cell alive
								// was cell alive in this generation
								if ((c & 1) == 0) {
									// cell was dead so has been born now
									switch (c) {
										case 4:
											value = 3;
											break;

										case 6:
											// clear cell in bit grid
											*gridRow &= ~colIndex;
											births--;
											population--;
											break;

										case 8:
											value = 7;
											break;

										default:
											value = 1;
											calc = typeMask & alive9to25;

											if (((typeMask & alive1or3or5or7) == 0) && (__builtin_popcount(calc) == 1)) {
												// the bit index gives the cell state
												value = 31 - __builtin_clz(calc);
											} else {
												calc = typeMask & alive13or15or17or19or21or23or25;
												if ((typeMask & (1 << 3)) && ((typeMask & alive1or5or7or9or11) == 0) && (__builtin_popcount(calc) == 1)) {
													value = 31 - __builtin_clz(calc);
												} else {
													calc = typeMask & alive9or11;
													if ((typeMask & (1 << 7)) && ((typeMask & alive1or3or5or13or15or17or19or21or23or25) == 0) && (__builtin_popcount(calc) == 1)) {
														value = 31 - __builtin_clz(calc);
													} else {
														calc = typeMask & alive7or13or15or17or19or21or23or25;
														if (calc && ((typeMask & alive1or3or5or9or11) == 0)) {
															value = 13;
														}
													}
												}
											}
											break;
									}
								}
							} else {
								// cell dead
								// was cell alive in this generation
								if (c & 1) {
									// cell was alive so has died
									if (c <= 11) {
										if (c == 5) {
											value = 4;
										} else {
											value = c + 1;
										}
									} else {
										value = 0;
									}
								} else {
									// cell is still dead
									if (c >= 14) {
										switch (c) {
											case 14:
												value = 0;
												break;

											case 16:
												if (typeMask & aliveWith14) {
													value = 14;
												}
												break;

											case 18:
												if (typeMask & (1 << 22)) {
													value = 22;
												}
												break;

											case 20:
												if (typeMask & (1 << 18)) {
													value = 18;
												}
												break;

											case 22:
												if (typeMask & (1 << 20)) {
													value = 20;
												}
												break;

											case 24:
												if (typeMask & aliveWith14or18) {
													value = 18;
												}
												break;
										}
									}
								}
							}
						}

						// output new cell state
						*destRow = value;
						destRow++;

						if (value > 0) {
							colOccupied |= colIndex;
							rowOccupied |= rowIndex;

							// update alive tracker
							if (value & 1) {
								colAliveOccupied |= colIndex;
								rowAliveOccupied |= rowIndex;
							}
						}

						// next bit cell
						colIndex >>= 1;
					}

					// next row
					rowIndex >>= 1;
				}

				columnOccupied16[leftX] |= colOccupied;
				rowOccupied16[th] |= rowOccupied;
				columnAliveOccupied16[leftX] |= colAliveOccupied;
				rowAliveOccupied16[th] |= rowAliveOccupied;
			}

			// save the tile group
			colourTileRow[tw] = origTiles;
			colourTileHistoryRow[tw] |= origTiles;

			// next tile set
			leftX = currentX + (xSize << 4);
		}

		// next tile row
		bottomY += ySize;
		topY += ySize;
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding boxes
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
	shared = updateBoundingBox(columnAliveOccupied16, columnOccupiedWidth, rowAliveOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute super rule next generation (after state 0 and 1) for Hex neighbourhood
void nextGenerationSuperHex(
	uint16_t *const grid16,
	uint16_t *const nextGrid16,
	const uint32_t gridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileGrid,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	uint8_t *const colourGrid8,
	uint8_t *const nextColourGrid8,
	const uint32_t colourGridWidth,
	uint16_t *const columnOccupied16,
	uint16_t *const columnAliveOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	uint16_t *const rowAliveOccupied16,
	const uint32_t rowOccupiedWidth,
	const uint32_t width,
	const uint32_t height,
	const uint32_t tileX,
	const uint32_t ySize,
	const uint32_t tileCols,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	uint32_t population,
	uint32_t births,
	uint32_t deaths,
	uint32_t *shared
) {
	uint32_t nw, n, w, c, e, se, s;
	int32_t calc;

	// constants
	const uint32_t aliveWith14 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 7) | (1 << 9) | (1 << 11) | (1 << 13) | (1 << 14) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t aliveWith14or18 = aliveWith14 | (1 << 18);
	const uint32_t alive1or3or5or7 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 7);
	const uint32_t alive9to25 = (1 << 9) | (1 << 11) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive1or3or5or9or11 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 9) | (1 << 11);
	const uint32_t alive7or13or15or17or19or21or23or25 = (1 << 7) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive1or5or7or9or11 = (1 << 1) | (1 << 5) | (1 << 7) | (1 << 9) | (1 << 11);
	const uint32_t alive13or15or17or19or21or23or25 = (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive9or11 = (1 << 9) | (1 << 11);
	const uint32_t alive1or3or5or13or15or17or19or21or23or25 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);

	// tile width in 16 bit chunks
	const uint32_t xSize = tileX >> 1;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// grid
	uint16_t *grid = grid16;
	uint16_t *tileGrid = tileGrid16;
	uint8_t *colourGrid = nextColourGrid8;
	uint8_t *outputGrid = colourGrid8;

	// select the correct grid
	if (counter & 1) {
		grid = nextGrid16;
		tileGrid = nextTileGrid16;
		colourGrid = colourGrid8;
		outputGrid = nextColourGrid8;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));
	memset(columnAliveOccupied16, 0, columnOccupiedWidth * sizeof(*columnAliveOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));
	memset(rowAliveOccupied16, 0, rowOccupiedWidth * sizeof(*rowAliveOccupied16));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < height >> 4; th++) {
		// set initial tile column
		uint32_t leftX = 0;

		// get the tile row and colour tile rows
		uint16_t *tileGridRow = tileGrid + th * tileGridWidth;
		uint16_t *colourTileRow = colourTileGrid + th * tileGridWidth;
		uint16_t *colourTileHistoryRow = colourTileHistoryGrid + th * tileGridWidth;

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = tileGridRow[tw] | colourTileRow[tw];
			uint32_t currentX = leftX;
			uint32_t origTiles = tiles;

			// compute next colour for each tile in the set
			while (tiles) {
				uint32_t b = 31 - __builtin_clz(tiles);
				tiles &= ~(1 << b);

				leftX = currentX + xSize * (15 - b);

				// mark no cells in this column
				uint32_t colOccupied = 0;
				uint32_t colAliveOccupied = 0;

				// mark no cells in the tile rows
				uint32_t rowOccupied = 0;
				uint32_t rowAliveOccupied = 0;
				uint32_t rowIndex = 32768;

				// clear type mask
				uint32_t typeMask = 0;

				// process each row
				for (uint32_t h = bottomY; h < topY; h++) {
					// get correct starting colour index
					uint32_t cr = (leftX << 4);

					// get the grid and colour grid row
					uint16_t *gridRow = grid + h * gridWidth + leftX;
					uint8_t *colourGridRow = colourGrid + h * colourGridWidth + cr;
					uint8_t *aboveRow = colourGridRow - colourGridWidth;
					uint8_t *belowRow = colourGridRow + colourGridWidth;

					// deal with bottom row of the grid
					if (h == 0) {
						aboveRow = blankColourRow;
					}
					if (h == height - 1) {
						belowRow = blankColourRow;
					}

					// destination to write bit cells
					uint8_t *destRow = outputGrid + h * colourGridWidth + cr;

					// get initial neighbours
					if (cr == 0) {
						c = 0;
						n = 0;
					} else {
						c = *(colourGridRow - 1);
						n = *(aboveRow - 1);
					}
					se = *belowRow;
					e = *colourGridRow;

					// process each 16bit chunk (16 cells) along the row
					uint32_t nextCell = *gridRow;

					// process each cell in the chunk
					uint32_t colIndex = 1 << 15;
					while (colIndex > 0) {
						// shift neighbourhood left
						nw = n;
						n = *aboveRow;
						w = c;
						c = e;
						e = *(colourGridRow + 1);
						s = se;
						se = *(belowRow + 1);
						uint32_t value = c;

						// typemask has a bit set per state in the neighbouring cells
						typeMask = (1 << nw) | (1 << n) | (1 << e) | (1 << w) | (1 << s) | (1 << se);

						// handle state 6
						bool process = true;

						if (typeMask & (1 << 6)) {
							process = false;

							if (c == 1) {
								value = 2;
							} else if (c == 3 || c == 5) {
								value = 9;
							} else if (c == 7 || c == 8 || c >= 13) {
								value = 0;
							} else if (c == 9) {
								value = 10;
							} else if (c == 11) {
								value = 12;
							} else {
								process = true;
							}

							// clear cell in bit grid
							if (!process && (c & 1)) {
								if (nextCell & colIndex) {
									*gridRow &= ~colIndex;
									deaths++;
									population--;
								}
							}
						}

						// check whether state still needs processing
						if (process) {
							// get cell state from bit grid
							if (nextCell & colIndex) {
								// cell alive
								// was cell alive in this generation
								if ((c & 1) == 0) {
									// cell was dead so has been born now
									switch (c) {
										case 4:
											value = 3;
											break;

										case 6:
											// clear cell in bit grid
											*gridRow &= ~colIndex;
											births--;
											population--;
											break;

										case 8:
											value = 7;
											break;

										default:
											value = 1;
											calc = typeMask & alive9to25;

											if (((typeMask & alive1or3or5or7) == 0) && (__builtin_popcount(calc) == 1)) {
												// the bit index gives the cell state
												value = 31 - __builtin_clz(calc);
											} else {
												calc = typeMask & alive13or15or17or19or21or23or25;
												if ((typeMask & (1 << 3)) && ((typeMask & alive1or5or7or9or11) == 0) && (__builtin_popcount(calc) == 1)) {
													value = 31 - __builtin_clz(calc);
												} else {
													calc = typeMask & alive9or11;
													if ((typeMask & (1 << 7)) && ((typeMask & alive1or3or5or13or15or17or19or21or23or25) == 0) && (__builtin_popcount(calc) == 1)) {
														value = 31 - __builtin_clz(calc);
													} else {
														calc = typeMask & alive7or13or15or17or19or21or23or25;
														if (calc && ((typeMask & alive1or3or5or9or11) == 0)) {
															value = 13;
														}
													}
												}
											}
											break;
									}
								}
							} else {
								// cell dead
								// was cell alive in this generation
								if (c & 1) {
									// cell was alive so has died
									if (c <= 11) {
										if (c == 5) {
											value = 4;
										} else {
											value = c + 1;
										}
									} else {
										value = 0;
									}
								} else {
									// cell is still dead
									if (c >= 14) {
										switch (c) {
											case 14:
												value = 0;
												break;

											case 16:
												if (typeMask & aliveWith14) {
													value = 14;
												}
												break;

											case 18:
												if (typeMask & (1 << 22)) {
													value = 22;
												}
												break;

											case 20:
												if (typeMask & (1 << 18)) {
													value = 18;
												}
												break;

											case 22:
												if (typeMask & (1 << 20)) {
													value = 20;
												}
												break;

											case 24:
												if (typeMask & aliveWith14or18) {
													value = 18;
												}
												break;
										}
									}
								}
							}
						}

						// output new cell state
						*destRow = value;
						destRow++;

						if (value > 0) {
							colOccupied |= colIndex;
							rowOccupied |= rowIndex;

							// update alive tracker
							if (value & 1) {
								colAliveOccupied |= colIndex;
								rowAliveOccupied |= rowIndex;
							}
						}

						// next bit cell
						colIndex >>= 1;

						// get next column
						colourGridRow++;
						belowRow++;
						aboveRow++;
					}

					// next row
					rowIndex >>= 1;
				}

				columnOccupied16[leftX] |= colOccupied;
				rowOccupied16[th] |= rowOccupied;
				columnAliveOccupied16[leftX] |= colAliveOccupied;
				rowAliveOccupied16[th] |= rowAliveOccupied;
			}

			// save the tile group
			colourTileRow[tw] = origTiles;
			colourTileHistoryRow[tw] |= origTiles;

			// next tile set
			leftX = currentX + (xSize << 4);
		}

		// next tile row
		bottomY += ySize;
		topY += ySize;
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding boxes
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
	shared = updateBoundingBox(columnAliveOccupied16, columnOccupiedWidth, rowAliveOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute super rule next generation (after state 0 and 1) for von Neumann neighbourhood
void nextGenerationSuperVN(
	uint16_t *const grid16,
	uint16_t *const nextGrid16,
	const uint32_t gridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileGrid,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	uint8_t *const colourGrid8,
	uint8_t *const nextColourGrid8,
	const uint32_t colourGridWidth,
	uint16_t *const columnOccupied16,
	uint16_t *const columnAliveOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	uint16_t *const rowAliveOccupied16,
	const uint32_t rowOccupiedWidth,
	const uint32_t width,
	const uint32_t height,
	const uint32_t tileX,
	const uint32_t ySize,
	const uint32_t tileCols,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	uint32_t population,
	uint32_t births,
	uint32_t deaths,
	uint32_t *shared
) {
	uint32_t  n, w, c, e, s;
	int32_t calc;

	// constants
	const uint32_t aliveWith14 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 7) | (1 << 9) | (1 << 11) | (1 << 13) | (1 << 14) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t aliveWith14or18 = aliveWith14 | (1 << 18);
	const uint32_t alive1or3or5or7 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 7);
	const uint32_t alive9to25 = (1 << 9) | (1 << 11) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive1or3or5or9or11 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 9) | (1 << 11);
	const uint32_t alive7or13or15or17or19or21or23or25 = (1 << 7) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive1or5or7or9or11 = (1 << 1) | (1 << 5) | (1 << 7) | (1 << 9) | (1 << 11);
	const uint32_t alive13or15or17or19or21or23or25 = (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);
	const uint32_t alive9or11 = (1 << 9) | (1 << 11);
	const uint32_t alive1or3or5or13or15or17or19or21or23or25 = (1 << 1) | (1 << 3) | (1 << 5) | (1 << 13) | (1 << 15) | (1 << 17) | (1 << 19) | (1 << 21) | (1 << 23) | (1 << 25);

	// tile width in 16 bit chunks
	const uint32_t xSize = tileX >> 1;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// grid
	uint16_t *grid = grid16;
	uint16_t *tileGrid = tileGrid16;
	uint8_t *colourGrid = nextColourGrid8;
	uint8_t *outputGrid = colourGrid8;

	// select the correct grid
	if (counter & 1) {
		grid = nextGrid16;
		tileGrid = nextTileGrid16;
		colourGrid = colourGrid8;
		outputGrid = nextColourGrid8;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));
	memset(columnAliveOccupied16, 0, columnOccupiedWidth * sizeof(*columnAliveOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));
	memset(rowAliveOccupied16, 0, rowOccupiedWidth * sizeof(*rowAliveOccupied16));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < height >> 4; th++) {
		// set initial tile column
		uint32_t leftX = 0;

		// get the tile row and colour tile rows
		uint16_t *tileGridRow = tileGrid + th * tileGridWidth;
		uint16_t *colourTileRow = colourTileGrid + th * tileGridWidth;
		uint16_t *colourTileHistoryRow = colourTileHistoryGrid + th * tileGridWidth;

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = tileGridRow[tw] | colourTileRow[tw];
			uint32_t currentX = leftX;
			uint32_t origTiles = tiles;

			// compute next colour for each tile in the set
			while (tiles) {
				uint32_t b = 31 - __builtin_clz(tiles);
				tiles &= ~(1 << b);

				leftX = currentX + xSize * (15 - b);

				// mark no cells in this column
				uint32_t colOccupied = 0;
				uint32_t colAliveOccupied = 0;

				// mark no cells in the tile rows
				uint32_t rowOccupied = 0;
				uint32_t rowAliveOccupied = 0;
				uint32_t rowIndex = 32768;

				// clear type mask
				uint32_t typeMask = 0;

				// process each row
				for (uint32_t h = bottomY; h < topY; h++) {
					// get correct starting colour index
					uint32_t cr = (leftX << 4);

					// get the grid and colour grid row
					uint16_t *gridRow = grid + h * gridWidth + leftX;
					uint8_t *colourGridRow = colourGrid + h * colourGridWidth + cr;
					uint8_t *aboveRow = colourGridRow - colourGridWidth;
					uint8_t *belowRow = colourGridRow + colourGridWidth;

					// deal with bottom row of the grid
					if (h == 0) {
						aboveRow = blankColourRow;
					}
					if (h == height - 1) {
						belowRow = blankColourRow;
					}

					// destination to write bit cells
					uint8_t *destRow = outputGrid + h * colourGridWidth + cr;

					// get initial neighbours
					if (cr == 0) {
						c = 0;
					} else {
						c = *(colourGridRow - 1);
					}
					e = *colourGridRow;

					// process each 16bit chunk (16 cells) along the row
					uint32_t nextCell = *gridRow;

					// process each cell in the chunk
					uint32_t colIndex = 1 << 15;
					while (colIndex > 0) {
						// shift neighbourhood left
						n = *aboveRow;
						w = c;
						c = e;
						e = *(colourGridRow + 1);
						s = *belowRow;
						uint32_t value = c;

						// get next column
						colourGridRow++;
						belowRow++;
						aboveRow++;

						// typemask has a bit set per state in the neighbouring cells
						typeMask = (1 << n) | (1 << e) | (1 << w) | (1 << s);

						// handle state 6
						bool process = true;
						if (typeMask & (1 << 6)) {
							process = false;

							if (c == 1) {
								value = 2;
							} else if (c == 3 || c == 5) {
								value = 9;
							} else if (c == 7 || c == 8 || c >= 13) {
								value = 0;
							} else if (c == 9) {
								value = 10;
							} else if (c == 11) {
								value = 12;
							} else {
								process = true;
							}

							// clear cell in bit grid
							if (!process && (c & 1)) {
								if (nextCell & colIndex) {
									*gridRow &= ~colIndex;
									deaths++;
									population--;
								}
							}
						}

						// check whether state still needs processing
						if (process) {
							// get cell state from bit grid
							if (nextCell & colIndex) {
								// cell alive
								// was cell alive in this generation
								if ((c & 1) == 0) {
									// cell was dead so has been born now
									switch (c) {
										case 4:
											value = 3;
											break;

										case 6:
											// clear cell in bit grid
											*gridRow &= ~colIndex;
											births--;
											population--;
											break;

										case 8:
											value = 7;
											break;

										default:
											value = 1;
											calc = typeMask & alive9to25;

											if (((typeMask & alive1or3or5or7) == 0) && (__builtin_popcount(calc) == 1)) {
												// the bit index gives the cell state
												value = 31 - __builtin_clz(calc);
											} else {
												calc = typeMask & alive13or15or17or19or21or23or25;
												if ((typeMask & (1 << 3)) && ((typeMask & alive1or5or7or9or11) == 0) && (__builtin_popcount(calc) == 1)) {
													value = 31 - __builtin_clz(calc);
												} else {
													calc = typeMask & alive9or11;
													if ((typeMask & (1 << 7)) && ((typeMask & alive1or3or5or13or15or17or19or21or23or25) == 0) && (__builtin_popcount(calc) == 1)) {
														value = 31 - __builtin_clz(calc);
													} else {
														calc = typeMask & alive7or13or15or17or19or21or23or25;
														if (calc && ((typeMask & alive1or3or5or9or11) == 0)) {
															value = 13;
														}
													}
												}
											}
											break;
									}
								}
							} else {
								// cell dead
								// was cell alive in this generation
								if (c & 1) {
									// cell was alive so has died
									if (c <= 11) {
										if (c == 5) {
											value = 4;
										} else {
											value = c + 1;
										}
									} else {
										value = 0;
									}
								} else {
									// cell is still dead
									if (c >= 14) {
										switch (c) {
											case 14:
												value = 0;
												break;

											case 16:
												if (typeMask & aliveWith14) {
													value = 14;
												}
												break;

											case 18:
												if (typeMask & (1 << 22)) {
													value = 22;
												}
												break;

											case 20:
												if (typeMask & (1 << 18)) {
													value = 18;
												}
												break;

											case 22:
												if (typeMask & (1 << 20)) {
													value = 20;
												}
												break;

											case 24:
												if (typeMask & aliveWith14or18) {
													value = 18;
												}
												break;
										}
									}
								}
							}
						}

						// output new cell state
						*destRow = value;
						destRow++;

						if (value > 0) {
							colOccupied |= colIndex;
							rowOccupied |= rowIndex;

							// update alive tracker
							if (value & 1) {
								colAliveOccupied |= colIndex;
								rowAliveOccupied |= rowIndex;
							}
						}

						// next bit cell
						colIndex >>= 1;
					}

					// next row
					rowIndex >>= 1;
				}

				columnOccupied16[leftX] |= colOccupied;
				rowOccupied16[th] |= rowOccupied;
				columnAliveOccupied16[leftX] |= colAliveOccupied;
				rowAliveOccupied16[th] |= rowAliveOccupied;
			}

			// save the tile group
			colourTileRow[tw] = origTiles;
			colourTileHistoryRow[tw] |= origTiles;

			// next tile set
			leftX = currentX + (xSize << 4);
		}

		// next tile row
		bottomY += ySize;
		topY += ySize;
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding boxes
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
	shared = updateBoundingBox(columnAliveOccupied16, columnOccupiedWidth, rowAliveOccupied16, rowOccupiedWidth, width, height, shared);
}


// clear tiles that died
void clearTilesThatDied(
	uint8_t *const grid,
	const uint32_t gridWidth,
	uint16_t *const diedGrid,
	const uint32_t diedGridHeight,
	const uint32_t diedGridWidth,
	const uint32_t xSize,
	const uint32_t ySize,
	const uint32_t tileCols16
) {
	const v128_t zeroVec = wasm_u8x16_splat(0);

	// clear tiles that died in the source
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// process each tile row
	for (uint32_t th = 0; th < diedGridHeight; th++) {
		uint32_t leftX = 0;
		uint16_t *diedRow = diedGrid + th * diedGridWidth;

		// process each tile group in the row
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint32_t diedTiles = *(diedRow + tw);

			// process each tile in the group
			if (diedTiles) {
				for (int32_t bit = 15; bit >= 0; bit--) {
					if (diedTiles & (1 << bit)) {

						// clear source cells for double buffering
						uint8_t* gridRow = grid + bottomY * gridWidth + leftX;

						// clear 16x16 cells
						for (uint32_t y = bottomY; y < topY; y++) {
							wasm_v128_store(gridRow, zeroVec);
							gridRow += gridWidth;
						}

					}
					leftX += xSize;
				}
			} else {
				leftX += xSize << 4;
			}
		}
		bottomY += ySize;
		topY += ySize;
	}
}


EMSCRIPTEN_KEEPALIVE
// compute Investigator rule next generation for Moore neighbourhood
void nextGenerationInvestigatorMoore(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const ruleArray8,
	uint8_t *const ruleAltArray8,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t altSpecified,
	const uint8_t *nextStateInvestigator,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t typeMask;
	uint32_t nw, w, sw, n, c, s, ne, e, se;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const uint32_t deadForcer = (1 << 2) | (1 << 3) | (1 << 6) | (1 << 7) | (1 << 14) | (1 << 16);
	const uint32_t birthForcer = (1 << 8) | (1 << 9) | (1 << 12) | (1 << 13) | (1 << 14);
	const uint32_t requireState1 = (1 << 15) | (1 << 16);
	const uint32_t treatIfDead = (1 << 1) | (1 << 2) | (1 << 4) | (1 << 6) | (1 << 8) | (1 << 10) | (1 << 12) | (1 << 15) |  (1 << 16) | (1 << 17) | (1 << 19);
	const uint32_t treatIfAlive = treatIfDead ^ ((1 << 17) | (1 << 18) | (1 << 19) | (1 << 20));
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;
	uint8_t* ruleArray = ruleArray8;

	// select the correct grid
	if (counter & 1) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
		if (altSpecified) {
			ruleArray = ruleAltArray8;
		}
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// get initial neighbours
							if (x == 0) {
								n = 0;
								c = 0;
								s = 0;
							} else {
								n = *(gridRow0 + x - 1);
								c = *(gridRow1 + x - 1);
								s = *(gridRow2 + x - 1);
							}
							ne = *(gridRow0 + x);
							e = *(gridRow1 + x);
							se = *(gridRow2 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								w = c;
								sw = s;
								n = ne;
								c = e;
								s = se;
								ne = *(gridRow0 + x + 1);
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);

								// check for higher states
								uint32_t state;

								if (c >= 2) {
									state = nextStateInvestigator[c];
								} else {
									// typemask has a bit set per state in the neighbouring cells
									typeMask = (1 << nw) | (1 << n) | (1 << ne) | (1 << w) | (1 << e) | (1 << sw) | (1 << s) | (1 << se);

									// check for all cells dead
									if (typeMask == 1 && c == 0) {
										state = 0;
									} else {
										if (typeMask & (c ? deadForcer : birthForcer)) {
											state = 1 - c;
										} else {
											if (!c && (typeMask & requireState1) && !(typeMask & 2)) {
												state = 0;
											} else {
												uint32_t treat = c ? treatIfAlive : treatIfDead;
												state = ruleArray[
														(((treat >> sw) & 1) << 8) |
														(((treat >> s) & 1) << 7) |
														(((treat >> se) & 1) << 6) |
														(((treat >> w) & 1) << 5) |
														(c << 4) |
														(((treat >> e) & 1) << 3) |
														(((treat >> nw) & 1) << 2) |
														(((treat >> n) & 1) << 1) |
														((treat >> ne) & 1)];
											}
										}
									}
								}

								// check if state is alive
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							w = c;
							sw = s;
							n = ne;
							c = e;
							s = se;
							if (x == width - 1) {
								ne = 0;
								e = 0;
								se = 0;
							} else {
								ne = *(gridRow0 + x + 1);
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							// check for higher states
							uint32_t state = 0;
							if (c >= 2) {
								state = nextStateInvestigator[c];
							} else {
								// typemask has a bit set per state in the neighbouring cells
								typeMask = (1 << nw) | (1 << n) | (1 << ne) | (1 << w) | (1 << e) | (1 << sw) | (1 << s) | (1 << se);

								// check for all cells dead
								if (typeMask == 1 && c == 0) {
									state = 0;
								} else {
									if (typeMask & (c ? deadForcer : birthForcer)) {
										state = 1 - c;
									} else {
										if (!c && (typeMask & requireState1) && !(typeMask & 2)) {
											state = 0;
										} else {
											uint32_t treat = c ? treatIfAlive : treatIfDead;
											state = ruleArray[
													(((treat >> sw) & 1) << 8) |
													(((treat >> s) & 1) << 7) |
													(((treat >> se) & 1) << 6) |
													(((treat >> w) & 1) << 5) |
													(c << 4) |
													(((treat >> e) & 1) << 3) |
													(((treat >> nw) & 1) << 2) |
													(((treat >> n) & 1) << 1) |
													((treat >> ne) & 1)];
										}
									}
								}
							}

							// check if state is alive
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute Investigator rule next generation for Hexagonal neighbourhood
void nextGenerationInvestigatorHex(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const ruleArray8,
	uint8_t *const ruleAltArray8,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t altSpecified,
	const uint8_t *nextStateInvestigator,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t typeMask;
	uint32_t nw, w, n, c, s, e, se;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// flags if cells are alive
	uint32_t oldCellWasAlive = 0;

	// constants
	const uint32_t deadForcer = (1 << 2) | (1 << 3) | (1 << 6) | (1 << 7) | (1 << 14) | (1 << 16);
	const uint32_t birthForcer = (1 << 8) | (1 << 9) | (1 << 12) | (1 << 13) | (1 << 14);
	const uint32_t requireState1 = (1 << 15) | (1 << 16);
	const uint32_t treatIfDead = (1 << 1) | (1 << 2) | (1 << 4) | (1 << 6) | (1 << 8) | (1 << 10) | (1 << 12) | (1 << 15) |  (1 << 16) | (1 << 17) | (1 << 19);
	const uint32_t treatIfAlive = treatIfDead ^ ((1 << 17) | (1 << 18) | (1 << 19) | (1 << 20));

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;
	uint8_t* ruleArray = ruleArray8;

	// select the correct grid
	if (counter & 1) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
		if (altSpecified) {
			ruleArray = ruleAltArray8;
		}
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// column index
							uint32_t colIndex = 32768;

							// process each column in the row
							uint32_t x = leftX;

							// get initial neighbours
							if (x == 0) {
								c = 0;
								n = 0;
							} else {
								c = *(gridRow1 + x - 1);
								n = *(gridRow0 + x - 1);
							}
							se = *(gridRow2 + x);
							e = *(gridRow1 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = *(gridRow0 + x);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								s = se;
								se = *(gridRow2 + x + 1);

								// check for higher states
								uint32_t state;

								if (c >= 2) {
									state = nextStateInvestigator[c];
								} else {
									// typemask has a bit set per state in the neighbouring cells
									typeMask = (1 << nw) | (1 << n) | (1 << w) | (1 << e) | (1 << s) | (1 << se);

									// check for all cells dead
									if (typeMask == 1 && c == 0) {
										state = 0;
									} else {
										if (typeMask & (c ? deadForcer : birthForcer)) {
											state = 1 - c;
										} else {
											if (!c && (typeMask & requireState1) && !(typeMask & 2)) {
												state = 0;
											} else {
												uint32_t treat = c ? treatIfAlive : treatIfDead;
												state = ruleArray[
														(((treat >> s) & 1) << 7) |
														(((treat >> se) & 1) << 6) |
														(((treat >> w) & 1) << 5) |
														(c << 4) |
														(((treat >> e) & 1) << 3) |
														(((treat >> nw) & 1) << 2) |
														(((treat >> n) & 1) << 1)];
											}
										}
									}
								}

								// check if state is alive
								*(nextRow + x) = state;
								oldCellWasAlive = c ? 1 : 0;
								if (state > 0) {
									population++;

									// update births
									births += 1 - oldCellWasAlive;
								} else {
									// update deaths
									deaths += oldCellWasAlive;
								}

								// update tile occupancy
								if (state > 0) {
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								}

								// check if any cell was alive in the source
								anyAlive |= c;

								// next column
								colIndex >>= 1;
								x++;
							}

							// handle right edge
							nw = n;
							n = *(gridRow0 + x);
							w = c;
							c = e;
							s = se;
							if (x == width - 1) {
								e = 0;
								se = 0;
							} else {
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							// check for higher states
							uint32_t state = 0;
							if (c >= 2) {
								state = nextStateInvestigator[c];
							} else {
								// typemask has a bit set per state in the neighbouring cells
								typeMask = (1 << nw) | (1 << n) | (1 << w) | (1 << e) | (1 << s) | (1 << se);

								// check for all cells dead
								if (typeMask == 1 && c == 0) {
									state = 0;
								} else {
									if (typeMask & (c ? deadForcer : birthForcer)) {
										state = 1 - c;
									} else {
										if (!c && (typeMask & requireState1) && !(typeMask & 2)) {
											state = 0;
										} else {
											uint32_t treat = c ? treatIfAlive : treatIfDead;
											state = ruleArray[
													(((treat >> s) & 1) << 7) |
													(((treat >> se) & 1) << 6) |
													(((treat >> w) & 1) << 5) |
													(c << 4) |
													(((treat >> e) & 1) << 3) |
													(((treat >> nw) & 1) << 2) |
													(((treat >> n) & 1) << 1)];
										}
									}
								}
							}

							// check if state is alive
							*(nextRow + x) = state;
							oldCellWasAlive = c ? 1 : 0;
							if (state > 0) {
								population++;

								// update births
								births += 1 - oldCellWasAlive;
							} else {
								// update death
								deaths += oldCellWasAlive;
							}

							// update tile occupancy
							if (state > 0) {
								rowOccupied |= rowIndex;
								colOccupied |= colIndex;
							}

							// check if any cell was alive in the source
							anyAlive |= c;

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute Investigator rule next generation for von Neumann neighbourhood
void nextGenerationInvestigatorVN(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const ruleArray8,
	uint8_t *const ruleAltArray8,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t altSpecified,
	const uint8_t *nextStateInvestigator,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t typeMask;
	uint32_t n, w, c, s, e;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// flags if cells are alive
	uint32_t oldCellWasAlive = 0;

	// constants
	const uint32_t deadForcer = (1 << 2) | (1 << 3) | (1 << 6) | (1 << 7) | (1 << 14) | (1 << 16);
	const uint32_t birthForcer = (1 << 8) | (1 << 9) | (1 << 12) | (1 << 13) | (1 << 14);
	const uint32_t requireState1 = (1 << 15) | (1 << 16);
	const uint32_t treatIfDead = (1 << 1) | (1 << 2) | (1 << 4) | (1 << 6) | (1 << 8) | (1 << 10) | (1 << 12) | (1 << 15) |  (1 << 16) | (1 << 17) | (1 << 19);
	const uint32_t treatIfAlive = treatIfDead ^ ((1 << 17) | (1 << 18) | (1 << 19) | (1 << 20));

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;
	uint8_t* ruleArray = ruleArray8;

	// select the correct grid
	if (counter & 1) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
		if (altSpecified) {
			ruleArray = ruleAltArray8;
		}
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// column index
							uint32_t colIndex = 32768;

							// process each column in the row
							uint32_t x = leftX;

							// get initial neighbours
							if (x == 0) {
								c = 0;
							} else {
								c = *(gridRow1 + x - 1);
							}
							e = *(gridRow1 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								n = *(gridRow0 + x);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								s = *(gridRow2 + x);

								// check for higher states
								uint32_t state;

								if (c >= 2) {
									state = nextStateInvestigator[c];
								} else {
									// typemask has a bit set per state in the neighbouring cells
									typeMask = (1 << n) | (1 << w) | (1 << e) | (1 << s);

									// check for all cells dead
									if (typeMask == 1 && c == 0) {
										state = 0;
									} else {
										if (typeMask & (c ? deadForcer : birthForcer)) {
											state = 1 - c;
										} else {
											if (!c && (typeMask & requireState1) && !(typeMask & 2)) {
												state = 0;
											} else {
												uint32_t treat = c ? treatIfAlive : treatIfDead;
												state = ruleArray[
														(((treat >> s) & 1) << 7) |
														(((treat >> w) & 1) << 5) |
														(c << 4) |
														(((treat >> e) & 1) << 3) |
														(((treat >> n) & 1) << 1)];
											}
										}
									}
								}

								// check if state is alive
								*(nextRow + x) = state;
								oldCellWasAlive = c ? 1 : 0;
								if (state > 0) {
									population++;

									// update births
									births += 1 - oldCellWasAlive;
								} else {
									// update deaths
									deaths += oldCellWasAlive;
								}

								// update tile occupancy
								if (state > 0) {
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								}

								// check if any cell was alive in the source
								anyAlive |= c;

								// next column
								colIndex >>= 1;
								x++;
							}

							// handle right edge
							n = *(gridRow0 + x);
							w = c;
							c = e;
							if (x == width - 1) {
								e = 0;
							} else {
								e = *(gridRow1 + x + 1);
							}
							s = *(gridRow2 + x);

							// check for higher states
							uint32_t state = 0;
							if (c >= 2) {
								state = nextStateInvestigator[c];
							} else {
								// typemask has a bit set per state in the neighbouring cells
								typeMask = (1 << n) | (1 << w) | (1 << e) | (1 << s);

								// check for all cells dead
								if (typeMask == 1 && c == 0) {
									state = 0;
								} else {
									if (typeMask & (c ? deadForcer : birthForcer)) {
										state = 1 - c;
									} else {
										if (!c && (typeMask & requireState1) && !(typeMask & 2)) {
											state = 0;
										} else {
											uint32_t treat = c ? treatIfAlive : treatIfDead;
											state = ruleArray[
													(((treat >> s) & 1) << 7) |
													(((treat >> w) & 1) << 5) |
													(c << 4) |
													(((treat >> e) & 1) << 3) |
													(((treat >> n) & 1) << 1)];
										}
									}
								}
							}

							// check if state is alive
							*(nextRow + x) = state;
							oldCellWasAlive = c ? 1 : 0;
							if (state > 0) {
								population++;

								// update births
								births += 1 - oldCellWasAlive;
							} else {
								// update death
								deaths += oldCellWasAlive;
							}

							// update tile occupancy
							if (state > 0) {
								rowOccupied |= rowIndex;
								colOccupied |= colIndex;
							}

							// check if any cell was alive in the source
							anyAlive |= c;

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleTree rule next generation for Moore neighbourhood
void nextGenerationRuleTreeMoore(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint32_t *const a,
	uint8_t *const b,
	const uint32_t base,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint8_t n, e, s, w, c, ne, nw, se, sw;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// get initial neighbours
							if (x == 0) {
								n = 0;
								c = 0;
								s = 0;
							} else {
								n = *(gridRow0 + x - 1);
								c = *(gridRow1 + x - 1);
								s = *(gridRow2 + x - 1);
							}
							ne = *(gridRow0 + x);
							e = *(gridRow1 + x);
							se = *(gridRow2 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = ne;
								ne = *(gridRow0 + x + 1);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								sw = s;
								s = se;
								se = *(gridRow2 + x + 1);

								// check for higher states
								uint8_t state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							n = ne;
							w = c;
							c = e;
							sw = s;
							s = se;
							if (x == width - 1) {
								ne = 0;
								e = 0;
								se = 0;
							} else {
								ne = *(gridRow0 + x + 1);
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							// get the next state
							uint8_t state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for Moore neighbourhood using 1 bit lookup
void nextGenerationRuleLoaderMooreLookup1(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// get pointers to the current source row, the row above and row below
						uint8_t *gridRow1 = grid + y * colourGridWidth;
						v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

						uint8_t *gridRow0 = y ? gridRow1 - colourGridWidth : blankColourRow;
						v128_t aboveCellsVec = y ? wasm_v128_load(gridRow0 + leftX) : zeroVec;

						uint8_t *gridRow2 = gridRow1 + colourGridWidth;
						v128_t belowCellsVec = wasm_v128_load(gridRow2 + leftX);

						// combine the three rows with shifts since we can fit 3 x 1 bits in the 8 bit lane
						v128_t combinedVec = wasm_v128_or(aboveCellsVec, wasm_i8x16_shl(origCellsVec, 1));
						combinedVec = wasm_v128_or(combinedVec, wasm_i8x16_shl(belowCellsVec, 2));

						// get pointer to destintation row
						uint8_t *nextRow = nextGrid + y * colourGridWidth;

						// process each row of the tile
						while (y < topY) {
							// process each column in the row
							uint32_t index;

							// process each cell along the tile row
							uint8_t ne = wasm_u8x16_extract_lane(combinedVec, 1);
							uint8_t n = wasm_u8x16_extract_lane(combinedVec, 0);

							if (leftX == 0) {
								// handle left edge of grid
								index = (n << 3) | (ne << 6);
							} else {
								index = gridRow0[leftX - 1] | (gridRow1[leftX - 1] << 1) | (gridRow2[leftX - 1] << 2) | (n << 3) | (ne << 6);
							}
							const uint8_t state0 = lookup[index];

							// process middle lanes
							ne = wasm_u8x16_extract_lane(combinedVec, 2);
							index = (index >> 3) | (ne << 6);
							const uint8_t state1 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 3);
							index = (index >> 3) | (ne << 6);
							const uint8_t state2 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 4);
							index = (index >> 3) | (ne << 6);
							const uint8_t state3 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 5);
							index = (index >> 3) | (ne << 6);
							const uint8_t state4 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 6);
							index = (index >> 3) | (ne << 6);
							const uint8_t state5 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 7);
							index = (index >> 3) | (ne << 6);
							const uint8_t state6 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 8);
							index = (index >> 3) | (ne << 6);
							const uint8_t state7 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 9);
							index = (index >> 3) | (ne << 6);
							const uint8_t state8 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 10);
							index = (index >> 3) | (ne << 6);
							const uint8_t state9 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 11);
							index = (index >> 3) | (ne << 6);
							const uint8_t state10 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 12);
							index = (index >> 3) | (ne << 6);
							const uint8_t state11 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 13);
							index = (index >> 3) | (ne << 6);
							const uint8_t state12 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 14);
							index = (index >> 3) | (ne << 6);
							const uint8_t state13 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 15);
							index = (index >> 3) | (ne << 6);
							const uint8_t state14 = lookup[index];

							// handle right edge
							uint8_t e, se;
							if (leftX + 15 == width - 1) {
								ne = 0;
								e = 0;
								se = 0;
							} else {
								ne = *(gridRow0 + leftX + 16);
								e = *(gridRow1 + leftX + 16);
								se = *(gridRow2 + leftX + 16);
							}
							index = (index >> 3) | (ne << 6) | (e << 7) | (se << 8);
							const uint8_t state15 = lookup[index];

							// write the new cells
							v128_t writeVec = wasm_u8x16_make(state0, state1, state2, state3, state4, state5, state6, state7,
								state8, state9, state10, state11, state12, state13, state14, state15);
							wasm_v128_store(nextRow + leftX, writeVec);

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;

							// move the three source rows up
							aboveCellsVec = origCellsVec;
							origCellsVec = belowCellsVec;
							gridRow0 = gridRow1;
							gridRow1 += colourGridWidth;

							// handle bottom of grid
							gridRow2 = (y < height - 1) ? gridRow1 + colourGridWidth : blankColourRow;
							belowCellsVec = (y < height - 1) ? wasm_v128_load(gridRow2 + leftX) : zeroVec;

							combinedVec = wasm_v128_or(aboveCellsVec, wasm_i8x16_shl(origCellsVec, 1));
							combinedVec = wasm_v128_or(combinedVec, wasm_i8x16_shl(belowCellsVec, 2));

							// next destination row
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for Moore neighbourhood using 2 bit lookup
void nextGenerationRuleLoaderMooreLookup2(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// get pointers to the current source row, the row above and row below
						uint8_t *gridRow1 = grid + y * colourGridWidth;
						v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

						uint8_t *gridRow0 = y ? gridRow1 - colourGridWidth : blankColourRow;
						v128_t aboveCellsVec = y ? wasm_v128_load(gridRow0 + leftX) : zeroVec;

						uint8_t *gridRow2 = gridRow1 + colourGridWidth;
						v128_t belowCellsVec = wasm_v128_load(gridRow2 + leftX);

						// combine the three rows with shifts since we can fit 3 x 2 bits in the 8 bit lane
						v128_t combinedVec = wasm_v128_or(aboveCellsVec, wasm_i8x16_shl(origCellsVec, 2));
						combinedVec = wasm_v128_or(combinedVec, wasm_i8x16_shl(belowCellsVec, 4));

						// get pointer to destintation row
						uint8_t *nextRow = nextGrid + y * colourGridWidth;

						// process each row of the tile
						while (y < topY) {
							// process each column in the row
							uint32_t index;

							// process each cell along the tile row
							uint8_t ne = wasm_u8x16_extract_lane(combinedVec, 1);
							uint8_t n = wasm_u8x16_extract_lane(combinedVec, 0);

							if (leftX == 0) {
								// handle left edge of grid
								index = (n << 6) | (ne << 12);
							} else {
								index = gridRow0[leftX - 1] | (gridRow1[leftX - 1] << 2) | (gridRow2[leftX - 1] << 4) | (n << 6) | (ne << 12);
							}
							const uint8_t state0 = lookup[index];

							// process middle lanes
							ne = wasm_u8x16_extract_lane(combinedVec, 2);
							index = (index >> 6) | (ne << 12);
							const uint8_t state1 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 3);
							index = (index >> 6) | (ne << 12);
							const uint8_t state2 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 4);
							index = (index >> 6) | (ne << 12);
							const uint8_t state3 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 5);
							index = (index >> 6) | (ne << 12);
							const uint8_t state4 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 6);
							index = (index >> 6) | (ne << 12);
							const uint8_t state5 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 7);
							index = (index >> 6) | (ne << 12);
							const uint8_t state6 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 8);
							index = (index >> 6) | (ne << 12);
							const uint8_t state7 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 9);
							index = (index >> 6) | (ne << 12);
							const uint8_t state8 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 10);
							index = (index >> 6) | (ne << 12);
							const uint8_t state9 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 11);
							index = (index >> 6) | (ne << 12);
							const uint8_t state10 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 12);
							index = (index >> 6) | (ne << 12);
							const uint8_t state11 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 13);
							index = (index >> 6) | (ne << 12);
							const uint8_t state12 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 14);
							index = (index >> 6) | (ne << 12);
							const uint8_t state13 = lookup[index];

							ne = wasm_u8x16_extract_lane(combinedVec, 15);
							index = (index >> 6) | (ne << 12);
							const uint8_t state14 = lookup[index];

							// handle right edge
							uint8_t e, se;
							if (leftX + 15 == width - 1) {
								ne = 0;
								e = 0;
								se = 0;
							} else {
								ne = *(gridRow0 + leftX + 16);
								e = *(gridRow1 + leftX + 16);
								se = *(gridRow2 + leftX + 16);
							}
							index = (index >> 6) | (ne << 12) | (e << 14) | (se << 16);
							const uint8_t state15 = lookup[index];

							// write the new cells
							v128_t writeVec = wasm_u8x16_make(state0, state1, state2, state3, state4, state5, state6, state7,
								state8, state9, state10, state11, state12, state13, state14, state15);
							wasm_v128_store(nextRow + leftX, writeVec);

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;

							// move the three source rows up
							aboveCellsVec = origCellsVec;
							origCellsVec = belowCellsVec;
							gridRow0 = gridRow1;
							gridRow1 += colourGridWidth;

							// handle bottom of grid
							gridRow2 = (y < height - 1) ? gridRow1 + colourGridWidth : blankColourRow;
							belowCellsVec = (y < height - 1) ? wasm_v128_load(gridRow2 + leftX) : zeroVec;

							combinedVec = wasm_v128_or(aboveCellsVec, wasm_i8x16_shl(origCellsVec, 2));
							combinedVec = wasm_v128_or(combinedVec, wasm_i8x16_shl(belowCellsVec, 4));

							// next destination row
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for Moore neighbourhood using 3 bit lookup
void nextGenerationRuleLoaderMooreLookup3(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// get pointers to the current source row, the row above and row below
						uint8_t *gridRow1 = grid + y * colourGridWidth;
						v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

						uint8_t *gridRow0 = y ? gridRow1 - colourGridWidth : blankColourRow;
						v128_t aboveCellsVec = y ? wasm_v128_load(gridRow0 + leftX) : zeroVec;

						uint8_t *gridRow2 = gridRow1 + colourGridWidth;
						v128_t belowCellsVec = wasm_v128_load(gridRow2 + leftX);

						// combine the middle and bottom row with a shift since we can fit 2 x 3 bits in the 8 bit lane
						v128_t botTwoVec = wasm_v128_or(origCellsVec, wasm_i8x16_shl(belowCellsVec, 3));

						// get pointer to destintation row
						uint8_t *nextRow = nextGrid + y * colourGridWidth;

						// process each row of the tile
						while (y < topY) {
							// process each column in the row
							uint32_t index;

							// process each cell along the tile row
							uint8_t ne = wasm_u8x16_extract_lane(aboveCellsVec, 1);
							uint8_t e = wasm_u8x16_extract_lane(botTwoVec, 1);
							uint8_t n = wasm_u8x16_extract_lane(aboveCellsVec, 0);
							uint8_t c = wasm_u8x16_extract_lane(botTwoVec, 0);

							if (leftX == 0) {
								// handle left edge of grid
								index = (n << 9) | (c << 12) | (ne << 18) | (e << 21);
							} else {
								index = gridRow0[leftX - 1] | (gridRow1[leftX - 1] << 3) | (gridRow2[leftX - 1] << 6) | (n << 9) | (c << 12) | (ne << 18) | (e << 21);
							}
							const uint8_t state0 = lookup[index];

							// process middle lanes
							ne = wasm_u8x16_extract_lane(aboveCellsVec, 2);
							e = wasm_u8x16_extract_lane(botTwoVec, 2);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state1 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 3);
							e = wasm_u8x16_extract_lane(botTwoVec, 3);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state2 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 4);
							e = wasm_u8x16_extract_lane(botTwoVec, 4);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state3 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 5);
							e = wasm_u8x16_extract_lane(botTwoVec, 5);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state4 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 6);
							e = wasm_u8x16_extract_lane(botTwoVec, 6);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state5 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 7);
							e = wasm_u8x16_extract_lane(botTwoVec, 7);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state6 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 8);
							e = wasm_u8x16_extract_lane(botTwoVec, 8);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state7 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 9);
							e = wasm_u8x16_extract_lane(botTwoVec, 9);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state8 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 10);
							e = wasm_u8x16_extract_lane(botTwoVec, 10);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state9 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 11);
							e = wasm_u8x16_extract_lane(botTwoVec, 11);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state10 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 12);
							e = wasm_u8x16_extract_lane(botTwoVec, 12);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state11 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 13);
							e = wasm_u8x16_extract_lane(botTwoVec, 13);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state12 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 14);
							e = wasm_u8x16_extract_lane(botTwoVec, 14);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state13 = lookup[index];

							ne = wasm_u8x16_extract_lane(aboveCellsVec, 15);
							e = wasm_u8x16_extract_lane(botTwoVec, 15);
							index = (index >> 9) | (ne << 18) | (e << 21);
							const uint8_t state14 = lookup[index];

							// handle right edge
							uint8_t se;
							if (leftX + 15 == width - 1) {
								ne = 0;
								e = 0;
								se = 0;
							} else {
								ne = *(gridRow0 + leftX + 16);
								e = *(gridRow1 + leftX + 16);
								se = *(gridRow2 + leftX + 16);
							}
							index = (index >> 9) | (ne << 18) | (e << 21) | (se << 24);
							const uint8_t state15 = lookup[index];

							// write the new cells
							v128_t writeVec = wasm_u8x16_make(state0, state1, state2, state3, state4, state5, state6, state7,
								state8, state9, state10, state11, state12, state13, state14, state15);
							wasm_v128_store(nextRow + leftX, writeVec);

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;

							// move the three source rows up
							aboveCellsVec = origCellsVec;
							origCellsVec = belowCellsVec;
							gridRow0 = gridRow1;
							gridRow1 += colourGridWidth;

							// handle bottom of grid
							gridRow2 = (y < height - 1) ? gridRow1 + colourGridWidth : blankColourRow;
							belowCellsVec = (y < height - 1) ? wasm_v128_load(gridRow2 + leftX) : zeroVec;

							botTwoVec = wasm_v128_or(origCellsVec, wasm_i8x16_shl(belowCellsVec, 3));

							// next destination row
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for Moore neighbourhood using 4 bit lookup
void nextGenerationRuleTreeMoorePartial4(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint32_t *const a,
	uint8_t *const b,
	uint32_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t nw, n, ne, w, c, e, sw, s, se;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							if (x == 0) {
								// handle left edge of grid
								n = 0;
								c = 0;
								s = 0;
							} else {
								n = *(gridRow0 + x - 1);
								c = *(gridRow1 + x - 1);
								s = *(gridRow2 + x - 1);
							}
							ne = *(gridRow0 + x);
							e = *(gridRow1 + x);
							se = *(gridRow2 + x);

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = ne;
								ne = *(gridRow0 + x + 1);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								sw = s;
								s = se;
								se = *(gridRow2 + x + 1);

								index = w | (n << 4) | (se << 8) | (sw << 12) | (ne << 16) | (nw << 20);
								uint8_t state = b[a[a[lookup[index] + e] + s] + c];

								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							n = ne;
							w = c;
							c = e;
							sw = s;
							s = se;
							if (x == width - 1) {
								ne = 0;
								e = 0;
								se = 0;
							} else {
								ne = *(gridRow0 + x + 1);
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							index = w | (n << 4) | (se << 8) | (sw << 12) | (ne << 16) | (nw << 20);
							uint8_t state = b[a[a[lookup[index] + e] + s] + c];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleTree rule next generation for von Neumann neighbourhood
void nextGenerationRuleTreeVN(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint32_t *const a,
	uint8_t *const b,
	const uint32_t base,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t n, e, s, w, c;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// get initial neighbours
							if (x == 0) {
								c = 0;
							} else {
								c = *(gridRow1 + x - 1);
							}
							e = *(gridRow1 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								w = c;
								c = e;
								n = *(gridRow0 + x);
								e = *(gridRow1 + x + 1);
								s = *(gridRow2 + x);

								// lookup state
								uint8_t state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							w = c;
							c = e;
							n = *(gridRow0 + x);
							if (x == width - 1) {
								e = 0;
							} else {
								e = *(gridRow1 + x + 1);
							}
							s = *(gridRow2 + x);

							// get the next state
							uint8_t state = b[a[a[a[a[base + n] + w] + e] + s] + c];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for von Neumann neighbourhood using 1 bit lookup
void nextGenerationRuleLoaderVNLookup1(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t e, n, s;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							if (x == 0) {
								// handle left edge of grid
								index = (gridRow1[x] << 3) | (e << 2) | (gridRow0[x] << 1) | gridRow2[x];
							} else {
								index = (gridRow1[x - 1] << 4) | (gridRow1[x] << 3) | (e << 2) | (gridRow0[x] << 1) | gridRow2[x];
							}
							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							n = gridRow0[x];
							if (x == width - 1) {
								e = 0;
							} else {
								e = *(gridRow1 + x + 1);
							}
							s = gridRow2[x];
							index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for von Neumann neighbourhood using 2 bit lookup
void nextGenerationRuleLoaderVNLookup2(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t e, n, s;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							if (x == 0) {
								// handle left edge of grid
								index = (gridRow1[x] << 6) | (e << 4) | (gridRow0[x] << 2) | gridRow2[x];
							} else {
								index = (gridRow1[x - 1] << 8) | (gridRow1[x] << 6) | (e << 4) | (gridRow0[x] << 2) | gridRow2[x];
							}
							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 960) | (e << 4) | (n << 2) | s;

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							n = gridRow0[x];
							if (x == width - 1) {
								e = 0;
							} else {
								e = *(gridRow1 + x + 1);
							}
							s = gridRow2[x];
							index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for von Neumann neighbourhood using 3 bit lookup
void nextGenerationRuleLoaderVNLookup3(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t e, n, s;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							if (x == 0) {
								// handle left edge of grid
								index = (gridRow1[x] << 9) | (e << 6) | (gridRow0[x] << 3) | gridRow2[x];
							} else {
								index = (gridRow1[x - 1] << 12) | (gridRow1[x] << 9) | (e << 6) | (gridRow0[x] << 3) | gridRow2[x];
							}
							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							n = gridRow0[x];
							if (x == width - 1) {
								e = 0;
							} else {
								e = *(gridRow1 + x + 1);
							}
							s = gridRow2[x];
							index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for von Neumann neighbourhood using 4 bit lookup
void nextGenerationRuleLoaderVNLookup4(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t e, n, s;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							if (x == 0) {
								// handle left edge of grid
								index = (gridRow1[x] << 12) | (e << 8) | (gridRow0[x] << 4) | gridRow2[x];
							} else {
								index = (gridRow1[x - 1] << 16) | (gridRow1[x] << 12) | (e << 8) | (gridRow0[x] << 4) | gridRow2[x];
							}
							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							n = gridRow0[x];
							if (x == width - 1) {
								e = 0;
							} else {
								e = *(gridRow1 + x + 1);
							}
							s = gridRow2[x];
							index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for von Neumann neighbourhood using 5 bit lookup
void nextGenerationRuleLoaderVNLookup5(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t e, n, s;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							if (x == 0) {
								// handle left edge of grid
								index = (gridRow1[x] << 15) | (e << 10) | (gridRow0[x] << 5) | gridRow2[x];
							} else {
								index = (gridRow1[x - 1] << 20) | (gridRow1[x] << 15) | (e << 10) | (gridRow0[x] << 5) | gridRow2[x];
							}
							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 5) & 33521664) | (e << 10) | (n << 5) | s;

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							n = gridRow0[x];
							if (x == width - 1) {
								e = 0;
							} else {
								e = *(gridRow1 + x + 1);
							}
							s = gridRow2[x];
							index = ((index << 5) & 33521664) | (e << 10) | (n << 5) | s;

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleTable rule next generation for Moore neighbourhood
void nextGenerationRuleTableMoore(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint32_t *const lut,
	const uint32_t lutSize,
	uint8_t *const output,
	const uint32_t nCompressed,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t n, e, s, w, c, ne, nw, se, sw;

	// compute the offsets in the LUT array
	uint32_t nOffset = lutSize / 9;

	// get the pointers to the per neighbour LUTs
	uint32_t *const lut0 = lut;
	uint32_t *const lut1 = lut + nOffset;
	uint32_t *const lut2 = lut + nOffset * 2;
	uint32_t *const lut3 = lut + nOffset * 3;
	uint32_t *const lut4 = lut + nOffset * 4;
	uint32_t *const lut5 = lut + nOffset * 5;
	uint32_t *const lut6 = lut + nOffset * 6;
	uint32_t *const lut7 = lut + nOffset * 7;
	uint32_t *const lut8 = lut + nOffset * 8;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// get initial neighbours
							if (x == 0) {
								n = 0;
								c = 0;
								s = 0;
							} else {
								n = *(gridRow0 + x - 1);
								c = *(gridRow1 + x - 1);
								s = *(gridRow2 + x - 1);
							}
							ne = *(gridRow0 + x);
							e = *(gridRow1 + x);
							se = *(gridRow2 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = ne;
								ne = *(gridRow0 + x + 1);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								sw = s;
								s = se;
								se = *(gridRow2 + x + 1);
								uint8_t state = c;

								uint32_t *lutc = lut0 + c * nCompressed;
								uint32_t *lutn = lut1 + n * nCompressed;
								uint32_t *lutne = lut2 + ne * nCompressed;
								uint32_t *lute = lut3 + e * nCompressed;
								uint32_t *lutse = lut4 + se * nCompressed;
								uint32_t *luts = lut5 + s * nCompressed;
								uint32_t *lutsw = lut6+ sw * nCompressed;
								uint32_t *lutw = lut7 + w * nCompressed;
								uint32_t *lutnw = lut8 + nw * nCompressed;

								for (uint32_t iRuleC = 0; iRuleC < nCompressed; iRuleC++) {
									uint32_t isMatch = lutc[iRuleC] & lutn[iRuleC];
									if (isMatch) {
										isMatch &= lutne[iRuleC] & lute[iRuleC];
										if (isMatch) {
											isMatch &= lutse[iRuleC] & luts[iRuleC];
											if (isMatch) {
												isMatch &= lutsw[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
												if (isMatch) {
													uint32_t iBit = 0;
													//uint32_t mask = 1;
													//while (!(isMatch & mask)) {
														//iBit++;
														//mask <<= 1;
													//}
													uint32_t v = isMatch;
													while ((v & 1) == 0) {
														iBit++;
														v >>= 1;
													}
													state = output[(iRuleC << 5) + iBit];
													break;
												}
											}
										}
									}
								}

								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							n = ne;
							w = c;
							c = e;
							sw = s;
							s = se;
							if (x == width - 1) {
								ne = 0;
								e = 0;
								se = 0;
							} else {
								ne = *(gridRow0 + x + 1);
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							// get the next state
							uint32_t *lutc = lut0 + c * nCompressed;
							uint32_t *lutn = lut1 + n * nCompressed;
							uint32_t *lutne = lut2 + ne * nCompressed;
							uint32_t *lute = lut3 + e * nCompressed;
							uint32_t *lutse = lut4 + se * nCompressed;
							uint32_t *luts = lut5 + s * nCompressed;
							uint32_t *lutsw = lut6+ sw * nCompressed;
							uint32_t *lutw = lut7 + w * nCompressed;
							uint32_t *lutnw = lut8 + nw * nCompressed;

							uint32_t state = c;

							for (uint32_t iRuleC = 0; iRuleC < nCompressed; iRuleC++) {
								uint32_t isMatch = lutc[iRuleC] & lutn[iRuleC];
								if (isMatch) {
									isMatch &= lutne[iRuleC] & lute[iRuleC];
									if (isMatch) {
										isMatch &= lutse[iRuleC] & luts[iRuleC];
										if (isMatch) {
											isMatch &= lutsw[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
											if (isMatch) {
												uint32_t iBit = 0;
												//uint32_t mask = 1;
												//while (!(isMatch & mask)) {
													//iBit++;
													//mask <<= 1;
												//}
												uint32_t v = isMatch;
												while ((v & 1) == 0) {
													iBit++;
													v >>= 1;
												}
												state = output[(iRuleC << 5) + iBit];
												break;
											}
										}
									}
								}
							}
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleTable rule next generation for Hexagonal neighbourhood
void nextGenerationRuleTableHex(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint32_t *const lut,
	const uint32_t lutSize,
	uint8_t *const output,
	const uint32_t nCompressed,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t n, e, s, w, c, nw, se;

	// compute the offsets in the LUT array
	uint32_t nOffset = lutSize / 7;

	// get the pointers to the per neighbour LUTs
	uint32_t *const lut0 = lut;
	uint32_t *const lut1 = lut + nOffset;
	uint32_t *const lut2 = lut + nOffset * 2;
	uint32_t *const lut3 = lut + nOffset * 3;
	uint32_t *const lut4 = lut + nOffset * 4;
	uint32_t *const lut5 = lut + nOffset * 5;
	uint32_t *const lut6 = lut + nOffset * 6;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// get initial neighbours
							if (x == 0) {
								n = 0;
								c = 0;
								s = 0;
							} else {
								n = *(gridRow0 + x - 1);
								c = *(gridRow1 + x - 1);
								s = *(gridRow2 + x - 1);
							}
							e = *(gridRow1 + x);
							se = *(gridRow2 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = *(gridRow0 + x);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								s = se;
								se = *(gridRow2 + x + 1);
								uint8_t state = c;

								uint32_t *lutc = lut0 + c * nCompressed;
								uint32_t *lutn = lut1 + n * nCompressed;
								uint32_t *lute = lut2 + e * nCompressed;
								uint32_t *lutse = lut3 + se * nCompressed;
								uint32_t *luts = lut4 + s * nCompressed;
								uint32_t *lutw = lut5 + w * nCompressed;
								uint32_t *lutnw = lut6 + nw * nCompressed;

								for (uint32_t iRuleC = 0; iRuleC < nCompressed; iRuleC++) {
									uint32_t isMatch = lutc[iRuleC] & lutn[iRuleC];
									if (isMatch) {
										isMatch &= lute[iRuleC] & lutse[iRuleC];
										if (isMatch) {
											isMatch &= luts[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
											if (isMatch) {
												uint32_t iBit = 0;
												uint32_t mask = 1;
												while (!(isMatch & mask)) {
													iBit++;
													mask <<= 1;
												}
												state = output[(iRuleC << 5) + iBit];
												break;
											}
										}
									}
								}

								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							n = gridRow0[x];
							w = c;
							c = e;
							s = se;
							if (x == width - 1) {
								e = 0;
								se = 0;
							} else {
								e = gridRow1[x + 1];
								se = gridRow2[x + 1];
							}

							uint32_t *lutc = lut0 + c * nCompressed;
							uint32_t *lutn = lut1 + n * nCompressed;
							uint32_t *lute = lut2 + e * nCompressed;
							uint32_t *lutse = lut3 + se * nCompressed;
							uint32_t *luts = lut4 + s * nCompressed;
							uint32_t *lutw = lut5 + w * nCompressed;
							uint32_t *lutnw = lut6 + nw * nCompressed;
							uint8_t state = c;

							for (uint32_t iRuleC = 0; iRuleC < nCompressed; iRuleC++) {
								uint32_t isMatch = lutc[iRuleC] & lutn[iRuleC];
								if (isMatch) {
									isMatch &= lute[iRuleC] & lutse[iRuleC];
									if (isMatch) {
										isMatch &= luts[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
										if (isMatch) {
											uint32_t iBit = 0;
											uint32_t mask = 1;
											while (!(isMatch & mask)) {
												iBit++;
												mask <<= 1;
											}
											state = output[(iRuleC << 5) + iBit];
											break;
										}
									}
								}
							}

							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleTable rule next generation for von Neumann neighbourhood
void nextGenerationRuleTableVN(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint32_t *const lut,
	const uint32_t lutSize,
	uint8_t *const output,
	const uint32_t nCompressed,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t n, e, s, w, c;

	// compute the offsets in the LUT array
	uint32_t nOffset = lutSize / 5;

	// get the pointers to the per neighbour LUTs
	uint32_t *const lut0 = lut;
	uint32_t *const lut1 = lut + nOffset;
	uint32_t *const lut2 = lut + nOffset * 2;
	uint32_t *const lut3 = lut + nOffset * 3;
	uint32_t *const lut4 = lut + nOffset * 4;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// grid
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// get initial neighbours
							if (x == 0) {
								c = 0;
							} else {
								c = *(gridRow1 + x - 1);
							}
							e = *(gridRow1 + x);

							while (x < rightX - 1) {
								// shift neighbourhood left
								n = *(gridRow0 + x);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								s = *(gridRow2 + x);
								uint8_t state = c;

								uint32_t *lutc = lut0 + c * nCompressed;
								uint32_t *lutn = lut1 + n * nCompressed;
								uint32_t *lute = lut2 + e * nCompressed;
								uint32_t *luts = lut3 + s * nCompressed;
								uint32_t *lutw = lut4 + w * nCompressed;

								for (uint32_t iRuleC = 0; iRuleC < nCompressed; iRuleC++) {
									uint32_t isMatch = lutc[iRuleC] & lutn[iRuleC];
									if (isMatch) {
										isMatch &= lute[iRuleC] & luts[iRuleC] & lutw[iRuleC];
										if (isMatch) {
											uint32_t iBit = 0;
											uint32_t mask = 1;
											while (!(isMatch & mask)) {
												iBit++;
												mask <<= 1;
											}
											state = output[(iRuleC << 5) + iBit];
											break;
										}
									}
								}

								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							w = c;
							c = e;
							n = gridRow0[x];
							if (x == width - 1) {
								e = 0;
							} else {
								e = gridRow1[x + 1];
							}

							uint32_t *lutc = lut0 + c * nCompressed;
							uint32_t *lutn = lut1 + n * nCompressed;
							uint32_t *lute = lut2 + e * nCompressed;
							uint32_t *luts = lut3 + s * nCompressed;
							uint32_t *lutw = lut4 + w * nCompressed;
							uint8_t state = c;

							for (uint32_t iRuleC = 0; iRuleC < nCompressed; iRuleC++) {
								uint32_t isMatch = lutc[iRuleC] & lutn[iRuleC];
								if (isMatch) {
									isMatch &= lute[iRuleC] & luts[iRuleC] & lutw[iRuleC];
									if (isMatch) {
										uint32_t iBit = 0;
										uint32_t mask = 1;
										while (!(isMatch & mask)) {
											iBit++;
											mask <<= 1;
										}
										state = output[(iRuleC << 5) + iBit];
										break;
									}
								}
							}

							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for Hexagonal neighbourhood using 1 bit lookup
void nextGenerationRuleLoaderHexLookup1(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t nw, n, w, c, e, s, se;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							se = gridRow2[x + 1];
							n = gridRow0[x];
							c = gridRow1[x];
							s = gridRow2[x];
							if (x == 0) {
								// handle left edge of grid
								index = c | (s << 1) | (e << 2) | (n << 4) | (se << 5);
							} else {
								index = (gridRow0[x - 1] << 6) | (gridRow1[x - 1] << 3) | c | (s << 1) | (e << 2) | (n << 4) | (se << 5);
							}

							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = *(gridRow0 + x);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								s = se;
								se = *(gridRow2 + x + 1);
								index = c | (s << 1) | (e << 2) | (w << 3) | (n << 4) | (se << 5) | (nw << 6);

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							n = *(gridRow0 + x);
							w = c;
							c = e;
							s = se;
							if (x == width - 1) {
								e = 0;
								se = 0;
							} else {
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							index = c | (s << 1) | (e << 2) | (w << 3) | (n << 4) | (se << 5) | (nw << 6);

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for Hexagonal neighbourhood using 2 bit lookup
void nextGenerationRuleLoaderHexLookup2(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t nw, n, w, c, e, s, se;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							se = gridRow2[x + 1];
							n = gridRow0[x];
							c = gridRow1[x];
							s = gridRow2[x];
							if (x == 0) {
								// handle left edge of grid
								index = c | (s << 2) | (e << 4) | (n << 8) | (se << 10);
							} else {
								index = (gridRow0[x - 1] << 12) | (gridRow1[x - 1] << 6) | c | (s << 2) | (e << 4) | (n << 8) | (se << 10);
							}

							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = *(gridRow0 + x);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								s = se;
								se = *(gridRow2 + x + 1);
								index = c | (s << 2) | (e << 4) | (w << 6) | (n << 8) | (se << 10) | (nw << 12);

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							n = *(gridRow0 + x);
							w = c;
							c = e;
							s = se;
							if (x == width - 1) {
								e = 0;
								se = 0;
							} else {
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							index = c | (s << 2) | (e << 4) | (w << 6) | (n << 8) | (se << 10) | (nw << 12);

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}


EMSCRIPTEN_KEEPALIVE
// compute RuleLoader rule next generation for Hexagonal neighbourhood using 3 bit lookup
void nextGenerationRuleLoaderHexLookup3(
	uint8_t *const colourGrid,
	uint8_t *const nextColourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const tileGrid16,
	uint16_t *const nextTileGrid16,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	const uint32_t tileGridSize,
	uint16_t *const diedGrid,
	uint16_t *const columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *const rowOccupied16,
	const uint32_t rowOccupiedWidth,
	uint8_t *const lookup,
	const uint32_t width,
	const uint32_t height,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *const blankTileRow,
	const uint32_t blankTileRowWidth,
	uint8_t *const blankColourRow,
	const uint32_t counter,
	const uint32_t bottomRightSet,
	const uint32_t bottomSet,
	const uint32_t topRightSet,
	const uint32_t topSet,
	const uint32_t bottomLeftSet,
	const uint32_t topLeftSet,
	const uint32_t leftSet,
	const uint32_t rightSet,
	uint32_t *shared
) {
	uint32_t nw, n, w, c, e, s, se;

	// population statistics
	uint32_t population = 0, births = 0, deaths = 0;

	// tile width
	const uint32_t xSize = ySize;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// constants
	const v128_t zeroVec = wasm_u8x16_splat(0);
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// switch buffers each generation
	uint8_t *grid = nextColourGrid;
	uint8_t *nextGrid = colourGrid;
	uint16_t *tileGrid = nextTileGrid16;
	uint16_t *nextTileGrid = tileGrid16;

	// select the correct grid
	if ((counter & 1) == 0) {
		grid = colourGrid;
		nextGrid = nextColourGrid;
		tileGrid = tileGrid16;
		nextTileGrid = nextTileGrid16;
	}

	// clear column occupied flags
	memset(columnOccupied16, 0, columnOccupiedWidth * sizeof(*columnOccupied16));

	// clear row occupied flags
	memset(rowOccupied16, 0, rowOccupiedWidth * sizeof(*rowOccupied16));

	// clear the next tile grid
	memset(nextTileGrid, 0, tileGridSize * sizeof(*nextTileGrid));

	// set the initial tile row
	uint32_t bottomY = 0;
	uint32_t topY = bottomY + ySize;

	// scan each row of tiles
	for (uint32_t th = 0; th < tileRows; th++) {
		// set initial tile column
		uint32_t leftX = 0;
		uint32_t rightX = leftX + xSize;

		// get the colour tile rows
		uint16_t *tileRow = tileGrid + th * tileGridWidth;
		uint16_t *nextTileRow = nextTileGrid + th * tileGridWidth;
		uint16_t *diedRow = diedGrid + th * tileGridWidth;
		uint16_t *belowNextTileRow = blankTileRow;
		uint16_t *aboveNextTileRow = blankTileRow;

		// get the tile row below
		if (th > 0) {
			belowNextTileRow = nextTileRow - tileGridWidth;
		}

		// get the tile row above
		if (th < tileRows - 1) {
			aboveNextTileRow = nextTileRow + tileGridWidth;
		}

		// scan each set of tiles
		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get the next tile group (16 tiles)
			uint32_t tiles = *(tileRow + tw);
			uint32_t diedTiles = 0;

			// check if any are occupied
			if (tiles) {
				// get the destination
				uint32_t nextTiles = *(nextTileRow + tw);
				uint32_t belowNextTiles = *(belowNextTileRow + tw);
				uint32_t aboveNextTiles = *(aboveNextTileRow + tw);

				// compute next colour for each tile in the set
				for (int32_t bit = 15; bit >= 0; bit--) {
					// check if this tile is occupied
					if (tiles & (1 << bit)) {
						// mark no cells alive in the source tile
						uint32_t anyAlive = 0;

						// mark no cells in this column
						uint32_t colOccupied = 0;

						// mark no cells in the tile rows
						uint32_t rowOccupied = 0;

						// clear the edge flags
						uint32_t neighbours = 0;

						// process the bottom row of the tile
						uint32_t y = bottomY;
						uint32_t rowIndex = 32768;

						// process each row of the tile
						uint8_t *gridRow1 = grid + bottomY * colourGridWidth;
						uint8_t *nextRow = nextGrid + bottomY * colourGridWidth;

						while (y < topY) {
							uint8_t *gridRow0 = blankColourRow;
							uint8_t *gridRow2 = blankColourRow;

							// deal with bottom row of the grid
							if (y > 0) {
								gridRow0 = gridRow1 - colourGridWidth;
							}
							// deal with top row of the grid
							if (y < height - 1) {
								gridRow2 = gridRow1 + colourGridWidth;
							}

							// process each column in the row
							uint32_t x = leftX;
							uint32_t index;

							// get original 16 cells
							v128_t origCellsVec = wasm_v128_load(gridRow1 + leftX);

							// process each cell along the tile row
							e = gridRow1[x + 1];
							se = gridRow2[x + 1];
							n = gridRow0[x];
							c = gridRow1[x];
							s = gridRow2[x];
							if (x == 0) {
								// handle left edge of grid
								index = c | (s << 3) | (e << 6) | (n << 12) | (se << 15);
							} else {
								index = (gridRow0[x - 1] << 18) | (gridRow1[x - 1] << 9) | c | (s << 3) | (e << 6) | (n << 12) | (se << 15);
							}

							uint8_t state = lookup[index];
							*(nextRow + x) = state;

							// next column
							x++;

							// handle middle cells
							while (x < rightX - 1) {
								// shift neighbourhood left
								nw = n;
								n = *(gridRow0 + x);
								w = c;
								c = e;
								e = *(gridRow1 + x + 1);
								s = se;
								se = *(gridRow2 + x + 1);
								index = c | (s << 3) | (e << 6) | (w << 9) | (n << 12) | (se << 15) | (nw << 18);

								state = lookup[index];
								*(nextRow + x) = state;

								// next column
								x++;
							}

							// handle right edge
							nw = n;
							n = *(gridRow0 + x);
							w = c;
							c = e;
							s = se;
							if (x == width - 1) {
								e = 0;
								se = 0;
							} else {
								e = *(gridRow1 + x + 1);
								se = *(gridRow2 + x + 1);
							}

							index = c | (s << 3) | (e << 6) | (w << 9) | (n << 12) | (se << 15) | (nw << 18);

							state = lookup[index];
							*(nextRow + x) = state;

							// load new row
							v128_t newCellsVec = wasm_v128_load(nextRow + leftX);

							// get original alive cells
							v128_t origAliveVec = wasm_u8x16_gt(origCellsVec, zeroVec);
							uint32_t origAlive = wasm_i8x16_bitmask(origAliveVec);

							// get new alive cells
							v128_t newAliveVec = wasm_u8x16_gt(newCellsVec, zeroVec);
							uint32_t newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update births and deaths
							births += __builtin_popcount(newAlive & ~origAlive);
							deaths += __builtin_popcount(origAlive & ~newAlive);

							// get new alive cells in correct order
							newAliveVec = wasm_i8x16_swizzle(newAliveVec, reverseVec);
							newAlive = wasm_i8x16_bitmask(newAliveVec);

							// update population
							population += __builtin_popcount(newAlive);

							// check if any cell was alive in the source
							anyAlive |= origAlive;

							if (newAlive) {
								colOccupied |= newAlive;
								rowOccupied |= rowIndex;
							}

							// next row
							y++;
							rowIndex >>= 1;
							gridRow1 += colourGridWidth;
							nextRow += colourGridWidth;
						}

						// update the column and row occupied cells
						columnOccupied16[leftX >> 4] |= colOccupied;

						// update tile grid if any cells are set
						if (colOccupied) {
							// set this tile
							nextTiles |= (1 << bit);

							// check for neighbours
							if (rowOccupied & 1) {
								neighbours |= topSet;
								if (colOccupied & 32768) {
									neighbours |= topLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= topRightSet;
								}
							}

							if (rowOccupied & 32768) {
								neighbours |= bottomSet;
								if (colOccupied & 32768) {
									neighbours |= bottomLeftSet;
								}
								if (colOccupied & 1) {
									neighbours |= bottomRightSet;
								}
							}

							if (colOccupied & 32768) {
								neighbours |= leftSet;
							}

							if (colOccupied & 1) {
								neighbours |= rightSet;
							}

							// update any neighbouring tiles
							if (neighbours) {
								// check whether left edge occupied
								if (neighbours & leftSet) {
									if (bit < 15) {
										nextTiles |= (1 << (bit + 1));
									} else {
										// set in previous set if not at left edge
										if ((tw > 0) && (leftX > 0)) {
											nextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether right edge occupied
								if (neighbours & rightSet) {
									if (bit > 0) {
										nextTiles |= (1 << (bit - 1));
									} else {
										// set carry over to go into next set if not at right edge
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											nextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether bottom edge occupied
								if (neighbours & bottomSet) {
									// set in lower tile set
									belowNextTiles |= (1 << bit);
								}

								// check whether top edge occupied
								if (neighbours & topSet) {
									// set in upper tile set
									aboveNextTiles |= (1 << bit);
								}

								// check whether bottom left occupied
								if (neighbours & bottomLeftSet) {
									if (bit < 15) {
										belowNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											belowNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether bottom right occupied
								if (neighbours & bottomRightSet) {
									if (bit > 0) {
										belowNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											belowNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}

								// check whether top left occupied
								if (neighbours & topLeftSet) {
									if (bit < 15) {
										aboveNextTiles |= (1 << (bit + 1));
									} else {
										if ((tw > 0) && (leftX > 0)) {
											aboveNextTileRow[tw - 1] |= 1;
										}
									}
								}

								// check whether top right occupied
								if (neighbours & topRightSet) {
									if (bit > 0) {
										aboveNextTiles |= (1 << (bit - 1));
									} else {
										if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
											aboveNextTileRow[tw + 1] |= (1 << 15);
										}
									}
								}
							}
						} else {
							// all the cells in the tile died so check if any source cells were alive
							if (anyAlive) {
								diedTiles |= 1 << bit;
							}
						}

						// save the row occupied falgs
						rowOccupied16[th] |= rowOccupied;
					}

					// next tile columns
					leftX += xSize;
					rightX += xSize;
				}

				// save the tile groups
				nextTileRow[tw] |= nextTiles;
				if (th > 0) {
					belowNextTileRow[tw] |= belowNextTiles;
				}
				if (th < tileRows - 1) {
					aboveNextTileRow[tw] |= aboveNextTiles;
				}
			} else {
				// skip tile set
				leftX += xSize << 4;
				rightX += xSize << 4;
			}

			// update tiles where all cells died
			diedRow[tw] = diedTiles;
		}

		// next tile rows
		bottomY += ySize;
		topY += ySize;
	}

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileRowWidth * sizeof(*blankTileRow));

	// clear tiles in source that died
	clearTilesThatDied(grid, colourGridWidth, diedGrid, tileRows, tileGridWidth, xSize, ySize, tileCols16);

	// set the history tile grid to the colour tile grid
	for (uint32_t y = 0; y < tileGridSize; y++) {
		colourTileHistoryGrid[y] |= tileGrid[y] | nextTileGrid[y];
	}

	// return data to JS
	*shared++ = population;
	*shared++ = births;
	*shared++ = deaths;

	// update bounding box
	shared = updateBoundingBox(columnOccupied16, columnOccupiedWidth, rowOccupied16, rowOccupiedWidth, width, height, shared);
}
