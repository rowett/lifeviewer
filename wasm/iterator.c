// LifeViewer WebAssembly functions
// Faster versions of LifeViewer functions implemented using WebAssembly SIMD Intrinstics
// See: https://emscripten.org/docs/porting/simd.html#webassembly-simd-intrinsics
//
// Iterator
//	convertToPens (Life-like)
//	nextGeneration (Life-like)
//	nextGenerationGenerations (Generations)
//	nextGenerationSuperMoore (Super, Moore)

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


EMSCRIPTEN_KEEPALIVE
// update the pens from the grid for cell history and longevity
void convertToPens(
	uint8_t *colourGrid,
	uint16_t *colourTileHistoryGrid,
	uint16_t *colourTileGrid,
	const int32_t tileY,
	const int32_t tileX,
	const int32_t tileRows,
	const int32_t tileCols,
	uint16_t *grid,
	uint16_t *tileGrid,
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
	const v128_t increment = wasm_u8x16_splat(1);			// increment/iecrement by 1
	const v128_t mask = wasm_u64x2_splat(0x0102040810204080);	// mask to isolate cell bits

	// find each occupied tile
	for (uint32_t th = 0; th < tileRows; th++) {
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
					v128_t pensAlive = wasm_v128_bitselect(wasm_u8x16_add_sat(pens, increment), penBaseSet, pensIfAlive);

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


// Function to vectorize the update of the colour grid, including population, births, and deaths
EMSCRIPTEN_KEEPALIVE
void nextGenerationGenerations(
	uint8_t *colourGrid,
	uint16_t *colourTileHistoryGrid,
	uint16_t *colourTileGrid,
	const int32_t tileY,
	const int32_t tileX,
	const int32_t tileRows,
	const int32_t tileCols,
	uint16_t *grid,
	uint16_t *tileGrid,
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
	for (uint32_t th = 0; th < tileRows; th++) {
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
						uint32_t leftMost = 31 - __builtin_clz(aliveBits);
						uint32_t rightMost = __builtin_ctz(aliveBits);

						// update the min and max X
						if ((currentX << 4) + rightMost < newLeftX) {
							newLeftX = (currentX << 4) + rightMost;
						}
						if ((currentX << 4) + leftMost > newRightX) {
							newRightX = (currentX << 4) + leftMost;
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
	shared[0] = newLeftX;
	shared[1] = newBottomY;
	shared[2] = newRightX;
	shared[3] = newTopY;
	shared[4] = population;
	shared[5] = births;
	shared[6] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// update the life grid region using tiles
void nextGeneration(
	uint16_t *grid16,
	uint16_t *nextGrid16,
	const uint32_t gridWidth,
	uint16_t *tileGrid16,
	uint16_t *nextTileGrid16,
	const uint32_t tileGridWidth,
	uint8_t* indexLookup631,
	uint8_t* indexLookup632,
	const uint32_t altSpecified,
	uint16_t *columnOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *rowOccupied16,
	const uint32_t rowOccupiedWidth,
	const uint32_t width,
	const uint32_t height,
	const uint32_t tileX,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *blankTileRow,
	const uint32_t blankTileWidth,
	uint16_t *blankRow16,
	const uint32_t blankRowWidth,
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

	// new box extent
	int32_t newBottomY = height;
	int32_t newTopY = -1;
	int32_t newLeftX = width;
	int32_t newRightX = -1;

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

	// update bounding box
	for (int32_t tw = 0; tw < width16; tw++) {
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

	// clear the blank tile row since it may have been written to at top and bottom
	memset(blankTileRow, 0, blankTileWidth * sizeof(*blankTileRow));

	// return data to JS
	shared[0] = newLeftX;
	shared[1] = newBottomY;
	shared[2] = newRightX;
	shared[3] = newTopY;
	shared[4] = population;
	shared[5] = births;
	shared[6] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// compute super rule next generation (after state 0 and 1)
void nextGenerationSuperMoore(
	uint16_t *grid16,
	uint16_t *nextGrid16,
	const uint32_t gridWidth,
	uint16_t *tileGrid16,
	uint16_t *nextTileGrid16,
	uint16_t *colourTileGrid,
	uint16_t *colourTileHistoryGrid,
	const uint32_t tileGridWidth,
	uint8_t *colourGrid8,
	uint8_t *nextColourGrid8,
	const uint32_t colourGridWidth,
	uint16_t *columnOccupied16,
	uint16_t *columnAliveOccupied16,
	const uint32_t columnOccupiedWidth,
	uint16_t *rowOccupied16,
	uint16_t *rowAliveOccupied16,
	const uint32_t rowOccupiedWidth,
	const uint32_t width,
	const uint32_t height,
	const uint32_t tileX,
	const uint32_t ySize,
	const uint32_t tileRows,
	const uint32_t tileCols,
	uint16_t *blankTileRow,
	const uint32_t blankTileWidth,
	uint16_t *blankRow16,
	const uint32_t blankRowWidth,
	uint8_t *blankColourRow,
	const uint32_t blockColourRowWidth,
	const uint32_t counter,
	uint32_t population,
	uint32_t births,
	uint32_t deaths,
	uint32_t *shared
) {
	uint32_t c, e;
	uint32_t lcol, ccol, rcol;
	int32_t calc;
	const uint32_t width16 = width >> 4;

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

	// new box extent
	int32_t newBottomY = height;
	int32_t newTopY = -1;
	int32_t newLeftX = width;
	int32_t newRightX = -1;
	int32_t newAliveBottomY = height;
	int32_t newAliveTopY = -1;
	int32_t newAliveLeftX = width;
	int32_t newAliveRightX = -1;

	// tile width in 16 bit chunks
	const uint32_t xSize = tileX >> 1;

	// tile columns in 16 bit values
	const uint32_t tileCols16 = tileCols >> 4;

	// grid
	uint16_t *grid = grid16;
	uint16_t *nextGrid = nextGrid16;
	uint16_t *tileGrid = tileGrid16;
	uint16_t *nextTileGrid = nextTileGrid16;
	uint8_t *colourGrid = nextColourGrid8;
	uint8_t *outputGrid = colourGrid8;

	// select the correct grid
	if (counter & 1) {
		grid = nextGrid16;
		tileGrid = nextTileGrid;
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
			uint32_t nextTiles = 0;
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

				// flag nothing alive in the tile
				uint32_t tileAlive = 0;

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
						uint32_t value = c;

						// typemask has a bit set per state in the neighbouring cells
						typeMask = lcol | ccol | rcol;

						// handle state 6
						bool process = true;
						if (typeMask & (1 << 6)) {
							process = false;
							if (c == 7 || c == 8 || c >= 13) {
								value = 0;
							} else {
								switch (c) {
									case 1:
										value = 2;
										break;

									case 3:
									case 5:
										value = 4;
										break;

									case 9:
										value = 10;
										break;

									case 11:
										value = 12;
										break;

									default:
										// not handled here so process below
										process = true;
										break;
								}
							}

							// clear cell in bit grid
							if (!process && (c & 1)) {
								if (*gridRow & colIndex) {
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
											if (*gridRow & colIndex) {
												*gridRow &= ~colIndex;
												births--;
												population--;
											}
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

				// check if the row was alive
				if (tileAlive) {
					// update tile flag
					nextTiles |= (1 << b);
				}
			}

			// save the tile group
			colourTileRow[tw] = origTiles | nextTiles;
			colourTileHistoryRow[tw] |= origTiles | nextTiles;

			// next tile set
			leftX = currentX + (xSize << 4);
		}

		// next tile row
		bottomY += ySize;
		topY += ySize;
	}

	// update bounding box
	for (int32_t tw = 0; tw < width16; tw++) {
		if (columnOccupied16[tw]) {
			if (tw < newLeftX) {
				newLeftX = tw;
			}
			if (tw > newRightX) {
				newRightX = tw;
			}
		}

		if (columnAliveOccupied16[tw]) {
			if (tw < newAliveLeftX) {
				newAliveLeftX = tw;
			}
			if (tw > newAliveRightX) {
				newAliveRightX = tw;
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

		if (rowAliveOccupied16[th]) {
			if (th < newAliveBottomY) {
				newAliveBottomY = th;
			}
			if (th > newAliveTopY) {
				newAliveTopY = th;
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

	// convert new width to pixels
	newAliveLeftX = (newAliveLeftX << 4) + (__builtin_clz(columnAliveOccupied16[newAliveLeftX]) - 16);
	newAliveRightX = (newAliveRightX << 4) + (15 - __builtin_ctz(columnAliveOccupied16[newAliveRightX]));

	// convert new height to pixels
	newAliveBottomY = (newAliveBottomY << 4) + (__builtin_clz(rowAliveOccupied16[newAliveBottomY]) - 16);
	newAliveTopY = (newAliveTopY << 4) + (15 - __builtin_ctz(rowAliveOccupied16[newAliveTopY]));

	// ensure the alive box is not blank
	if (newAliveTopY < 0) {
		newAliveTopY = height - 1;
	}
	if (newAliveBottomY >= height) {
		newAliveBottomY = 0;
	}
	if (newAliveLeftX >= width) {
		newAliveLeftX = 0;
	}
	if (newAliveRightX < 0) {
		newAliveRightX = width - 1;
	}

	// clip to the screen
	if (newAliveTopY > height - 1) {
		newAliveTopY = height - 1;
	}
	if (newAliveBottomY < 0) {
		newAliveBottomY = 0;
	}
	if (newAliveLeftX < 0) {
		newAliveLeftX = 0;
	}
	if (newAliveRightX > width - 1) {
		newAliveRightX = width - 1;
	}

	// return data to JS
	shared[0] = newLeftX;
	shared[1] = newBottomY;
	shared[2] = newRightX;
	shared[3] = newTopY;
	shared[4] = newAliveLeftX;
	shared[5] = newAliveBottomY;
	shared[6] = newAliveRightX;
	shared[7] = newAliveTopY;
	shared[8] = population;
	shared[9] = births;
	shared[10] = deaths;
}

