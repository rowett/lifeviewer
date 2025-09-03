// LifeViewer WebAssembly functions
// Faster versions of LifeViewer functions implemented using WebAssembly SIMD Intrinstics
// See: https://emscripten.org/docs/porting/simd.html#webassembly-simd-intrinsics
//
// Rendering
//	createNxNColourGrid (N = 2, 4, 8, 16, 32)
//	createNxNColourGridSuper (N = 2, 4, 8, 16, 32)
//	renderGridNoClipNoRotate (single layer, square or triangular)
//	renderGridClipNoRotate (single layer, square or triangular)
//	renderOverlayNoClipNoRotate (single layer [R]History)
//	renderOverlayClipNoRotate (single layer [R]History)

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
#include <math.h>


EMSCRIPTEN_KEEPALIVE
// create the 2x2 colour grid by finding the maximum pixel value in each 2x2 block
void create2x2ColourGrid(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// swizzle for column pairs
	const v128_t swizzle1 = wasm_u8x16_make(1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14);

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;
	const uint32_t cgw5 = cgw4 + colourGridWidth;
	const uint32_t cgw6 = cgw5 + colourGridWidth;
	const uint32_t cgw7 = cgw6 + colourGridWidth;
	const uint32_t cgw8 = cgw7 + colourGridWidth;

	// find each occupied tile
	uint32_t tileRowOffset = 0;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						const uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						// load rows 1 to 8
						v128_t row1 = wasm_v128_load(colourRow);
						v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
						v128_t row3 = wasm_v128_load(colourRow + cgw2);
						v128_t row4 = wasm_v128_load(colourRow + cgw3);
						v128_t row5 = wasm_v128_load(colourRow + cgw4);
						v128_t row6 = wasm_v128_load(colourRow + cgw5);
						v128_t row7 = wasm_v128_load(colourRow + cgw6);
						v128_t row8 = wasm_v128_load(colourRow + cgw7);

						// create the maximum of each row pair
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);

						// create the maximum of each coloumn pair
						row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));
						row3 = wasm_u8x16_max(row3, wasm_i8x16_swizzle(row3, swizzle1));
						row5 = wasm_u8x16_max(row5, wasm_i8x16_swizzle(row5, swizzle1));
						row7 = wasm_u8x16_max(row7, wasm_i8x16_swizzle(row7, swizzle1));

						// write to the small grid
						wasm_v128_store(smallRow, row1);
						wasm_v128_store(smallRow + cgw2, row3);
						wasm_v128_store(smallRow + cgw4, row5);
						wasm_v128_store(smallRow + cgw6, row7);

						// go to next 8 rows
						colourRow += cgw8;
						smallRow += cgw8;

						// load rows 9 to 16
						row1 = wasm_v128_load(colourRow);
						row2 = wasm_v128_load(colourRow + colourGridWidth);
						row3 = wasm_v128_load(colourRow + cgw2);
						row4 = wasm_v128_load(colourRow + cgw3);
						row5 = wasm_v128_load(colourRow + cgw4);
						row6 = wasm_v128_load(colourRow + cgw5);
						row7 = wasm_v128_load(colourRow + cgw6);
						row8 = wasm_v128_load(colourRow + cgw7);

						// create the maximum of each row pair
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);

						// create the maximum of each coloumn pair
						row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));
						row3 = wasm_u8x16_max(row3, wasm_i8x16_swizzle(row3, swizzle1));
						row5 = wasm_u8x16_max(row5, wasm_i8x16_swizzle(row5, swizzle1));
						row7 = wasm_u8x16_max(row7, wasm_i8x16_swizzle(row7, swizzle1));

						// write to the small grid
						wasm_v128_store(smallRow, row1);
						wasm_v128_store(smallRow + cgw2, row3);
						wasm_v128_store(smallRow + cgw4, row5);
						wasm_v128_store(smallRow + cgw6, row7);
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 4x4 colour grid
void create4x4ColourGrid(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileY,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const int32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// grid width multiples
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;

	// swizzles for column pairs
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// find each occupied tile
	uint32_t tileRowOffset = 0;
	uint32_t bottomY = 0, topY = tileY;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						for (uint32_t h = bottomY; h < topY; h += 4) {
							// load 4 rows
							v128_t row1 = wasm_v128_load(colourRow);
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							v128_t row4 = wasm_v128_load(colourRow + cgw3);

							// create the maximum of each row pair
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							row1 = wasm_u8x16_max(row1, row3);

							// create the maximum of each column pair
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));

							// create the maximum of each pair of column pairs
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle2));

							// write to the small grid
							wasm_v128_store(smallRow, row1);

							// next 4 rows
							colourRow += cgw4;
							smallRow += cgw4;
						}
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 8x8 colour grid
void create8x8ColourGrid(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileY,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// swizzles for column pairs
	const v128_t swizzle4 = wasm_u8x16_make(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3);
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;
	const uint32_t cgw5 = cgw4 + colourGridWidth;
	const uint32_t cgw6 = cgw5 + colourGridWidth;
	const uint32_t cgw7 = cgw6 + colourGridWidth;
	const uint32_t cgw8 = cgw7 + colourGridWidth;

	// find each occupied tile
	uint32_t tileRowOffset = 0;
	uint32_t bottomY = 0, topY = tileY;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						for (uint32_t h = bottomY; h < topY; h += 8) {
							// load 8 rows
							v128_t row1 = wasm_v128_load(colourRow);
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							v128_t row4 = wasm_v128_load(colourRow + cgw3);
							v128_t row5 = wasm_v128_load(colourRow + cgw4);
							v128_t row6 = wasm_v128_load(colourRow + cgw5);
							v128_t row7 = wasm_v128_load(colourRow + cgw6);
							v128_t row8 = wasm_v128_load(colourRow + cgw7);

							// create the maximum of the rows
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							row5 = wasm_u8x16_max(row5, row6);
							row7 = wasm_u8x16_max(row7, row8);
							row1 = wasm_u8x16_max(row1, row3);
							row5 = wasm_u8x16_max(row5, row7);
							row1 = wasm_u8x16_max(row1, row5);

							// create the maximum of each column pair
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));

							// create the maximum of each group of 2
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle2));

							// create the maximum of each group of 4
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle4));

							// write to the small grid
							wasm_v128_store(smallRow, row1);

							colourRow += cgw8;
							smallRow += cgw8;
						}
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


// create 16x16 colour grid
void create16x16ColourGrid(
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// swizzles for column pairs
	const v128_t swizzle8 = wasm_u8x16_make(8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7);
	const v128_t swizzle4 = wasm_u8x16_make(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3);
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;
	const uint32_t cgw5 = cgw4 + colourGridWidth;
	const uint32_t cgw6 = cgw5 + colourGridWidth;
	const uint32_t cgw7 = cgw6 + colourGridWidth;
	const uint32_t cgw8 = cgw7 + colourGridWidth;

	// find each occupied tile
	uint32_t tileRowOffset = 0;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						// load first 8 rows
						v128_t row1 = wasm_v128_load(colourRow);
						v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
						v128_t row3 = wasm_v128_load(colourRow + cgw2);
						v128_t row4 = wasm_v128_load(colourRow + cgw3);
						v128_t row5 = wasm_v128_load(colourRow + cgw4);
						v128_t row6 = wasm_v128_load(colourRow + cgw5);
						v128_t row7 = wasm_v128_load(colourRow + cgw6);
						v128_t row8 = wasm_v128_load(colourRow + cgw7);

						// create the maximum of the rows
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);
						row1 = wasm_u8x16_max(row1, row3);
						row5 = wasm_u8x16_max(row5, row7);
						v128_t result1 = wasm_u8x16_max(row1, row5);

						// load next 8 rows
						colourRow += cgw8;
						row1 = wasm_v128_load(colourRow);
						row2 = wasm_v128_load(colourRow + colourGridWidth);
						row3 = wasm_v128_load(colourRow + cgw2);
						row4 = wasm_v128_load(colourRow + cgw3);
						row5 = wasm_v128_load(colourRow + cgw4);
						row6 = wasm_v128_load(colourRow + cgw5);
						row7 = wasm_v128_load(colourRow + cgw6);
						row8 = wasm_v128_load(colourRow + cgw7);

						// create the maximum of the rows
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);
						row1 = wasm_u8x16_max(row1, row3);
						row5 = wasm_u8x16_max(row5, row7);
						v128_t result2 = wasm_u8x16_max(row1, row5);

						// create the maximum of the two blocks of 8 rows
						v128_t result = wasm_u8x16_max(result1, result2);

						// create the maximum of each column pair
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle1));

						// create the maximum of each group of 2
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle2));

						// create the maximum of each group of 4
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle4));

						// create the maximum of each group of 8
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle8));

						// write to the small grid
						wasm_v128_store(smallRow, result);
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 32x32 colour grid
void create32x32ColourGrid(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileY,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;
	const uint32_t xSize1 = xSize << 1;

	// swizzles for column pairs
	const v128_t swizzle8 = wasm_u8x16_make(8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7);
	const v128_t swizzle4 = wasm_u8x16_make(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3);
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;

	// find each occupied set of 2x2 tiles
	uint32_t tileRowOffset = 0;
	uint32_t bottomY = 0, topY = tileY << 1;

	for (uint32_t th = 0; th < tileRows; th += 2) {
		uint32_t leftX = 0;
		uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get two sets of tiles
			uint16_t tiles = tileGrid[tw + tileRowOffset] | tileGrid[tw + tileRowOffset + tileGridWidth];

			if (tiles) {
				// check pairs of tiles
				for (int32_t b = (1 << 15 | 1 << 14); b > 0; b >>= 2) {
					if (tiles & b) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						uint32_t max = 0;

						// process the left two tiles
						for (uint32_t h = bottomY; h < topY; h += 4) {
							// load a row of the tile
							v128_t row1 = wasm_v128_load(colourRow);
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							v128_t row4 = wasm_v128_load(colourRow + cgw3);

							// get the maximum of the rows
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							v128_t v16x1 = wasm_u8x16_max(row1, row3);

							// perform pairwise maximum of 16 lanes to reduce to 8 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle8));

							// reduce to 4 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle4));

							// reduce to 2 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle2));

							// reduce to 1 lane (final result)
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle1));

							// extract the maximum value from the final reduced vector
							uint32_t rowMax = wasm_u8x16_extract_lane(v16x1, 0);
							if (rowMax > max) {
								max = rowMax;
							}

							colourRow += cgw4;
						}

						// process the right two tiles
						colourRow = colourGrid + cr + colourRowOffset + 4;
						for (uint32_t h = bottomY; h < topY; h += 4) {
							// load a row of the tile
							v128_t row1 = wasm_v128_load(colourRow);
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							v128_t row4 = wasm_v128_load(colourRow + cgw3);

							// get the maximum of the rows
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							v128_t v16x1 = wasm_u8x16_max(row1, row3);

							// perform pairwise maximum of 16 lanes to reduce to 8 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle8));

							// reduce to 4 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle4));

							// reduce to 2 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle2));

							// reduce to 1 lane (final result)
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle1));

							// extract the maximum value from the final reduced vector
							uint32_t rowMax = wasm_u8x16_extract_lane(v16x1, 0);
							if (rowMax > max) {
								max = rowMax;
							}

							colourRow += cgw4;
						}
						*smallRow = max;
					}
					leftX += xSize1;
				}
			} else {
				leftX += xSize4;
			}
		}

		bottomY += tileY << 1;
		topY += tileY << 1;
		tileRowOffset += tileGridWidth << 1;
	}
}


EMSCRIPTEN_KEEPALIVE
// create the 2x2 colour grid by finding the maximum pixel value in each 2x2 block
void create2x2ColourGridSuper(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// swizzle for column pairs
	const v128_t swizzle1 = wasm_u8x16_make(1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14);

	// mask for isolating LSB
	const v128_t lsbMask = wasm_u8x16_splat(1);

	// mark for removing shifted LSB
	const v128_t removeMask = wasm_u8x16_splat((1 << 5) - 1);

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;
	const uint32_t cgw5 = cgw4 + colourGridWidth;
	const uint32_t cgw6 = cgw5 + colourGridWidth;
	const uint32_t cgw7 = cgw6 + colourGridWidth;
	const uint32_t cgw8 = cgw7 + colourGridWidth;

	// find each occupied tile
	uint32_t tileRowOffset = 0;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						const uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						// load rows 1 to 8
						v128_t row1 = wasm_v128_load(colourRow);
						row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
						v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
						row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
						v128_t row3 = wasm_v128_load(colourRow + cgw2);
						row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
						v128_t row4 = wasm_v128_load(colourRow + cgw3);
						row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));
						v128_t row5 = wasm_v128_load(colourRow + cgw4);
						row5 = wasm_v128_or(row5, wasm_i8x16_shl(wasm_v128_and(row5, lsbMask), 5));
						v128_t row6 = wasm_v128_load(colourRow + cgw5);
						row6 = wasm_v128_or(row6, wasm_i8x16_shl(wasm_v128_and(row6, lsbMask), 5));
						v128_t row7 = wasm_v128_load(colourRow + cgw6);
						row7 = wasm_v128_or(row7, wasm_i8x16_shl(wasm_v128_and(row7, lsbMask), 5));
						v128_t row8 = wasm_v128_load(colourRow + cgw7);
						row8 = wasm_v128_or(row8, wasm_i8x16_shl(wasm_v128_and(row8, lsbMask), 5));

						// create the maximum of each row pair
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);

						// create the maximum of each coloumn pair
						row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));
						row3 = wasm_u8x16_max(row3, wasm_i8x16_swizzle(row3, swizzle1));
						row5 = wasm_u8x16_max(row5, wasm_i8x16_swizzle(row5, swizzle1));
						row7 = wasm_u8x16_max(row7, wasm_i8x16_swizzle(row7, swizzle1));

						// write to the small grid
						wasm_v128_store(smallRow, wasm_v128_and(row1, removeMask));
						wasm_v128_store(smallRow + cgw2, wasm_v128_and(row3, removeMask));
						wasm_v128_store(smallRow + cgw4, wasm_v128_and(row5, removeMask));
						wasm_v128_store(smallRow + cgw6, wasm_v128_and(row7, removeMask));

						// go to next 8 rows
						colourRow += cgw8;
						smallRow += cgw8;

						// load rows 9 to 16
						row1 = wasm_v128_load(colourRow);
						row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
						row2 = wasm_v128_load(colourRow + colourGridWidth);
						row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
						row3 = wasm_v128_load(colourRow + cgw2);
						row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
						row4 = wasm_v128_load(colourRow + cgw3);
						row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));
						row5 = wasm_v128_load(colourRow + cgw4);
						row5 = wasm_v128_or(row5, wasm_i8x16_shl(wasm_v128_and(row5, lsbMask), 5));
						row6 = wasm_v128_load(colourRow + cgw5);
						row6 = wasm_v128_or(row6, wasm_i8x16_shl(wasm_v128_and(row6, lsbMask), 5));
						row7 = wasm_v128_load(colourRow + cgw6);
						row7 = wasm_v128_or(row7, wasm_i8x16_shl(wasm_v128_and(row7, lsbMask), 5));
						row8 = wasm_v128_load(colourRow + cgw7);
						row8 = wasm_v128_or(row8, wasm_i8x16_shl(wasm_v128_and(row8, lsbMask), 5));

						// create the maximum of each row pair
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);

						// create the maximum of each coloumn pair
						row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));
						row3 = wasm_u8x16_max(row3, wasm_i8x16_swizzle(row3, swizzle1));
						row5 = wasm_u8x16_max(row5, wasm_i8x16_swizzle(row5, swizzle1));
						row7 = wasm_u8x16_max(row7, wasm_i8x16_swizzle(row7, swizzle1));

						// write to the small grid
						wasm_v128_store(smallRow, wasm_v128_and(row1, removeMask));
						wasm_v128_store(smallRow + cgw2, wasm_v128_and(row3, removeMask));
						wasm_v128_store(smallRow + cgw4, wasm_v128_and(row5, removeMask));
						wasm_v128_store(smallRow + cgw6, wasm_v128_and(row7, removeMask));
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 4x4 colour grid
void create4x4ColourGridSuper(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileY,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const int32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// grid width multiples
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;

	// swizzles for column pairs
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// mask for isolating LSB
	const v128_t lsbMask = wasm_u8x16_splat(1);

	// mark for removing shifted LSB
	const v128_t removeMask = wasm_u8x16_splat((1 << 5) - 1);

	// find each occupied tile
	uint32_t tileRowOffset = 0;
	uint32_t bottomY = 0, topY = tileY;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						for (uint32_t h = bottomY; h < topY; h += 4) {
							// load 4 rows
							v128_t row1 = wasm_v128_load(colourRow);
							row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
							v128_t row4 = wasm_v128_load(colourRow + cgw3);
							row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));

							// create the maximum of each row pair
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							row1 = wasm_u8x16_max(row1, row3);

							// create the maximum of each column pair
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));

							// create the maximum of each pair of column pairs
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle2));

							// write to the small grid
							wasm_v128_store(smallRow, wasm_v128_and(row1, removeMask));

							// next 4 rows
							colourRow += cgw4;
							smallRow += cgw4;
						}
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 8x8 colour grid
void create8x8ColourGridSuper(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileY,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// swizzles for column pairs
	const v128_t swizzle4 = wasm_u8x16_make(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3);
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// mask for isolating LSB
	const v128_t lsbMask = wasm_u8x16_splat(1);

	// mark for removing shifted LSB
	const v128_t removeMask = wasm_u8x16_splat((1 << 5) - 1);

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;
	const uint32_t cgw5 = cgw4 + colourGridWidth;
	const uint32_t cgw6 = cgw5 + colourGridWidth;
	const uint32_t cgw7 = cgw6 + colourGridWidth;
	const uint32_t cgw8 = cgw7 + colourGridWidth;

	// find each occupied tile
	uint32_t tileRowOffset = 0;
	uint32_t bottomY = 0, topY = tileY;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						for (uint32_t h = bottomY; h < topY; h += 8) {
							// load 8 rows
							v128_t row1 = wasm_v128_load(colourRow);
							row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
							v128_t row4 = wasm_v128_load(colourRow + cgw3);
							row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));
							v128_t row5 = wasm_v128_load(colourRow + cgw4);
							row5 = wasm_v128_or(row5, wasm_i8x16_shl(wasm_v128_and(row5, lsbMask), 5));
							v128_t row6 = wasm_v128_load(colourRow + cgw5);
							row6 = wasm_v128_or(row6, wasm_i8x16_shl(wasm_v128_and(row6, lsbMask), 5));
							v128_t row7 = wasm_v128_load(colourRow + cgw6);
							row7 = wasm_v128_or(row7, wasm_i8x16_shl(wasm_v128_and(row7, lsbMask), 5));
							v128_t row8 = wasm_v128_load(colourRow + cgw7);
							row8 = wasm_v128_or(row8, wasm_i8x16_shl(wasm_v128_and(row8, lsbMask), 5));

							// create the maximum of the rows
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							row5 = wasm_u8x16_max(row5, row6);
							row7 = wasm_u8x16_max(row7, row8);
							row1 = wasm_u8x16_max(row1, row3);
							row5 = wasm_u8x16_max(row5, row7);
							row1 = wasm_u8x16_max(row1, row5);

							// create the maximum of each column pair
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle1));

							// create the maximum of each group of 2
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle2));

							// create the maximum of each group of 4
							row1 = wasm_u8x16_max(row1, wasm_i8x16_swizzle(row1, swizzle4));

							// write to the small grid
							wasm_v128_store(smallRow, wasm_v128_and(row1, removeMask));

							colourRow += cgw8;
							smallRow += cgw8;
						}
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


// create 16x16 colour grid
void create16x16ColourGridSuper(
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;

	// swizzles for column pairs
	const v128_t swizzle8 = wasm_u8x16_make(8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7);
	const v128_t swizzle4 = wasm_u8x16_make(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3);
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// mask for isolating LSB
	const v128_t lsbMask = wasm_u8x16_splat(1);

	// mark for removing shifted LSB
	const v128_t removeMask = wasm_u8x16_splat((1 << 5) - 1);

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;
	const uint32_t cgw5 = cgw4 + colourGridWidth;
	const uint32_t cgw6 = cgw5 + colourGridWidth;
	const uint32_t cgw7 = cgw6 + colourGridWidth;
	const uint32_t cgw8 = cgw7 + colourGridWidth;

	// find each occupied tile
	uint32_t tileRowOffset = 0;

	for (uint32_t th = 0; th < tileRows; th++) {
		uint32_t leftX = 0;
		const uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			uint16_t tiles = tileGrid[tw + tileRowOffset];

			if (tiles) {
				for (int32_t b = 15; b >= 0; b--) {
					if (tiles & (1 << b)) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						// load first 8 rows
						v128_t row1 = wasm_v128_load(colourRow);
						row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
						v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
						row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
						v128_t row3 = wasm_v128_load(colourRow + cgw2);
						row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
						v128_t row4 = wasm_v128_load(colourRow + cgw3);
						row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));
						v128_t row5 = wasm_v128_load(colourRow + cgw4);
						row5 = wasm_v128_or(row5, wasm_i8x16_shl(wasm_v128_and(row5, lsbMask), 5));
						v128_t row6 = wasm_v128_load(colourRow + cgw5);
						row6 = wasm_v128_or(row6, wasm_i8x16_shl(wasm_v128_and(row6, lsbMask), 5));
						v128_t row7 = wasm_v128_load(colourRow + cgw6);
						row7 = wasm_v128_or(row7, wasm_i8x16_shl(wasm_v128_and(row7, lsbMask), 5));
						v128_t row8 = wasm_v128_load(colourRow + cgw7);
						row8 = wasm_v128_or(row8, wasm_i8x16_shl(wasm_v128_and(row8, lsbMask), 5));

						// create the maximum of the rows
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);
						row1 = wasm_u8x16_max(row1, row3);
						row5 = wasm_u8x16_max(row5, row7);
						v128_t result1 = wasm_u8x16_max(row1, row5);

						// load next 8 rows
						colourRow += cgw8;
						row1 = wasm_v128_load(colourRow);
						row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
						row2 = wasm_v128_load(colourRow + colourGridWidth);
						row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
						row3 = wasm_v128_load(colourRow + cgw2);
						row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
						row4 = wasm_v128_load(colourRow + cgw3);
						row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));
						row5 = wasm_v128_load(colourRow + cgw4);
						row5 = wasm_v128_or(row5, wasm_i8x16_shl(wasm_v128_and(row5, lsbMask), 5));
						row6 = wasm_v128_load(colourRow + cgw5);
						row6 = wasm_v128_or(row6, wasm_i8x16_shl(wasm_v128_and(row6, lsbMask), 5));
						row7 = wasm_v128_load(colourRow + cgw6);
						row7 = wasm_v128_or(row7, wasm_i8x16_shl(wasm_v128_and(row7, lsbMask), 5));
						row8 = wasm_v128_load(colourRow + cgw7);
						row8 = wasm_v128_or(row8, wasm_i8x16_shl(wasm_v128_and(row8, lsbMask), 5));

						// create the maximum of the rows
						row1 = wasm_u8x16_max(row1, row2);
						row3 = wasm_u8x16_max(row3, row4);
						row5 = wasm_u8x16_max(row5, row6);
						row7 = wasm_u8x16_max(row7, row8);
						row1 = wasm_u8x16_max(row1, row3);
						row5 = wasm_u8x16_max(row5, row7);
						v128_t result2 = wasm_u8x16_max(row1, row5);

						// create the maximum of the two blocks of 8 rows
						v128_t result = wasm_u8x16_max(result1, result2);

						// create the maximum of each column pair
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle1));

						// create the maximum of each group of 2
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle2));

						// create the maximum of each group of 4
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle4));

						// create the maximum of each group of 8
						result = wasm_u8x16_max(result, wasm_i8x16_swizzle(result, swizzle8));

						// write to the small grid
						wasm_v128_store(smallRow, wasm_v128_and(result, removeMask));
					}
					leftX += xSize;
				}
			} else {
				leftX += xSize4;
			}
		}

		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 32x32 colour grid
void create32x32ColourGridSuper(
	uint32_t *const colourGrid,
	uint32_t *const smallColourGrid,
	uint16_t *const tileGrid,
	const uint32_t tileY,
	const uint32_t tileX,
	const uint32_t tileRows,
	const uint32_t tileCols,
	const uint32_t colourGridWidth
) {
	const uint32_t xSize = tileX >> 1;
	const uint32_t tileCols16 = tileCols >> 4;
	const uint32_t tileGridWidth = colourGridWidth >> 6;
	const uint32_t xSize4 = xSize << 4;
	const uint32_t xSize1 = xSize << 1;

	// swizzles for column pairs
	const v128_t swizzle8 = wasm_u8x16_make(8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7);
	const v128_t swizzle4 = wasm_u8x16_make(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3);
	const v128_t swizzle2 = wasm_u8x16_make(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1);
	const v128_t swizzle1 = wasm_u8x16_make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);

	// mask for isolating LSB
	const v128_t lsbMask = wasm_u8x16_splat(1);

	// mark for removing shifted LSB
	const uint32_t removeMask = (1 << 5) - 1;

	// row offsets
	const uint32_t cgw2 = colourGridWidth + colourGridWidth;
	const uint32_t cgw3 = cgw2 + colourGridWidth;
	const uint32_t cgw4 = cgw3 + colourGridWidth;

	// find each occupied set of 2x2 tiles
	uint32_t tileRowOffset = 0;
	uint32_t bottomY = 0, topY = tileY << 1;

	for (uint32_t th = 0; th < tileRows; th += 2) {
		uint32_t leftX = 0;
		uint32_t colourRowOffset = (th << 4) * colourGridWidth;

		for (uint32_t tw = 0; tw < tileCols16; tw++) {
			// get two sets of tiles
			uint16_t tiles = tileGrid[tw + tileRowOffset] | tileGrid[tw + tileRowOffset + tileGridWidth];

			if (tiles) {
				// check pairs of tiles
				for (int32_t b = (1 << 15 | 1 << 14); b > 0; b >>= 2) {
					if (tiles & b) {
						uint32_t cr = leftX << 2;
						uint32_t *colourRow = colourGrid + cr + colourRowOffset;
						uint32_t *smallRow = smallColourGrid + cr + colourRowOffset;

						uint32_t max = 0;

						// process the left two tiles
						for (uint32_t h = bottomY; h < topY; h += 4) {
							// load a row of the tile
							v128_t row1 = wasm_v128_load(colourRow);
							row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
							v128_t row4 = wasm_v128_load(colourRow + cgw3);
							row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));

							// get the maximum of the rows
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							v128_t v16x1 = wasm_u8x16_max(row1, row3);

							// perform pairwise maximum of 16 lanes to reduce to 8 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle8));

							// reduce to 4 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle4));

							// reduce to 2 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle2));

							// reduce to 1 lane (final result)
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle1));

							// extract the maximum value from the final reduced vector
							uint32_t rowMax = wasm_u8x16_extract_lane(v16x1, 0);
							if (rowMax > max) {
								max = rowMax;
							}

							colourRow += cgw4;
						}

						// process the right two tiles
						colourRow = colourGrid + cr + colourRowOffset + 4;
						for (uint32_t h = bottomY; h < topY; h += 4) {
							// load a row of the tile
							v128_t row1 = wasm_v128_load(colourRow);
							row1 = wasm_v128_or(row1, wasm_i8x16_shl(wasm_v128_and(row1, lsbMask), 5));
							v128_t row2 = wasm_v128_load(colourRow + colourGridWidth);
							row2 = wasm_v128_or(row2, wasm_i8x16_shl(wasm_v128_and(row2, lsbMask), 5));
							v128_t row3 = wasm_v128_load(colourRow + cgw2);
							row3 = wasm_v128_or(row3, wasm_i8x16_shl(wasm_v128_and(row3, lsbMask), 5));
							v128_t row4 = wasm_v128_load(colourRow + cgw3);
							row4 = wasm_v128_or(row4, wasm_i8x16_shl(wasm_v128_and(row4, lsbMask), 5));

							// get the maximum of the rows
							row1 = wasm_u8x16_max(row1, row2);
							row3 = wasm_u8x16_max(row3, row4);
							v128_t v16x1 = wasm_u8x16_max(row1, row3);

							// perform pairwise maximum of 16 lanes to reduce to 8 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle8));

							// reduce to 4 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle4));

							// reduce to 2 lanes
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle2));

							// reduce to 1 lane (final result)
							v16x1 = wasm_u8x16_max(v16x1, wasm_i8x16_swizzle(v16x1, swizzle1));

							// extract the maximum value from the final reduced vector
							uint32_t rowMax = wasm_u8x16_extract_lane(v16x1, 0);
							if (rowMax > max) {
								max = rowMax;
							}

							colourRow += cgw4;
						}
						*smallRow = max & removeMask;
					}
					leftX += xSize1;
				}
			} else {
				leftX += xSize4;
			}
		}

		bottomY += tileY << 1;
		topY += tileY << 1;
		tileRowOffset += tileGridWidth << 1;
	}
}


EMSCRIPTEN_KEEPALIVE
// render the grid with no clipping or rotation (single layer)
void renderGridNoClipNoRotate(
	uint8_t *const grid,
	const uint32_t mask,
	const uint32_t *const pixelColours,
	uint32_t *data32,
	const uint32_t displayWidth,
	const uint32_t displayHeight,
	const double camXOff,
	const double camYOff,
	const uint32_t widthMask,
	const uint32_t heightMask,
	const uint32_t gridWidth,
	const double camZoom,
	const double yFactor,
	uint16_t *const xOffsets
) {
	const uint32_t w8 = displayWidth >> 3;	// display width in 8 pixel chunks
	const double dyy = (1.0f / camZoom) / yFactor;
	const double dyx = 1.0f / camZoom;

	double sy = -((double)displayHeight / 2) * dyy + camYOff;
	const double sx = -((double)displayWidth / 2) * dyx + camXOff;

	const uint32_t wm = widthMask & ~mask;
	const uint32_t hm = heightMask & ~mask;

	// precompute offsets
	for (uint32_t i = 0; i < displayWidth; i++) {
		xOffsets[i] = ((uint16_t)(sx + i * dyx)) & wm;
	}

	// process each row
	for (uint32_t h = 0; h < displayHeight; h++) {
		uint8_t *gridRow = grid + ((uint32_t)sy & hm) * gridWidth;

		// process each 8 pixel chunk on the row
		for (uint32_t w = 0; w < w8; w++) {
			// load 8 pixel indices
			const v128_t indices = wasm_v128_load(xOffsets + (w << 3));

			// gather pixel data
			const uint32_t i0 = wasm_u16x8_extract_lane(indices, 0);
			const uint32_t i1 = wasm_u16x8_extract_lane(indices, 1);
			const uint32_t i2 = wasm_u16x8_extract_lane(indices, 2);
			const uint32_t i3 = wasm_u16x8_extract_lane(indices, 3);
			const uint32_t i4 = wasm_u16x8_extract_lane(indices, 4);
			const uint32_t i5 = wasm_u16x8_extract_lane(indices, 5);
			const uint32_t i6 = wasm_u16x8_extract_lane(indices, 6);
			const uint32_t i7 = wasm_u16x8_extract_lane(indices, 7);

			const v128_t pixels = wasm_i16x8_make(
				*(gridRow + i0),
				*(gridRow + i1),
				*(gridRow + i2),
				*(gridRow + i3),
				*(gridRow + i4),
				*(gridRow + i5),
				*(gridRow + i6),
				*(gridRow + i7)
			);

			// map pixel values to RGBA colors
			const v128_t colors1 = wasm_i32x4_make(
				pixelColours[wasm_i16x8_extract_lane(pixels, 0)],
				pixelColours[wasm_i16x8_extract_lane(pixels, 1)],
				pixelColours[wasm_i16x8_extract_lane(pixels, 2)],
				pixelColours[wasm_i16x8_extract_lane(pixels, 3)]
			);

			const v128_t colors2 = wasm_i32x4_make(
				pixelColours[wasm_i16x8_extract_lane(pixels, 4)],
				pixelColours[wasm_i16x8_extract_lane(pixels, 5)],
				pixelColours[wasm_i16x8_extract_lane(pixels, 6)],
				pixelColours[wasm_i16x8_extract_lane(pixels, 7)]
			);

			// write 8 RGBA pixels to display buffer
			wasm_v128_store(data32, colors1);
			wasm_v128_store(data32 + 4, colors2);

			// move to the next chunk
			data32 += 8;
		}

		// next row
		sy += dyy;
	}
}


EMSCRIPTEN_KEEPALIVE
// render the grid with clipping but no rotation (single layer)
void renderGridClipNoRotate(
	uint8_t *const grid,
	const uint32_t mask,
	const uint32_t *const pixelColours,
	uint32_t *data32,
	const uint32_t displayWidth,
	const uint32_t displayHeight,
	const double camXOff,
	const double camYOff,
	const uint32_t widthMask,
	const uint32_t heightMask,
	const uint32_t gridWidth,
	const double camZoom,
	const double yFactor,
	const uint32_t maxGridSize,
	uint32_t xg,
	uint32_t yg,
	const uint32_t offMaxGrid,
	int32_t *const xOffsets,
	int32_t *const xMaxOffsets
) {
	const uint32_t w8 = displayWidth >> 3;	// display width in 8 pixel chunks
	const double dyy = (1.0f / camZoom) / yFactor;
	const double dyx = 1.0f / camZoom;

	double sy = -((double)displayHeight / 2) * dyy + camYOff;
	const double sx = -((double)displayWidth / 2) * dyx + camXOff;

	// width and height masks
	const uint32_t wm = widthMask & ~mask;
	const uint32_t hm = heightMask & ~mask;

	// comparison masks for clipping
	const uint32_t wt = ~mask;
	const uint32_t ht = ~mask;

	// compute the x and y adjustments for full grid size
	uint32_t xadj = 0;
	while (xg < maxGridSize) {
		xadj += xg >> 1;
		xg <<= 1;
	}

	uint32_t yadj = 0;
	while (yg < maxGridSize) {
		yadj += yg >> 1;
		yg <<= 1;
	}

	// pixel index for off grid
	const uint32_t offGridValue = -2;

	// pixel index for off max grid (this one must be -1 since it's used as a vector mask)
	const uint32_t offMaxGridValue = -1;

	// precompute offsets
	double x = sx;
	for (uint32_t i = 0; i < displayWidth; i++) {
		int32_t xi = (int32_t)floor(x);
		if (x >= 0 && ((xi & wt) == (xi & wm))) {
			xOffsets[i] = xi & wm;
		} else {
			if (xi + xadj >= 0 && xi + xadj < maxGridSize) {
				xOffsets[i] = offGridValue;
			} else {
				xOffsets[i] = offMaxGridValue;
			}
		}
		x += dyx;
	}

	x = sx;
	for (uint32_t i = 0; i < displayWidth; i++) {
		int32_t xi = (int32_t)floor(x);
		if (xi + xadj >= 0 && xi + xadj < maxGridSize) {
			xMaxOffsets[i] = 0;
		} else {
			xMaxOffsets[i] = offMaxGridValue;
		}
		x += dyx;
	}

	// off max grid pixel colour
	const v128_t offMaxGridChunk = wasm_u32x4_splat(offMaxGrid);

	// off grid pixel colour
	const v128_t offGridChunk = wasm_u32x4_splat(pixelColours[0]);

	// constants
	const v128_t zero = wasm_u32x4_splat(0);
	const v128_t offGridVec = wasm_i32x4_splat(offGridValue);
	const v128_t offMaxGridVec = wasm_i32x4_splat(offMaxGridValue);

	// process each row
	for (uint32_t h = 0; h < displayHeight; h++) {
		// get the next grid row
		int32_t yi = (int32_t)floor(sy);

		// check the row is on the grid
		if (yi >= 0 && ((yi & ht) == (yi & hm))) {
			uint8_t *gridRow = grid + (yi & hm) * gridWidth;

			for (uint32_t w = 0; w < w8; w++) {
				// load 8 pixel indices
				v128_t indices1 = wasm_v128_load(xOffsets + (w << 3));
				v128_t indices2 = wasm_v128_load(xOffsets + (w << 3) + 4);

				// get masks to show which pixels are on the grid
				const v128_t onGrid1 = wasm_i32x4_ge(indices1, zero); 
				const v128_t onGrid2 = wasm_i32x4_ge(indices2, zero);

				// get masks to show which pixels are off the normal grid
				const v128_t offGrid1 = wasm_i32x4_eq(indices1, offGridVec);
				const v128_t offGrid2 = wasm_i32x4_eq(indices2, offGridVec);

				// get masks to show which pixels are off the max grid
				const v128_t offMaxGrid1 = wasm_i32x4_eq(indices1, offMaxGridVec);
				const v128_t offMaxGrid2 = wasm_i32x4_eq(indices2, offMaxGridVec);

				// make the indices safe by setting any negative values to 0
				indices1 = wasm_v128_bitselect(indices1, zero, onGrid1);
				indices2 = wasm_v128_bitselect(indices2, zero, onGrid2);

				// lookup the pixels from the colour grid using the indices
				v128_t pixels1 = wasm_u32x4_make(
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices1, 0))],
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices1, 1))],
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices1, 2))],
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices1, 3))]
				);

				v128_t pixels2 = wasm_u32x4_make(
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices2, 0))],
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices2, 1))],
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices2, 2))],
					pixelColours[*(gridRow + wasm_u32x4_extract_lane(indices2, 3))]
				);

				// replace off grid pixels
				pixels1 = wasm_v128_bitselect(offGridChunk, pixels1, offGrid1);
				pixels2 = wasm_v128_bitselect(offGridChunk, pixels2, offGrid2);

				// write 8 RGBA pixels to display buffer replacing off max grid
				wasm_v128_store(data32, wasm_v128_bitselect(offMaxGridChunk, pixels1, offMaxGrid1));
				wasm_v128_store(data32 + 4, wasm_v128_bitselect(offMaxGridChunk, pixels2, offMaxGrid2));

				// move to the next chunk
				data32 += 8;
			}
		} else {
			// check if this row is off the grid or the max grid
			if (yi + yadj >= 0 && yi + yadj < maxGridSize) {
				// off the grid so need to display both grid and max grid colours
				for (uint32_t w = 0; w < w8; w++) {
					// load 8 pixel indices indicating off grid or off max grid
					const v128_t indices1 = wasm_v128_load(xMaxOffsets + (w << 3));
					const v128_t indices2 = wasm_v128_load(xMaxOffsets + (w << 3) + 4);

					// use the indices to pick the correct pixel colours
					wasm_v128_store(data32, wasm_v128_bitselect(offMaxGridChunk, offGridChunk, indices1));
					wasm_v128_store(data32 + 4, wasm_v128_bitselect(offMaxGridChunk, offGridChunk, indices2));

					// next chunk
					data32 += 8;
				}
			} else {
				// off the max grid so fill the entire row with max grid colour
				for (uint32_t w = 0; w < w8; w++) {
					wasm_v128_store(data32, offMaxGridChunk);
					wasm_v128_store(data32 + 4, offMaxGridChunk);

					// next chunk
					data32 += 8;
				}
			}
		}

		// next row
		sy += dyy;
	}
}


EMSCRIPTEN_KEEPALIVE
// render the grid with no clipping or rotation (single layer)
void renderOverlayNoClipNoRotate(
	uint8_t *const grid,
	const uint32_t gridWidth,
	uint8_t *const overlayGrid,
	const uint32_t mask,
	const uint32_t *const pixelColours,
	uint32_t *data32,
	const uint32_t displayWidth,
	const uint32_t displayHeight,
	const double camXOff,
	const double camYOff,
	const uint32_t widthMask,
	const uint32_t heightMask,
	const double camZoom,
	const uint32_t state3,
	const uint32_t state4,
	const uint32_t state5,
	const uint32_t state6,
	const uint32_t aliveStart,
	uint16_t *const xOffsets
) {
	const uint32_t w8 = displayWidth >> 3;	// display width in 8 pixel chunks
	const double dyy = 1.0f / camZoom;
	const double dyx = 1.0f / camZoom;

	double sy = -((double)displayHeight / 2) * dyy + camYOff;
	const double sx = -((double)displayWidth / 2) * dyx + camXOff;

	const uint32_t wm = widthMask & ~mask;
	const uint32_t hm = heightMask & ~mask;

	const v128_t state3Vec = wasm_u16x8_splat(state3);
	const v128_t state4Vec = wasm_u16x8_splat(state4);
	const v128_t state5Vec = wasm_u16x8_splat(state5);
	const v128_t state6Vec = wasm_u16x8_splat(state6);
	const v128_t aliveVec = wasm_u16x8_splat(aliveStart);

	// precompute offsets
	for (uint32_t i = 0; i < displayWidth; i++) {
		xOffsets[i] = ((uint16_t)(sx + i * dyx)) & wm;
	}

	// process each row
	for (uint32_t h = 0; h < displayHeight; h++) {
		uint8_t *gridRow = grid + ((uint32_t)sy & hm) * gridWidth;
		uint8_t *overlayRow = overlayGrid + ((uint32_t)sy & hm) * gridWidth;

		// process each 8 pixel chunk on the row
		for (uint32_t w = 0; w < w8; w++) {
			// load 8 pixel indices
			const v128_t indices = wasm_v128_load(xOffsets + (w << 3));

			// gather pixel data
			const uint32_t i0 = wasm_u16x8_extract_lane(indices, 0);
			const uint32_t i1 = wasm_u16x8_extract_lane(indices, 1);
			const uint32_t i2 = wasm_u16x8_extract_lane(indices, 2);
			const uint32_t i3 = wasm_u16x8_extract_lane(indices, 3);
			const uint32_t i4 = wasm_u16x8_extract_lane(indices, 4);
			const uint32_t i5 = wasm_u16x8_extract_lane(indices, 5);
			const uint32_t i6 = wasm_u16x8_extract_lane(indices, 6);
			const uint32_t i7 = wasm_u16x8_extract_lane(indices, 7);

			v128_t pixels = wasm_u16x8_make(
				*(gridRow + i0),
				*(gridRow + i1),
				*(gridRow + i2),
				*(gridRow + i3),
				*(gridRow + i4),
				*(gridRow + i5),
				*(gridRow + i6),
				*(gridRow + i7)
			);

			v128_t overlayPixels = wasm_u16x8_make(
				*(overlayRow + i0),
				*(overlayRow + i1),
				*(overlayRow + i2),
				*(overlayRow + i3),
				*(overlayRow + i4),
				*(overlayRow + i5),
				*(overlayRow + i6),
				*(overlayRow + i7)
			);

			// process overlay
			const v128_t isState4or6 = wasm_v128_or(
				wasm_i16x8_eq(overlayPixels, state4Vec),
				wasm_i16x8_eq(overlayPixels, state6Vec)
			);

			const v128_t isState3or5 = wasm_v128_or(
				wasm_i16x8_eq(overlayPixels, state3Vec),
				wasm_i16x8_eq(overlayPixels, state5Vec)
			);

			const v128_t cellsAlive = wasm_i16x8_ge(pixels, aliveVec);

			const v128_t changeTo3 = wasm_v128_and(isState4or6, cellsAlive);
			const v128_t changeTo4 = wasm_v128_andnot(isState3or5, cellsAlive);

			overlayPixels = wasm_v128_bitselect(state3Vec, overlayPixels, changeTo3);
			overlayPixels = wasm_v128_bitselect(state4Vec, overlayPixels, changeTo4);

			pixels = wasm_v128_bitselect(overlayPixels, pixels, wasm_v128_or(isState4or6, isState3or5));

			// map pixel values to RGBA colors
			const v128_t colors1 = wasm_u32x4_make(
				pixelColours[wasm_u16x8_extract_lane(pixels, 0)],
				pixelColours[wasm_u16x8_extract_lane(pixels, 1)],
				pixelColours[wasm_u16x8_extract_lane(pixels, 2)],
				pixelColours[wasm_u16x8_extract_lane(pixels, 3)]
			);

			const v128_t colors2 = wasm_u32x4_make(
				pixelColours[wasm_u16x8_extract_lane(pixels, 4)],
				pixelColours[wasm_u16x8_extract_lane(pixels, 5)],
				pixelColours[wasm_u16x8_extract_lane(pixels, 6)],
				pixelColours[wasm_u16x8_extract_lane(pixels, 7)]
			);

			// write 8 RGBA pixels to display buffer
			wasm_v128_store(data32, colors1);
			wasm_v128_store(data32 + 4, colors2);

			// move to the next chunk
			data32 += 8;
		}

		// next row
		sy += dyy;
	}
}


EMSCRIPTEN_KEEPALIVE
// render the grid with clipping but no rotation (single layer)
void renderOverlayClipNoRotate(
	uint8_t *const grid,
	const uint32_t gridWidth,
	uint8_t *const overlayGrid,
	const uint32_t mask,
	const uint32_t *const pixelColours,
	uint32_t *data32,
	const uint32_t displayWidth,
	const uint32_t displayHeight,
	const double camXOff,
	const double camYOff,
	const uint32_t widthMask,
	const uint32_t heightMask,
	const double camZoom,
	const uint32_t state3,
	const uint32_t state4,
	const uint32_t state5,
	const uint32_t state6,
	const uint32_t aliveStart,
	const uint32_t maxGridSize,
	uint32_t xg,
	uint32_t yg,
	const uint32_t offMaxGrid,
	int32_t *const xOffsets,
	int32_t *const xMaxOffsets
) {
	const uint32_t w8 = displayWidth >> 3;	// display width in 8 pixel chunks
	const double dyy = 1.0f / camZoom;
	const double dyx = 1.0f / camZoom;

	double sy = -((double)displayHeight / 2) * dyy + camYOff;
	const double sx = -((double)displayWidth / 2) * dyx + camXOff;

	// width and height masks
	const uint32_t wm = widthMask & ~mask;
	const uint32_t hm = heightMask & ~mask;

	// comparison masks for clipping
	const uint32_t wt = ~mask;
	const uint32_t ht = ~mask;

	// compute the x and y adjustments for full grid size
	uint32_t xadj = 0;
	while (xg < maxGridSize) {
		xadj += xg >> 1;
		xg <<= 1;
	}

	uint32_t yadj = 0;
	while (yg < maxGridSize) {
		yadj += yg >> 1;
		yg <<= 1;
	}

	// pixel index for off grid
	const uint32_t offGridValue = -2;

	// pixel index for off max grid (this one must be -1 since it's used as a vector mask)
	const uint32_t offMaxGridValue = -1;

	// precompute offsets
	double x = sx;
	for (uint32_t i = 0; i < displayWidth; i++) {
		int32_t xi = (int32_t)floor(x);
		if (x >= 0 && ((xi & wt) == (xi & wm))) {
			xOffsets[i] = xi & wm;
		} else {
			if (xi + xadj >= 0 && xi + xadj < maxGridSize) {
				xOffsets[i] = offGridValue;
			} else {
				xOffsets[i] = offMaxGridValue;
			}
		}
		x += dyx;
	}

	x = sx;
	for (uint32_t i = 0; i < displayWidth; i++) {
		int32_t xi = (int32_t)floor(x);
		if (xi + xadj >= 0 && xi + xadj < maxGridSize) {
			xMaxOffsets[i] = 0;
		} else {
			xMaxOffsets[i] = offMaxGridValue;
		}
		x += dyx;
	}

	// off max grid pixel colour
	const v128_t offMaxGridChunk = wasm_u32x4_splat(offMaxGrid);

	// off grid pixel colour
	const v128_t offGridChunk = wasm_u32x4_splat(pixelColours[0]);

	// constants
	const v128_t zero = wasm_u32x4_splat(0);
	const v128_t offGridVec = wasm_i32x4_splat(offGridValue);
	const v128_t offMaxGridVec = wasm_i32x4_splat(offMaxGridValue);

	const v128_t state3Vec = wasm_u16x8_splat(state3);
	const v128_t state4Vec = wasm_u16x8_splat(state4);
	const v128_t state5Vec = wasm_u16x8_splat(state5);
	const v128_t state6Vec = wasm_u16x8_splat(state6);
	const v128_t aliveVec = wasm_u16x8_splat(aliveStart);

	// process each row
	for (uint32_t h = 0; h < displayHeight; h++) {
		// get the next grid row
		int32_t yi = (int32_t)floor(sy);

		// check the row is on the grid
		if (yi >= 0 && ((yi & ht) == (yi & hm))) {
			uint8_t *gridRow = grid + (yi & hm) * gridWidth;
			uint8_t *overlayRow = overlayGrid + (yi & hm) * gridWidth;

			for (uint32_t w = 0; w < w8; w++) {
				// load 8 pixel indices
				v128_t indices1 = wasm_v128_load(xOffsets + (w << 3));
				v128_t indices2 = wasm_v128_load(xOffsets + (w << 3) + 4);

				// get masks to show which pixels are on the grid
				const v128_t onGrid1 = wasm_i32x4_ge(indices1, zero); 
				const v128_t onGrid2 = wasm_i32x4_ge(indices2, zero);

				// get masks to show which pixels are off the normal grid
				const v128_t offGrid1 = wasm_i32x4_eq(indices1, offGridVec);
				const v128_t offGrid2 = wasm_i32x4_eq(indices2, offGridVec);

				// get masks to show which pixels are off the max grid
				const v128_t offMaxGrid1 = wasm_i32x4_eq(indices1, offMaxGridVec);
				const v128_t offMaxGrid2 = wasm_i32x4_eq(indices2, offMaxGridVec);

				// make the indices safe by setting any negative values to 0
				indices1 = wasm_v128_bitselect(indices1, zero, onGrid1);
				indices2 = wasm_v128_bitselect(indices2, zero, onGrid2);

				// gather the pixel data
				const uint32_t i0 = wasm_u32x4_extract_lane(indices1, 0);
				const uint32_t i1 = wasm_u32x4_extract_lane(indices1, 1);
				const uint32_t i2 = wasm_u32x4_extract_lane(indices1, 2);
				const uint32_t i3 = wasm_u32x4_extract_lane(indices1, 3);

				const uint32_t i4 = wasm_u32x4_extract_lane(indices2, 0);
				const uint32_t i5 = wasm_u32x4_extract_lane(indices2, 1);
				const uint32_t i6 = wasm_u32x4_extract_lane(indices2, 2);
				const uint32_t i7 = wasm_u32x4_extract_lane(indices2, 3);

				// lookup the pixels
				v128_t pixels = wasm_u16x8_make(
					*(gridRow + i0),
					*(gridRow + i1),
					*(gridRow + i2),
					*(gridRow + i3),
					*(gridRow + i4),
					*(gridRow + i5),
					*(gridRow + i6),
					*(gridRow + i7)
				);

				// lookup the overlay pixels
				v128_t overlayPixels = wasm_u16x8_make(
					*(overlayRow + i0),
					*(overlayRow + i1),
					*(overlayRow + i2),
					*(overlayRow + i3),
					*(overlayRow + i4),
					*(overlayRow + i5),
					*(overlayRow + i6),
					*(overlayRow + i7)
				);

				// process overlay
				const v128_t isState4or6 = wasm_v128_or(
					wasm_i16x8_eq(overlayPixels, state4Vec),
					wasm_i16x8_eq(overlayPixels, state6Vec)
				);

				const v128_t isState3or5 = wasm_v128_or(
					wasm_i16x8_eq(overlayPixels, state3Vec),
					wasm_i16x8_eq(overlayPixels, state5Vec)
				);

				const v128_t cellsAlive = wasm_i16x8_ge(pixels, aliveVec);

				const v128_t changeTo3 = wasm_v128_and(isState4or6, cellsAlive);
				const v128_t changeTo4 = wasm_v128_andnot(isState3or5, cellsAlive);

				overlayPixels = wasm_v128_bitselect(state3Vec, overlayPixels, changeTo3);
				overlayPixels = wasm_v128_bitselect(state4Vec, overlayPixels, changeTo4);

				pixels = wasm_v128_bitselect(overlayPixels, pixels, wasm_v128_or(isState4or6, isState3or5));

				// lookup the pixels from the colour grid using the indices
				v128_t colours1 = wasm_u32x4_make(
					pixelColours[wasm_u16x8_extract_lane(pixels, 0)],
					pixelColours[wasm_u16x8_extract_lane(pixels, 1)],
					pixelColours[wasm_u16x8_extract_lane(pixels, 2)],
					pixelColours[wasm_u16x8_extract_lane(pixels, 3)]
				);

				v128_t colours2 = wasm_u32x4_make(
					pixelColours[wasm_u16x8_extract_lane(pixels, 4)],
					pixelColours[wasm_u16x8_extract_lane(pixels, 5)],
					pixelColours[wasm_u16x8_extract_lane(pixels, 6)],
					pixelColours[wasm_u16x8_extract_lane(pixels, 7)]
				);

				// replace off grid pixels
				colours1 = wasm_v128_bitselect(offGridChunk, colours1, offGrid1);
				colours2 = wasm_v128_bitselect(offGridChunk, colours2, offGrid2);

				// write 8 RGBA pixels to display buffer replacing off max grid
				wasm_v128_store(data32, wasm_v128_bitselect(offMaxGridChunk, colours1, offMaxGrid1));
				wasm_v128_store(data32 + 4, wasm_v128_bitselect(offMaxGridChunk, colours2, offMaxGrid2));

				// move to the next chunk
				data32 += 8;
			}
		} else {
			// check if this row is off the grid or the max grid
			if (yi + yadj >= 0 && yi + yadj < maxGridSize) {
				// off the grid so need to display both grid and max grid colours
				for (uint32_t w = 0; w < w8; w++) {
					// load 8 pixel indices indicating off grid or off max grid
					const v128_t indices1 = wasm_v128_load(xMaxOffsets + (w << 3));
					const v128_t indices2 = wasm_v128_load(xMaxOffsets + (w << 3) + 4);

					// use the indices to pick the correct pixel colours
					wasm_v128_store(data32, wasm_v128_bitselect(offMaxGridChunk, offGridChunk, indices1));
					wasm_v128_store(data32 + 4, wasm_v128_bitselect(offMaxGridChunk, offGridChunk, indices2));

					// next chunk
					data32 += 8;
				}
			} else {
				// off the max grid so fill the entire row with max grid colour
				for (uint32_t w = 0; w < w8; w++) {
					wasm_v128_store(data32, offMaxGridChunk);
					wasm_v128_store(data32 + 4, offMaxGridChunk);

					// next chunk
					data32 += 8;
				}
			}
		}

		// next row
		sy += dyy;
	}
}

