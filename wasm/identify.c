// LifeViewer WebAssembly functions
// Faster versions of LifeViewer functions implemented using WebAssembly SIMD Intrinstics
// See: https://emscripten.org/docs/porting/simd.html#webassembly-simd-intrinsics
//
// Identify
//	updateOccupancyStrict
//	updateCellCounts
//	updateCellCountsSuperOrRuleLoader
//	getHashTwoState
// 	getHashRuleLoaderOrPCAOrExtended
//	getHashGenerations
//	getHashLifeHistory
//	getHashSuper

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
// update cell occupancy for rotor and stator calculation
void updateOccupancyStrict(
	uint8_t *const colourGrid,
	uint16_t *const frames,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t generation,
	const int32_t bitRowInBytes,
	const int32_t bitFrameInBytes,
	int32_t bitStart,
	const int32_t aliveStart,
	const int32_t colourGridWidth
) {
	// alive cells
	const v128_t alive = wasm_u8x16_splat(aliveStart);

	// reverse byte order
	const v128_t reverse = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// get the frame for this generation
	uint32_t rowOffset = generation * bitFrameInBytes;

	// align row to 16 bytes
	const uint32_t align16Left = (left + 15) & ~15;
	const uint32_t align16Right = right & ~15;

	// compute the first target (either the start of a 16 byte run or if smaller the right)
	const uint32_t leftTarget = align16Left > right + 1 ? right + 1 : align16Left;

	const uint32_t leftDelta = leftTarget - left;

	for (uint32_t y = bottom; y <= top; y++) {
		// find the start of the row for this generation frame
		uint16_t *frameRow = frames + rowOffset;

		// process the left section
		uint32_t frameBits = 0;
		uint32_t x = left;
		int32_t bit = bitStart;

		// read the first cells on the row up to 16 byte alignment or right edge (whichever comes first)
		uint8_t *colourRow = colourGrid + y * colourGridWidth + x;

		while (x < leftTarget) {
			if (*colourRow >= aliveStart) {
				frameBits |= bit;
			}
			bit >>= 1;
			colourRow++;
			x++;
		}

		// do the rest of the row in 16 cell chunks
		while (x < align16Right) {
			// get the next 16 cells
			v128_t row = wasm_v128_load(colourRow);
			row = wasm_u8x16_ge(row, alive);
			row = wasm_i8x16_swizzle(row, reverse);
			const uint32_t mask = wasm_i8x16_bitmask(row);

			// merge the frame mask with the last one
			const uint32_t writeMask = frameBits | (mask >> leftDelta);
			*frameRow = writeMask;
			frameRow++;

			frameBits = mask << (16 - leftDelta);
			x += 16;
			colourRow += 16;
		}

		while (x <= right) {
			if (*colourRow >= aliveStart) {
				frameBits |= bit;
			}
			bit >>= 1;
			if (bit == 0) {
				bit = bitStart;
				*frameRow = frameBits;
				frameRow++;
				frameBits = 0;
			}
			colourRow++;
			x++;
		}

		if (bit != bitStart) {
			*frameRow = frameBits;
		}

		// next row
		rowOffset += bitRowInBytes;
	}
}


EMSCRIPTEN_KEEPALIVE
// update cell occupancy for rotor and stator calculation
void updateOccupancyStrictSuperOrRuleLoader(
	uint8_t *const colourGrid,
	uint16_t *const frames,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t generation,
	const int32_t bitRowInBytes,
	const int32_t bitFrameInBytes,
	int32_t bitStart,
	const int32_t colourGridWidth
) {
	// alive cells mask
	const v128_t oneVec = wasm_u8x16_splat(1);

	// reverse byte order
	const v128_t reverse = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// get the frame for this generation
	uint32_t rowOffset = generation * bitFrameInBytes;

	// align row to 16 bytes
	const uint32_t align16Left = (left + 15) & ~15;
	const uint32_t align16Right = right & ~15;

	// compute the first target (either the start of a 16 byte run or if smaller the right)
	const uint32_t leftTarget = align16Left > right + 1 ? right + 1 : align16Left;
	const uint32_t leftDelta = leftTarget - left;

	for (uint32_t y = bottom; y <= top; y++) {
		// find the start of the row for this generation frame
		uint16_t *frameRow = frames + rowOffset;

		// process the left section
		uint32_t frameBits = 0;
		uint32_t x = left;
		int32_t bit = bitStart;

		// read the first cells on the row up to 16 byte alignment or right edge (whichever comes first)
		uint8_t *colourRow = colourGrid + y * colourGridWidth + x;

		while (x < leftTarget) {
			if (*colourRow & 1) {
				frameBits |= bit;
			}
			bit >>= 1;
			colourRow++;
			x++;
		}

		// do the rest of the row in 16 cell chunks
		while (x < align16Right) {
			// get the next 16 cells
			v128_t row = wasm_v128_load(colourRow);
			row = wasm_v128_and(row, oneVec);
			row = wasm_i8x16_eq(row, oneVec);
			row = wasm_i8x16_swizzle(row, reverse);
			const uint32_t mask = wasm_i8x16_bitmask(row);

			// merge the frame mask with the last one
			const uint32_t writeMask = frameBits | (mask >> leftDelta);
			*frameRow = writeMask;
			frameRow++;

			frameBits = mask << (16 - leftDelta);
			x += 16;
			colourRow += 16;
		}

		while (x <= right) {
			if (*colourRow & 1) {
				frameBits |= bit;
			}
			bit >>= 1;
			if (bit == 0) {
				bit = bitStart;
				*frameRow = frameBits;
				frameRow++;
				frameBits = 0;
			}
			colourRow++;
			x++;
		}

		if (bit != bitStart) {
			*frameRow = frameBits;
		}

		// next row
		rowOffset += bitRowInBytes;
	}
}


EMSCRIPTEN_KEEPALIVE
// update the cell counts for strict volatility
void updateCellCounts(
	uint8_t *const colourGrid,
	uint32_t *counts,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t colourGridWidth,
	const int32_t aliveStart
) {
	// alive cells
	const v128_t alive = wasm_u8x16_splat(aliveStart);

	// align row to 16 bytes
	const uint32_t align16Left = (left + 15) & ~15;
	const uint32_t align16Right = right & ~15;

	// compute the first target (either the start of a 16 byte run or if smaller the right)
	const uint32_t leftTarget = align16Left > right + 1 ? right + 1 : align16Left;

	// process each row
	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t x = left;

		// read the first cells on the row up to 16 byte alignment or right edge (whichever comes first)
		uint8_t* colourRow = colourGrid + y * colourGridWidth + x;

		while (x < leftTarget) {
			if (*colourRow >= aliveStart) {
				*(counts) += 1;
			}
			colourRow++;
			counts++;
			x++;
		}

		// do the rest of the row in 16 cell chunks
		while (x < align16Right) {
			// get the next 16 cells
			v128_t row = wasm_v128_load(colourRow);
			row = wasm_u8x16_ge(row, alive);
			uint16_t mask = wasm_i8x16_bitmask(row);

			// increment counts for those that are alive
			while (mask) {
				uint32_t i = __builtin_ctz(mask);
				*(counts + i) += 1;
				mask &= (mask - 1);
			}

			// next chunk
			counts += 16;
			colourRow += 16;
			x += 16;
		}

		while (x <= right) {
			if (*colourRow >= aliveStart) {
				*(counts) += 1;
			}
			colourRow++;
			counts++;
			x++;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
// update the cell counts for strict volatility
void updateCellCountsSuperOrRuleTree(
	uint8_t *const colourGrid,
	uint32_t *counts,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t colourGridWidth
) {
	// alive cells mask
	const v128_t oneVec = wasm_u8x16_splat(1);

	// align row to 16 bytes
	const uint32_t align16Left = (left + 15) & ~15;
	const uint32_t align16Right = right & ~15;

	// compute the first target (either the start of a 16 byte run or if smaller the right)
	const uint32_t leftTarget = align16Left > right + 1 ? right + 1 : align16Left;

	// process each row
	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t x = left;

		// read the first cells on the row up to 16 byte alignment or right edge (whichever comes first)
		uint8_t* colourRow = colourGrid + y * colourGridWidth + x;

		while (x < leftTarget) {
			if (*colourRow & 1) {
				*(counts) += 1;
			}
			colourRow++;
			counts++;
			x++;
		}

		// do the rest of the row in 16 cell chunks
		while (x < align16Right) {
			// get the next 16 cells
			v128_t row = wasm_v128_load(colourRow);
			row = wasm_v128_and(row, oneVec);
			row = wasm_i8x16_eq(row, oneVec);
			uint16_t mask = wasm_i8x16_bitmask(row);

			// increment counts for those that are alive
			while (mask) {
				uint32_t i = __builtin_ctz(mask);
				*(counts + i) += 1;
				mask &= (mask - 1);
			}

			// next chunk
			counts += 16;
			colourRow += 16;
			x += 16;
		}

		while (x <= right) {
			if (*colourRow & 1) {
				*(counts) += 1;
			}
			colourRow++;
			counts++;
			x++;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
// create a hash from the colour grid for two state algo
uint32_t getHashTwoState(
	uint8_t *const colourGrid,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t colourGridWidth,
	const int32_t aliveStart
) {
	const uint32_t factor = 1000003;
	uint32_t hash = 31415962;

	// alive cells
	const v128_t alive = wasm_u8x16_splat(aliveStart);

	// align left to 16 bytes
	// we can read bytes to the left or right of the box since none of them will be alive so won't change the hash value
	const uint32_t align16Left = left & ~15;

	// get the starting offset in the colour grid
	uint8_t *colourRow = colourGrid + bottom * colourGridWidth + align16Left;

	// get offset to next row
	uint32_t rowOffset = colourGridWidth - ((((right - align16Left) >> 4) + 1) << 4);

	// process each row in the bounding box
	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t yshift = y - bottom;

		// process each 16 byte chunk in the row
		for (uint32_t x = align16Left; x <= right; x += 16) {
			// load 16 bytes
			v128_t row = wasm_v128_load(colourRow);

			// check if each cell is alive
			row = wasm_u8x16_ge(row, alive);

			// get the results as a bitmask
			uint16_t mask = wasm_i8x16_bitmask(row);

			// iterate over the alive bits in the mask
			const uint32_t xshift = x - left;

			while (mask) {
				uint32_t i = __builtin_ctz(mask);
				hash = (hash * factor) ^ yshift;
				hash = (hash * factor) ^ (xshift + i);
				mask &= (mask - 1);
			}

			// next chunk
			colourRow += 16;
		}

		// next row
		colourRow += rowOffset;
	}

	return hash;
}


EMSCRIPTEN_KEEPALIVE
// create a hash from the colour grid for Super algo
uint32_t getHashSuper(
	uint8_t *const colourGrid,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t colourGridWidth
) {
	const uint32_t factor = 1000003;
	uint32_t hash = 31415962;

	// alive cells
	const v128_t alive = wasm_u8x16_splat(1);

	// state 6 cells
	const v128_t state6 = wasm_u8x16_splat(6);

	// align left to 16 bytes
	// we can read bytes to the left or right of the box since none of them will be alive so won't change the hash value
	const uint32_t align16Left = left & ~15;

	// get the starting offset in the colour grid
	uint8_t *colourRow = colourGrid + bottom * colourGridWidth + align16Left;

	// get offset to next row
	uint32_t rowOffset = colourGridWidth - ((((right - align16Left) >> 4) + 1) << 4);

	// process each row in the bounding box
	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t yshift = y - bottom;

		// process each 16 byte chunk in the row
		for (uint32_t x = align16Left; x <= right; x += 16) {
			// load 16 bytes
			v128_t row = wasm_v128_load(colourRow);

			// check if each cell is alive
			v128_t aliveCells = wasm_v128_and(row, alive);
			aliveCells = wasm_i8x16_eq(aliveCells, alive);

			// check for state 6 cells
			v128_t ov6Row = wasm_i8x16_eq(row, state6);

			// combine the alive and state 6 cells
			row = wasm_v128_or(aliveCells, ov6Row);

			// get the results as a bitmask
			uint16_t mask = wasm_i8x16_bitmask(row);

			// iterate over the alive bits in the mask
			const uint32_t xshift = x - left;

			while (mask) {
				uint32_t i = __builtin_ctz(mask);
				hash = (hash * factor) ^ yshift;
				hash = (hash * factor) ^ (xshift + i);
				if (*(colourRow + i) == 6) {
					hash = (hash * factor) ^ 6;
				}
				mask &= (mask - 1);
			}

			// next chunk
			colourRow += 16;
		}

		// next row
		colourRow += rowOffset;
	}

	return hash;
}


EMSCRIPTEN_KEEPALIVE
// create a hash from the colour grid for [R]History algo
uint32_t getHashLifeHistory(
	uint8_t *const colourGrid,
	uint8_t *const overlayGrid,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t colourGridWidth,
	const int32_t aliveStart,
	const int32_t state6
) {
	const uint32_t factor = 1000003;
	uint32_t hash = 31415962;

	// alive cells
	const v128_t alive = wasm_u8x16_splat(aliveStart);

	// overlay state 6 cells
	const v128_t overlay6 = wasm_u8x16_splat(state6);

	// align left to 16 bytes
	// we can read bytes to the left or right of the box since none of them will be alive so won't change the hash value
	const uint32_t align16Left = left & ~15;

	// get the starting offset in the colour grid
	uint8_t *colourRow = colourGrid + bottom * colourGridWidth + align16Left;
	uint8_t *overlayRow = overlayGrid + bottom * colourGridWidth + align16Left;

	// get offset to next row
	uint32_t rowOffset = colourGridWidth - ((((right - align16Left) >> 4) + 1) << 4);

	// process each row in the bounding box
	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t yshift = y - bottom;

		// process each 16 byte chunk in the row
		for (uint32_t x = align16Left; x <= right; x += 16) {
			// load 16 bytes
			v128_t row = wasm_v128_load(colourRow);

			// check if each cell is alive
			row = wasm_u8x16_ge(row, alive);

			// check for overlay state 6 cells
			v128_t ov6Row = wasm_v128_load(overlayRow);
			ov6Row = wasm_i8x16_eq(row, overlay6);

			// combine the alive and overlay 6 cells
			row = wasm_v128_or(row, ov6Row);

			// get the results as a bitmask
			uint16_t mask = wasm_i8x16_bitmask(row);

			// iterate over the alive bits in the mask
			const uint32_t xshift = x - left;

			while (mask) {
				uint32_t i = __builtin_ctz(mask);
				hash = (hash * factor) ^ yshift;
				hash = (hash * factor) ^ (xshift + i);
				if (*(overlayRow + i) == state6) {
					hash = (hash * factor) ^ 6;
				}
				mask &= (mask - 1);
			}

			// next chunk
			colourRow += 16;
		}

		// next row
		colourRow += rowOffset;
		overlayRow += rowOffset;
	}

	return hash;
}


EMSCRIPTEN_KEEPALIVE
// create a hash from the colour grid for RuleLoader, PCA or Extended
uint32_t getHashRuleLoaderOrPCAOrExtended(
	uint8_t *const colourGrid,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t colourGridWidth,
	const uint32_t historyStates
) {
	const uint32_t factor = 1000003;
	uint32_t hash = 31415962;

	// alive cells offset
	const v128_t history = wasm_u8x16_splat(historyStates);

	// align left to 16 bytes
	// we can read bytes to the left or right of the box since none of them will be alive so won't change the hash value
	const uint32_t align16Left = left & ~15;

	// get the starting offset in the colour grid
	uint8_t *colourRow = colourGrid + bottom * colourGridWidth + align16Left;

	// get offset to next row
	uint32_t rowOffset = colourGridWidth - ((((right - align16Left) >> 4) + 1) << 4);

	// process each row in the bounding box
	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t yshift = y - bottom;

		// process each 16 byte chunk in the row
		for (uint32_t x = align16Left; x <= right; x += 16) {
			// load 16 bytes
			v128_t row = wasm_v128_load(colourRow);

			// check if each cell is alive
			row = wasm_u8x16_gt(row, history);

			// get the results as a bitmask
			uint16_t mask = wasm_i8x16_bitmask(row);

			// iterate over the alive bits in the mask
			const uint32_t xshift = x - left;

			while (mask) {
				uint32_t i = __builtin_ctz(mask);
				hash = (hash * factor) ^ yshift;
				hash = (hash * factor) ^ (xshift + i);
				hash = (hash * factor) ^ (*(colourRow + i) - historyStates);
				mask &= (mask - 1);
			}

			// next chunk
			colourRow += 16;
		}

		// next row
		colourRow += rowOffset;
	}

	return hash;
}

EMSCRIPTEN_KEEPALIVE
// create a hash from the colour grid for Generations
uint32_t getHashGenerations(
	uint8_t *const colourGrid,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t colourGridWidth,
	const uint32_t historyStates,
	const uint32_t numStates
) {
	const uint32_t factor = 1000003;
	uint32_t hash = 31415962;

	// alive cells offset
	const v128_t history = wasm_u8x16_splat(historyStates);

	// align left to 16 bytes
	// we can read bytes to the left or right of the box since none of them will be alive so won't change the hash value
	const uint32_t align16Left = left & ~15;

	// get the starting offset in the colour grid
	uint8_t *colourRow = colourGrid + bottom * colourGridWidth + align16Left;

	// get offset to next row
	uint32_t rowOffset = colourGridWidth - ((((right - align16Left) >> 4) + 1) << 4);

	// process each row in the bounding box
	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t yshift = y - bottom;

		// process each 16 byte chunk in the row
		for (uint32_t x = align16Left; x <= right; x += 16) {
			// load 16 bytes
			v128_t row = wasm_v128_load(colourRow);

			// check if each cell is alive
			row = wasm_u8x16_gt(row, history);

			// get the results as a bitmask
			uint16_t mask = wasm_i8x16_bitmask(row);

			// iterate over the alive bits in the mask
			const uint32_t xshift = x - left;

			while (mask) {
				uint32_t i = __builtin_ctz(mask);
				hash = (hash * factor) ^ yshift;
				hash = (hash * factor) ^ (xshift + i);
				hash = (hash * factor) ^ (numStates - (*(colourRow + i) - historyStates));
				mask &= (mask - 1);
			}

			// next chunk
			colourRow += 16;
		}

		// next row
		colourRow += rowOffset;
	}

	return hash;
}
