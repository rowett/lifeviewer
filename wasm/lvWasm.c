// LifeViewer WebAssembly functions
// Faster versions of LifeViewer functions implemented using WebAssembly SIMD Intrinstics
// See: https://emscripten.org/docs/porting/simd.html#webassembly-simd-intrinsics
//
// Identify
//	updateOccupancyStrict
//	updateCellCounts
//	getHashTwoState
// 	getHashRuleLoaderOrPCAOrExtended
//	getHashGenerations
//	getHashLifeHistory
//	getHashSuper
//
// Rendering
//	createNxNColourGrid (N = 2, 4, 8, 16, 32)
//	createNxNColourGridSuper (N = 2, 4, 8, 16, 32)
//	renderGridNoClipNoRotate (single layer)
//	renderGridClipNoRotate (single layer)
//	renderOverlayNoClipNoRotate (single layer [R]History)
//	renderOverlayClipNoRotate (single layer [R]History)
//
// Iterator
//	convertToPens (Life-like)
//	nextGeneration (Life-like)
//	nextGenerationGenerations (Generations)
//	nextGenerationSuperMoore (Super, Moore)
//
// HROT
//	nextGenerationHROTMoore2/N (Moore, deterministic)
//	nextGenerationHROTVN2/N (von Neumann, deterministic)
//	nextGenerationCornerEdge2/N (Corner/Edge, deterministic)
//	nextGenerationCross2/N (Cross, deterministic)
//	nextGenerationHash2/N (Hash, deterministic)
//	nextGenerationStar2/N (Star, deterministic)
//	nextGenerationSaltire2/N (Saltire, deterministic)
//	nextGenerationCheckerboard2/N (Checkerboard, deterministic)
//	nextGenerationAlignedCheckerboard2/N (Aligned Checkerboard, deterministic)
//	nextGenerationShaped2/N (L2 or Circular, deterministic)
//	nextGenerationHexagonal2/N (Hexagonal, deterministic)
//	nextGenerationAsterisk2/N (Asterisk, deterministic)
//	nextGenerationTripod2/N (Tripod, deterministic)
//	nextGenerationTriangular2/N (Triangular, deterministic)
//	nextGenerationCustom2/N (Custom, deterministic)
//	nextGenerationGaussian2/N (Gaussian, deterministic)
//	nextGenerationWeighted2/N (Weighted, deterministic)
//	nextGenerationWeightedStates2/N (Weighted with weighted states, deterministic)
//	updateGridFromCounts2/N
//	cumulativeMooreCounts2/N (Moore)
//	cumulativeVNCounts2/N (von Neumann)
//	clearTopAndLeft (Moore)
//	wrapTorusHROT (Torus Bounded Grid)
//	clearHROTOutside (Bounded Grid)

// TODO:
//	investigate:
//		nextGenerationLifeHistory
//		nextGenerationSuper
//		nextGenerationExtended
//		nextGenerationPCA
//		nextGenerationMargolus
//		nextGenerationRuleTree
//		nextGenerationRuleTable
//		nextGenerationTri
//		nextGeneration (Life-like)

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
void nextGenerationCheckerBoth2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart,
	const int32_t start
) {
	int32_t x, y, i, j;
	int32_t count, count2, offset;

	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first two cells in a row count the entire neighbourhood
		count = 0;
		offset = start;
		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;
		uint8_t *midColourRow = colourGrid + y * colourGridWidth;

		for (j = -yrange; j <= yrange; j++) {
			for (i = -xrange + offset; i <= xrange - offset; i += 2) {
				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
			}
			offset = 1 - offset;

			colourRow += colourGridWidth;
		}

		// check for survival
		if (start == 1 && *(midColourRow + x) >= aliveStart) {
			count++;
		}
		*(countRow + x) = count;
		x++;

		// check if there are two cells in the row
		if (x <= rightX + xrange) {
			count2 = 0;
			offset = start;
			colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= yrange; j++) {
				for (i = -xrange + offset; i <= xrange - offset; i += 2) {
					if (*(colourRow + i) >= aliveStart) {
						count2++;
					}
				}
				offset = 1 - offset;

				colourRow += colourGridWidth;
			}

			// check for survival
			if (start == 1 && *(midColourRow + x) >= aliveStart) {
				count2++;
			}
			*(countRow + x) = count2;
			x++;

			// for the remaining cell pairs on the row subtract the left and add the right cells
			while (x <= rightX + xrange) {
				offset = start;
				colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j <= yrange; j++) {
					if (*(colourRow - xrange + offset - 2) >= aliveStart) {
						count--;
					}
					if (*(colourRow + xrange - offset) >= aliveStart) {
						count++;
					}
					offset = 1 - offset;

					colourRow += colourGridWidth;
				}

				// check for survival
				if (start == 1) {
					if (*(midColourRow + x - 2) >= aliveStart) {
						count--;
					}
					if (*(midColourRow + x) >= aliveStart) {
						count++;
					}
				}
				*(countRow + x) = count;
				x++;

				if (x <= rightX + xrange) {
					offset = start;
					colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

					for (j = -yrange; j <= yrange; j++) {
						if (*(colourRow - xrange + offset - 2) >= aliveStart) {
							count2--;
						}
						if (*(colourRow + xrange - offset) >= aliveStart) {
							count2++;
						}
						offset = 1 - offset;

						colourRow += colourGridWidth;
					}

					// check for survival
					if (start == 1) {
						if (*(midColourRow + x - 2) >= aliveStart) {
							count2--;
						}
						if (*(midColourRow + x) >= aliveStart) {
							count2++;
						}
					}
					*(countRow + x) = count2;
					x++;
				}
			}
		}

		countRow += countsWidth;
		midColourRow += colourGridWidth;
	}
}



EMSCRIPTEN_KEEPALIVE
void nextGenerationCheckerboard2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	nextGenerationCheckerBoth2(counts, countsWidth, colourGrid, colourGridWidth, leftX, bottomY, rightX, topY, xrange, yrange, aliveStart, 1);
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationAlignedCheckerboard2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	nextGenerationCheckerBoth2(counts, countsWidth, colourGrid, colourGridWidth, leftX, bottomY, rightX, topY, xrange, yrange, aliveStart, 0);
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationGaussian2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t i, j, x, y, inc, weight, count;

	// Gaussian
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;
		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow1 = colourGrid + (y - yrange) * colourGridWidth + x;
			uint8_t *colourRow2 = colourGrid + (y + yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				inc = j + yrange + 1;
				weight = inc;
				for (i = -xrange; i <= 0; i++) {
					if (*(colourRow1 + i) >= aliveStart) {
						count += weight;
					}
					weight += inc;
				}

				weight -= inc + inc;
				for (i = 1; i <= xrange; i++) {
					if (*(colourRow1 + i) >= aliveStart) {
						count += weight;
					}
					weight -= inc;
				}

				inc = j + yrange + 1;
				weight = inc;

				for (i = -xrange; i <= 0; i++) {
					if (*(colourRow2 + i) >= aliveStart) {
						count += weight;
					}
					weight += inc;
				}

				weight -= inc + inc;
				for (i = 1; i <= xrange; i++) {
					if (*(colourRow2 + i) >= aliveStart) {
						count += weight;
					}
					weight -= inc;
				}

				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			inc = xrange + 1;
			weight = inc;
			for (i = -xrange; i <= 0; i++) {
				if (*(colourRow1 + i) >= aliveStart) {
					count += weight;
				}
				weight += inc;
			}

			weight -= inc + inc;
			for (i = 1; i <= xrange; i++) {
				if (*(colourRow1 + i) >= aliveStart) {
					count += weight;
				}
				weight -= inc;
			}
			if (*colourRow1 >= aliveStart) {
				count++;
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationCustom2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int16_t *neighbourList,
	const uint32_t neighbourLength,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart,
	const int32_t isTriangular
) {
	int32_t i, j, k, l, x, y, width, count;

	// Custom
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;
			j = 0;
			while (j < neighbourLength) {
				// get the row number
				i = neighbourList[j];
				if (isTriangular && (((x + y) & 1) == 0)) {
					i = -i;
				}
				j++;

				uint8_t *colourRow = colourGrid + (y + i) * colourGridWidth + x;

				// get the count of items in the row
				k = neighbourList[j];
				j++;

				for (l = j; l < j + k; l++) {
					if (*(colourRow + neighbourList[l]) >= aliveStart) {
						count++;
					}
				}
				j += k;
			}
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


void nextGenerationWeighted2R1(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int8_t *weightedNeighbourhood,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t topY,
	const uint32_t rightX,
	const uint32_t range,
	const uint32_t aliveStart
) {
	int32_t x, y, count;

	const int8_t w0 = weightedNeighbourhood[0];
	const int8_t w1 = weightedNeighbourhood[1];
	const int8_t w2 = weightedNeighbourhood[2];
	const int8_t w3 = weightedNeighbourhood[3];
	const int8_t w4 = weightedNeighbourhood[4];
	const int8_t w5 = weightedNeighbourhood[5];
	const int8_t w6 = weightedNeighbourhood[6];
	const int8_t w7 = weightedNeighbourhood[7];
	const int8_t w8 = weightedNeighbourhood[8];

	int32_t *countRow = counts + (bottomY - range) * countsWidth;
	uint8_t *colourRow = colourGrid + (bottomY - range - 1) * colourGridWidth + leftX - range;

	const uint32_t nextCol = colourGridWidth + colourGridWidth - 1;
	const uint32_t nextRow = colourGridWidth - (rightX + range - (leftX - range) + 1);

	for (y = bottomY - range; y <= topY + range; y++) {
		x = leftX - range;

		while (x <= rightX + range) {
			count = 0;
			if (*(colourRow - 1) >= aliveStart) {
				count += w0;
			}
			if (*colourRow >= aliveStart) {
				count += w1;
			}
			if (*(colourRow + 1) >= aliveStart) {
				count += w2;
			}

			colourRow += colourGridWidth;
			if (*(colourRow - 1) >= aliveStart) {
				count += w3;
			}
			if (*colourRow >= aliveStart) {
				count += w4;
			}
			if (*(colourRow + 1) >= aliveStart) {
				count += w5;
			}

			colourRow += colourGridWidth;
			if (*(colourRow - 1) >= aliveStart) {
				count += w6;
			}
			if (*colourRow >= aliveStart) {
				count += w7;
			}
			if (*(colourRow + 1) >= aliveStart) {
				count += w8;
			}

			*(countRow + x) = count;
			x++;

			colourRow -= nextCol;
		}

		countRow += countsWidth;
		colourRow += nextRow;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationWeighted2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int8_t *weightedNeighbourhood,
	const uint32_t weightedNeighbourhoodLength,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart,
	const int32_t isTriangular
) {
	int32_t i, j, k, l, x, y, count;

	const int32_t rowChunk = xrange + xrange + 1;

	// check for square range 1
	if (xrange == 1 && yrange == 1 && !isTriangular) {
		nextGenerationWeighted2R1(counts, countsWidth, colourGrid, colourGridWidth, weightedNeighbourhood, bottomY, leftX, topY, rightX, xrange, aliveStart);
	} else {
		// Weighted
		int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

		// weighted
		if (isTriangular) {
			for (y = bottomY - yrange; y <= topY + yrange; y++) {
				x = leftX - xrange;

				while (x <= rightX + xrange) {
					count = 0;
					if ((x + y) & 1) {
						l = -rowChunk;
						k = weightedNeighbourhoodLength + l;
						l += l;
					} else {
						k = 0;
						l = 0;
					}

					uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

					for (j = -yrange; j <= yrange; j++) {
						for (i = -xrange; i <= xrange; i++) {
							if (*(colourRow + i) >= aliveStart) {
								count += weightedNeighbourhood[k];
							}
							k++;
						}
						k += l;

						colourRow += colourGridWidth;
					}
					*(countRow + x) = count;
					x++;
				}

				countRow += countsWidth;
			}
		} else {
			for (y = bottomY - yrange; y <= topY + yrange; y++) {
				x = leftX - xrange;

				while (x <= rightX + xrange) {
					count = 0;
					k = 0;

					uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

					for (j = -yrange; j <= yrange; j++) {
						for (i = -xrange; i <= xrange; i++) {
							if (*(colourRow + i) >= aliveStart) {
								count += weightedNeighbourhood[k];
							}
							k++;
						}

						colourRow += colourGridWidth;
					}
					*(countRow + x) = count;
					x++;
				}

				countRow += countsWidth;
			}
		}
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationWeightedStates2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int8_t *weightedNeighbourhood,
	const uint32_t weightedNeighbourhoodLength,
	uint8_t *weightedStates,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart,
	const int32_t isTriangular
) {
	int32_t i, j, k, l, x, y, count;

	const int32_t rowChunk = xrange + xrange + 1;

	const uint32_t deadWeight = weightedStates[0];
	const uint32_t aliveWeight = weightedStates[1];

	// Weighted States
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	// weighted
	if (isTriangular) {
		for (y = bottomY - yrange; y <= topY + yrange; y++) {
			x = leftX - xrange;

			while (x <= rightX + xrange) {
				count = 0;
				if ((x + y) & 1) {
					l = -rowChunk;
					k = weightedNeighbourhoodLength + l;
					l += l;
				} else {
					k = 0;
					l = 0;
				}

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j <= yrange; j++) {
					for (i = -xrange; i <= xrange; i++) {
						if (*(colourRow + i) >= aliveStart) {
							count += weightedNeighbourhood[k] * aliveWeight;
						} else {
							count += weightedNeighbourhood[k] * deadWeight;
						}
						k++;
					}
					k += l;

					colourRow += colourGridWidth;
				}
				*(countRow + x) = count;
				x++;
			}

			countRow += countsWidth;
		}
	} else {
		for (y = bottomY - yrange; y <= topY + yrange; y++) {
			x = leftX - xrange;

			while (x <= rightX + xrange) {
				count = 0;
				k = 0;

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j <= yrange; j++) {
					for (i = -xrange; i <= xrange; i++) {
						if (*(colourRow + i) >= aliveStart) {
							count += weightedNeighbourhood[k] * aliveWeight;
						} else {
							count += weightedNeighbourhood[k] * deadWeight;
						}
						k++;
					}

					colourRow += colourGridWidth;
				}
				*(countRow + x) = count;
				x++;
			}

			countRow += countsWidth;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationShaped2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	uint32_t *widths,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t i, j, x, y, width, count;

	// L2 or Circular
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first cell in the row count the entire neighborhood
		count = 0;
		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

		for (j = -yrange; j <= yrange; j++) {
			width = widths[j + yrange];
			for (i = -width; i < width; i += 2) {
				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
				if (*(colourRow+ i + 1) >= aliveStart) {
					count++;
				}
			}
			if (*(colourRow + i) >= aliveStart) {
				count++;
			}

			colourRow += colourGridWidth;
		}
		countRow[x] = count;
		x++;

		// for the remaining rows subtract the left and add the right cells
		while (x <= rightX + xrange) {
			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= yrange; j++) {
				width = widths[j + yrange];
				if (*(colourRow - width - 1) >= aliveStart) {
					count--;
				}
				if (*(colourRow + width) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}
			countRow[x] = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationHexagonal2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, i, j, count;

	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first cell count the entire neighbourhood
		count = 0;
		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;
		for (j = -yrange; j < 0; j++) {
			for (i = -xrange; i <= xrange + j; i++) {
				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
			}

			colourRow += colourGridWidth;
		}

		for (j = 0; j <= yrange; j++) {
			for (i = -xrange + j; i <= xrange; i++) {
				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
			}

			colourRow += colourGridWidth;
		}

		countRow[x] = count;
		x++;

		// for the remaining rows subtract the left and add the right cells
		while (x <= rightX + xrange) {
			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				if (*(colourRow - xrange - 1) >= aliveStart) {
					count--;
				}
				if (*(colourRow + xrange + j) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			for (j = 0; j <= yrange; j++) {
				if (*(colourRow - xrange + j - 1) >= aliveStart) {
					count--;
				}
				if (*(colourRow + xrange) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			countRow[x] = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationTripod2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, i, j, count;

	// tripod
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				if (*colourRow >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			for (i = -xrange; i <= 0; i++) {
				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
			}
			colourRow += colourGridWidth;

			for (j = 1; j <= xrange; j++) {
				if (*(colourRow + j) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationCornerEdge2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart,
	const int32_t cornerRange,
	const int32_t edgeRange
) {
	int32_t x, y, count;

	const uint32_t cr2 = (cornerRange * 2) * colourGridWidth;
	const uint32_t er2 = (edgeRange * 2) * colourGridWidth;

	// asterisk
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;

			// corners
			uint8_t *colourRow = colourGrid + (y - cornerRange) * colourGridWidth + x;

			if (*(colourRow - cornerRange) >= aliveStart) {
				count++;
			}
			if (*(colourRow + cornerRange) >= aliveStart) {
				count++;
			}

			colourRow += cr2;
			if (*(colourRow - cornerRange) >= aliveStart) {
				count++;
			}
			if (*(colourRow + cornerRange) >= aliveStart) {
				count++;
			}

			// edges
			colourRow = colourGrid + (y - edgeRange) * colourGridWidth + x;
			if (*colourRow >= aliveStart) {
				count++;
			}

			colourRow += er2;
			if (*colourRow >= aliveStart) {
				count++;
			}

			colourRow = colourGrid + y * colourGridWidth + x;
			if (*(colourRow - edgeRange) >= aliveStart) {
				count++;
			}
			if (*(colourRow + edgeRange) >= aliveStart) {
				count++;
			}

			// survival
			if (*colourRow >= aliveStart) {
				count++;
			}

			// save count
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationAsterisk2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, i, j, count;

	// asterisk
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				if (*colourRow >= aliveStart) {
					count++;
				}
				if (*(colourRow + j) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			for (i = -xrange; i <= xrange; i++) {
				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
			}
			colourRow += colourGridWidth;

			for (j = 1; j <= xrange; j++) {
				if (*colourRow >= aliveStart) {
					count++;
				}
				if (*(colourRow + j) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationTriangular2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, i, j, k, l, width, count;

	// triangular
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first cell compute the whole neighbourhood
		count = 0;
		k = (x + y) & 1;

		if (k == 0) {
			width = yrange + 1;

			uint8_t* colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) >= aliveStart) {
						count++;
					}
					if (*(colourRow + i + 1) >= aliveStart) {
						count++;
					}
				}

				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
				width++;

				colourRow += colourGridWidth;
			}

			for (j = 0; j <= yrange; j++) {
				width--;
				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) >= aliveStart) {
						count++;
					}
					if (*(colourRow + i + 1) >= aliveStart) {
						count++;
					}
				}

				if (*(colourRow + i) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}
		} else {
			width = yrange;

			uint8_t* colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= 0; j++) {
				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) >= aliveStart) {
						count++;
					}
					if (*(colourRow + i + 1) >= aliveStart) {
						count++;
					}
				}

				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
				width++;

				colourRow += colourGridWidth;
			}

			for (j = 1; j <= yrange; j++) {
				width--;

				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) >= aliveStart) {
						count++;
					}
					if (*(colourRow + i + 1) >= aliveStart) {
						count++;
					}
				}

				if (*(colourRow + i) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;
			}
		}
		*(countRow + x) = count;

		// for the remaining cells compute the edge differences
		x++;
		while (x <= rightX + xrange) {
			k = (x + y) & 1;
			if (k == 0) {
				l = yrange;

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j < 0; j++) {
					if (*(colourRow + l) >= aliveStart) {
						count++;
					}
					l++;
					if (*(colourRow + l) >= aliveStart) {
						count++;
					}

					colourRow += colourGridWidth;
				}

				// j == 0 case
				if (*(colourRow - l - 1) >= aliveStart) {
					count--;
				}
				if (*(colourRow + l) >= aliveStart) {
					count++;
				}
				l++;

				colourRow += colourGridWidth;

				for (j = 1; j <= yrange; j++) {
					l--;
					if (*(colourRow - l - 1) >= aliveStart) {
						count--;
					}
					if (*(colourRow - l) >= aliveStart) {
						count--;
					}

					colourRow += colourGridWidth;
				}
			} else {
				l = yrange + 1;

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j < 0; j++) {
					if (*(colourRow - l - 1) >= aliveStart) {
						count--;
					}
					if (*(colourRow - l) >= aliveStart) {
						count--;
					}
					l++;

					colourRow += colourGridWidth;
				}

				// j == 0 case
				l--;
				if (*(colourRow - l - 1) >= aliveStart) {
					count--;
				}
				if (*(colourRow + l) >= aliveStart) {
					count++;
				}

				colourRow += colourGridWidth;

				for (j = 1; j <= yrange; j++) {
					l--;
					if (*(colourRow + l) >= aliveStart) {
						count++;
					}
					if (*(colourRow + l + 1) >= aliveStart) {
						count++;
					}

					colourRow += colourGridWidth;
				}
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationSaltire2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, i, j, count;

	// saltire
	int32_t * countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;
		while (x <= rightX + xrange) {
			count = 0;
			uint8_t *colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
			uint8_t *colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

			for (j = 1; j <= yrange; j++) {
				if (*(colourRow1 - j) >= aliveStart) {
					count++;
				}

				if (*(colourRow1 + j) >= aliveStart) {
					count++;
				}

				if (*(colourRow2 - j) >= aliveStart) {
					count++;
				}

				if (*(colourRow2 + j) >= aliveStart) {
					count++;
				}

				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			uint8_t *colourRow = colourGrid + y * colourGridWidth + x;
			if (*colourRow >= aliveStart) {
				count++;
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationStar2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, i, j, count;

	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;
			uint8_t *colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
			uint8_t *colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

			for (j = 1; j <= yrange; j++) {
				if (*(colourRow1 - j) >= aliveStart) {
					count++;
				}

				if (*colourRow1 >= aliveStart) {
					count++;
				}

				if (*(colourRow1 + j) >= aliveStart) {
					count++;
				}

				if (*(colourRow2 - j) >= aliveStart) {
					count++;
				}

				if (*colourRow2 >= aliveStart) {
					count++;
				}

				if (*(colourRow2 + j) >= aliveStart) {
					count++;
				}

				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			uint8_t *colourRow = colourGrid + y * colourGridWidth + x;
			for (i = -xrange; i <= xrange; i++) {
				if (*(colourRow + i) >= aliveStart) {
					count++;
				}
			}
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationHash2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, i, j, count, rowCount, rowCount2;
	int32_t nextRow = countsWidth - (rightX + xrange - (leftX - xrange) + 1);

	// hash
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		int32_t* saveRow = countRow;

		x = leftX - xrange;

		// for the first cell count the entire neighborhood
		count = 0;
		rowCount = 0;
		rowCount2 = 0;

		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

		for (j = -yrange; j <= yrange; j++) {

			if (j == 1) {
				for (i = -xrange; i <= xrange; i++) {
					if (*(colourRow + i) >= aliveStart) {
						rowCount++;
					}
				}
			} else if (j == -1) {
				for (i = -xrange; i <= xrange; i++) {
					if (*(colourRow + i) >= aliveStart) {
						rowCount2++;
					}
				}
			} else {
				if (*(colourRow - 1) >= aliveStart) {
					count++;
				}
				if (*(colourRow + 1) >= aliveStart) {
					count++;
				}
			}

			colourRow += colourGridWidth;
		}

		if (*(colourGrid + y * colourGridWidth + x) >= aliveStart) {
			count++;
		}

		countRow[x] = count + rowCount + rowCount2;
		x++;

		// handle remaining rows
		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= yrange; j++) {

				if (j == 1) {
					if (*(colourRow - xrange - 1) >= aliveStart) {
						rowCount--;
					}
					if (*(colourRow + xrange) >= aliveStart) {
						rowCount++;
					}
				} else if (j == -1) {
					if (*(colourRow - xrange - 1) >= aliveStart) {
						rowCount2--;
					}
					if (*(colourRow + xrange) >= aliveStart) {
						rowCount2++;
					}
				} else {
					if (*(colourRow - 1) >= aliveStart) {
						count++;
					}
					if (*(colourRow + 1) >= aliveStart) {
						count++;
					}
				}

				colourRow += colourGridWidth;
			}

			// check for survival
			if (*(colourGrid + y * colourGridWidth + x) >= aliveStart) {
				count++;
			}

			countRow[x] = count + rowCount + rowCount2;
			x++;
		}

		countRow = saveRow + countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationCross2(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t* colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const uint32_t aliveStart
) {
	int32_t x, y, i, j, count, rowCount;

	// cross
	int32_t* countRow = counts + (bottomY - yrange) * countsWidth;
	int32_t nextRow = countsWidth - (rightX + xrange - (leftX - xrange) + 1);

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		int32_t *saveRow = countRow;

		x = leftX - xrange;

		// for the first cell count the entire neighborhood
		count = 0;
		rowCount = 0;
		uint8_t *colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
		uint8_t *colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

		for (j = 1; j <= yrange; j++) {
			if (*colourRow1 >= aliveStart) {
				count++;
			}
			if (*colourRow2 >= aliveStart) {
				count++;
			}
			colourRow1 += colourGridWidth;
			colourRow2 -= colourGridWidth;
		}

		colourRow1 = colourGrid + y * colourGridWidth + x;
		for (i = -xrange; i <= xrange; i++) {
			if (*(colourRow1 + i) >= aliveStart) {
				rowCount++;
			}
		}
		countRow[x] = count + rowCount;
		x++;

		// for remaining rows subtract the left and right cells
		while (x <= rightX + xrange) {
			count = 0;
			colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
			colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

			for (j = 1; j <= yrange; j++) {
				if (*colourRow1 >= aliveStart) {
					count++;
				}
				if (*colourRow2 >= aliveStart) {
					count++;
				}
				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			colourRow1 = colourGrid + y * colourGridWidth + x;
			if (*(colourRow1 - xrange - 1) >= aliveStart) {
				rowCount--;
			}
			if (*(colourRow1 + xrange) >= aliveStart) {
				rowCount++;
			}
			countRow[x] = count + rowCount;
			x++;
		}

		countRow = saveRow + countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationCheckerBothN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState,
	const int32_t start
) {
	int32_t x, y, i, j;
	int32_t count, count2, offset;

	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first two cells in a row count the entire neighbourhood
		count = 0;
		offset = start;
		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;
		uint8_t *midColourRow = colourGrid + y * colourGridWidth;

		for (j = -yrange; j <= yrange; j++) {
			for (i = -xrange + offset; i <= xrange - offset; i += 2) {
				if (*(colourRow + i) == maxGenState) {
					count++;
				}
			}
			offset = 1 - offset;

			colourRow += colourGridWidth;
		}

		// check for survival
		if (start == 1 && *(midColourRow + x) == maxGenState) {
			count++;
		}
		*(countRow + x) = count;
		x++;

		// check if there are two cells in the row
		if (x <= rightX + xrange) {
			count2 = 0;
			offset = start;
			colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= yrange; j++) {
				for (i = -xrange + offset; i <= xrange - offset; i += 2) {
					if (*(colourRow + i) == maxGenState) {
						count2++;
					}
				}
				offset = 1 - offset;

				colourRow += colourGridWidth;
			}

			// check for survival
			if (start == 1 && *(midColourRow + x) == maxGenState) {
				count2++;
			}
			*(countRow + x) = count2;
			x++;

			// for the remaining cell pairs on the row subtract the left and add the right cells
			while (x <= rightX + xrange) {
				offset = start;
				colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j <= yrange; j++) {
					if (*(colourRow - xrange + offset - 2) == maxGenState) {
						count--;
					}
					if (*(colourRow + xrange - offset) == maxGenState) {
						count++;
					}
					offset = 1 - offset;

					colourRow += colourGridWidth;
				}

				// check for survival
				if (start == 1) {
					if (*(midColourRow + x - 2) == maxGenState) {
						count--;
					}
					if (*(midColourRow + x) == maxGenState) {
						count++;
					}
				}
				*(countRow + x) = count;
				x++;

				if (x <= rightX + xrange) {
					offset = start;
					colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

					for (j = -yrange; j <= yrange; j++) {
						if (*(colourRow - xrange + offset - 2) == maxGenState) {
							count2--;
						}
						if (*(colourRow + xrange - offset) == maxGenState) {
							count2++;
						}
						offset = 1 - offset;

						colourRow += colourGridWidth;
					}

					// check for survival
					if (start == 1) {
						if (*(midColourRow + x - 2) == maxGenState) {
							count2--;
						}
						if (*(midColourRow + x) == maxGenState) {
							count2++;
						}
					}
					*(countRow + x) = count2;
					x++;
				}
			}
		}

		countRow += countsWidth;
		midColourRow += colourGridWidth;
	}
}



EMSCRIPTEN_KEEPALIVE
void nextGenerationCheckerboardN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	nextGenerationCheckerBoth2(counts, countsWidth, colourGrid, colourGridWidth, leftX, bottomY, rightX, topY, xrange, yrange, maxGenState, 1);
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationAlignedCheckerboardN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	nextGenerationCheckerBoth2(counts, countsWidth, colourGrid, colourGridWidth, leftX, bottomY, rightX, topY, xrange, yrange, maxGenState, 0);
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationGaussianN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t i, j, x, y, inc, weight, count;

	// Gaussian
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;
		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow1 = colourGrid + (y - yrange) * colourGridWidth + x;
			uint8_t *colourRow2 = colourGrid + (y + yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				inc = j + yrange + 1;
				weight = inc;
				for (i = -xrange; i <= 0; i++) {
					if (*(colourRow1 + i) == maxGenState) {
						count += weight;
					}
					weight += inc;
				}

				weight -= inc + inc;
				for (i = 1; i <= xrange; i++) {
					if (*(colourRow1 + i) == maxGenState) {
						count += weight;
					}
					weight -= inc;
				}

				inc = j + yrange + 1;
				weight = inc;

				for (i = -xrange; i <= 0; i++) {
					if (*(colourRow2 + i) == maxGenState) {
						count += weight;
					}
					weight += inc;
				}

				weight -= inc + inc;
				for (i = 1; i <= xrange; i++) {
					if (*(colourRow2 + i) == maxGenState) {
						count += weight;
					}
					weight -= inc;
				}

				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			inc = xrange + 1;
			weight = inc;
			for (i = -xrange; i <= 0; i++) {
				if (*(colourRow1 + i) == maxGenState) {
					count += weight;
				}
				weight += inc;
			}

			weight -= inc + inc;
			for (i = 1; i <= xrange; i++) {
				if (*(colourRow1 + i) == maxGenState) {
					count += weight;
				}
				weight -= inc;
			}
			if (*colourRow1 == maxGenState) {
				count++;
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationCustomN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int16_t *neighbourList,
	const uint32_t neighbourLength,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState,
	const int32_t isTriangular
) {
	int32_t i, j, k, l, x, y, width, count;

	// Custom
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;
			j = 0;
			while (j < neighbourLength) {
				// get the row number
				i = neighbourList[j];
				if (isTriangular && (((x + y) & 1) == 0)) {
					i = -i;
				}
				j++;

				uint8_t *colourRow = colourGrid + (y + i) * colourGridWidth + x;

				// get the count of items in the row
				k = neighbourList[j];
				j++;

				for (l = j; l < j + k; l++) {
					if (*(colourRow + neighbourList[l]) == maxGenState) {
						count++;
					}
				}
				j += k;
			}
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


void nextGenerationWeightedNR1(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int8_t *weightedNeighbourhood,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t topY,
	const uint32_t rightX,
	const uint32_t range,
	const uint32_t maxGenState
) {
	int32_t x, y, count;

	const int8_t w0 = weightedNeighbourhood[0];
	const int8_t w1 = weightedNeighbourhood[1];
	const int8_t w2 = weightedNeighbourhood[2];
	const int8_t w3 = weightedNeighbourhood[3];
	const int8_t w4 = weightedNeighbourhood[4];
	const int8_t w5 = weightedNeighbourhood[5];
	const int8_t w6 = weightedNeighbourhood[6];
	const int8_t w7 = weightedNeighbourhood[7];
	const int8_t w8 = weightedNeighbourhood[8];

	int32_t *countRow = counts + (bottomY - range) * countsWidth;
	uint8_t *colourRow = colourGrid + (bottomY - range - 1) * colourGridWidth + leftX - range;

	const uint32_t nextCol = colourGridWidth + colourGridWidth - 1;
	const uint32_t nextRow = colourGridWidth - (rightX + range - (leftX - range) + 1);

	for (y = bottomY - range; y <= topY + range; y++) {
		x = leftX - range;

		while (x <= rightX + range) {
			count = 0;
			if (*(colourRow - 1) == maxGenState) {
				count += w0;
			}
			if (*colourRow == maxGenState) {
				count += w1;
			}
			if (*(colourRow + 1) == maxGenState) {
				count += w2;
			}

			colourRow += colourGridWidth;
			if (*(colourRow - 1) == maxGenState) {
				count += w3;
			}
			if (*colourRow == maxGenState) {
				count += w4;
			}
			if (*(colourRow + 1) == maxGenState) {
				count += w5;
			}

			colourRow += colourGridWidth;
			if (*(colourRow - 1) == maxGenState) {
				count += w6;
			}
			if (*colourRow == maxGenState) {
				count += w7;
			}
			if (*(colourRow + 1) == maxGenState) {
				count += w8;
			}

			*(countRow + x) = count;
			x++;

			colourRow -= nextCol;
		}

		countRow += countsWidth;
		colourRow += nextRow;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationWeightedN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int8_t *weightedNeighbourhood,
	const uint32_t weightedNeighbourhoodLength,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState,
	const int32_t isTriangular
) {
	int32_t i, j, k, l, x, y, count;

	const int32_t rowChunk = xrange + xrange + 1;

	// check for square range 1
	if (xrange == 1 && yrange == 1 && !isTriangular) {
		nextGenerationWeighted2R1(counts, countsWidth, colourGrid, colourGridWidth, weightedNeighbourhood, bottomY, leftX, topY, rightX, xrange, maxGenState);
	} else {
		// Weighted
		int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

		// weighted
		if (isTriangular) {
			for (y = bottomY - yrange; y <= topY + yrange; y++) {
				x = leftX - xrange;

				while (x <= rightX + xrange) {
					count = 0;
					if ((x + y) & 1) {
						l = -rowChunk;
						k = weightedNeighbourhoodLength + l;
						l += l;
					} else {
						k = 0;
						l = 0;
					}

					uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

					for (j = -yrange; j <= yrange; j++) {
						for (i = -xrange; i <= xrange; i++) {
							if (*(colourRow + i) == maxGenState) {
								count += weightedNeighbourhood[k];
							}
							k++;
						}
						k += l;

						colourRow += colourGridWidth;
					}
					*(countRow + x) = count;
					x++;
				}

				countRow += countsWidth;
			}
		} else {
			for (y = bottomY - yrange; y <= topY + yrange; y++) {
				x = leftX - xrange;

				while (x <= rightX + xrange) {
					count = 0;
					k = 0;

					uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

					for (j = -yrange; j <= yrange; j++) {
						for (i = -xrange; i <= xrange; i++) {
							if (*(colourRow + i) == maxGenState) {
								count += weightedNeighbourhood[k];
							}
							k++;
						}

						colourRow += colourGridWidth;
					}
					*(countRow + x) = count;
					x++;
				}

				countRow += countsWidth;
			}
		}
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationWeightedStatesN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	int8_t *weightedNeighbourhood,
	const uint32_t weightedNeighbourhoodLength,
	uint8_t *weightedStates,
	const int32_t leftX,
	const int32_t bottomY,
	const int32_t rightX,
	const int32_t topY,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState,
	const int32_t isTriangular
) {
	int32_t i, j, k, l, x, y, count;

	const int32_t rowChunk = xrange + xrange + 1;

	const uint32_t deadWeight = weightedStates[0];
	const uint32_t aliveWeight = weightedStates[1];

	// Weighted States
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	// weighted
	if (isTriangular) {
		for (y = bottomY - yrange; y <= topY + yrange; y++) {
			x = leftX - xrange;

			while (x <= rightX + xrange) {
				count = 0;
				if ((x + y) & 1) {
					l = -rowChunk;
					k = weightedNeighbourhoodLength + l;
					l += l;
				} else {
					k = 0;
					l = 0;
				}

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j <= yrange; j++) {
					for (i = -xrange; i <= xrange; i++) {
						if (*(colourRow + i) == maxGenState) {
							count += weightedNeighbourhood[k] * aliveWeight;
						} else {
							count += weightedNeighbourhood[k] * deadWeight;
						}
						k++;
					}
					k += l;

					colourRow += colourGridWidth;
				}
				*(countRow + x) = count;
				x++;
			}

			countRow += countsWidth;
		}
	} else {
		for (y = bottomY - yrange; y <= topY + yrange; y++) {
			x = leftX - xrange;

			while (x <= rightX + xrange) {
				count = 0;
				k = 0;

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j <= yrange; j++) {
					for (i = -xrange; i <= xrange; i++) {
						if (*(colourRow + i) == maxGenState) {
							count += weightedNeighbourhood[k] * aliveWeight;
						} else {
							count += weightedNeighbourhood[k] * deadWeight;
						}
						k++;
					}

					colourRow += colourGridWidth;
				}
				*(countRow + x) = count;
				x++;
			}

			countRow += countsWidth;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationShapedN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	uint32_t *widths,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t i, j, x, y, width, count;

	// L2 or Circular
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first cell in the row count the entire neighborhood
		count = 0;
		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

		for (j = -yrange; j <= yrange; j++) {
			width = widths[j + yrange];
			for (i = -width; i < width; i += 2) {
				if (*(colourRow + i) == maxGenState) {
					count++;
				}
				if (*(colourRow+ i + 1) == maxGenState) {
					count++;
				}
			}
			if (*(colourRow + i) == maxGenState) {
				count++;
			}

			colourRow += colourGridWidth;
		}
		countRow[x] = count;
		x++;

		// for the remaining rows subtract the left and add the right cells
		while (x <= rightX + xrange) {
			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= yrange; j++) {
				width = widths[j + yrange];
				if (*(colourRow - width - 1) == maxGenState) {
					count--;
				}
				if (*(colourRow + width) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}
			countRow[x] = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationHexagonalN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, i, j, count;

	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first cell count the entire neighbourhood
		count = 0;
		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;
		for (j = -yrange; j < 0; j++) {
			for (i = -xrange; i <= xrange + j; i++) {
				if (*(colourRow + i) == maxGenState) {
					count++;
				}
			}

			colourRow += colourGridWidth;
		}

		for (j = 0; j <= yrange; j++) {
			for (i = -xrange + j; i <= xrange; i++) {
				if (*(colourRow + i) == maxGenState) {
					count++;
				}
			}

			colourRow += colourGridWidth;
		}

		countRow[x] = count;
		x++;

		// for the remaining rows subtract the left and add the right cells
		while (x <= rightX + xrange) {
			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				if (*(colourRow - xrange - 1) == maxGenState) {
					count--;
				}
				if (*(colourRow + xrange + j) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			for (j = 0; j <= yrange; j++) {
				if (*(colourRow - xrange + j - 1) == maxGenState) {
					count--;
				}
				if (*(colourRow + xrange) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			countRow[x] = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationTripodN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, i, j, count;

	// tripod
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				if (*colourRow == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			for (i = -xrange; i <= 0; i++) {
				if (*(colourRow + i) == maxGenState) {
					count++;
				}
			}
			colourRow += colourGridWidth;

			for (j = 1; j <= xrange; j++) {
				if (*(colourRow + j) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationCornerEdgeN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState,
	const int32_t cornerRange,
	const int32_t edgeRange
) {
	int32_t x, y, count;

	const uint32_t cr2 = (cornerRange * 2) * colourGridWidth;
	const uint32_t er2 = (edgeRange * 2) * colourGridWidth;

	// asterisk
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;

			// corners
			uint8_t *colourRow = colourGrid + (y - cornerRange) * colourGridWidth + x;

			if (*(colourRow - cornerRange) == maxGenState) {
				count++;
			}
			if (*(colourRow + cornerRange) == maxGenState) {
				count++;
			}

			colourRow += cr2;
			if (*(colourRow - cornerRange) == maxGenState) {
				count++;
			}
			if (*(colourRow + cornerRange) == maxGenState) {
				count++;
			}

			// edges
			colourRow = colourGrid + (y - edgeRange) * colourGridWidth + x;
			if (*colourRow == maxGenState) {
				count++;
			}

			colourRow += er2;
			if (*colourRow == maxGenState) {
				count++;
			}

			colourRow = colourGrid + y * colourGridWidth + x;
			if (*(colourRow - edgeRange) == maxGenState) {
				count++;
			}
			if (*(colourRow + edgeRange) == maxGenState) {
				count++;
			}

			// survival
			if (*colourRow == maxGenState) {
				count++;
			}

			// save count
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationAsteriskN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, i, j, count;

	// asterisk
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				if (*colourRow == maxGenState) {
					count++;
				}
				if (*(colourRow + j) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}

			for (i = -xrange; i <= xrange; i++) {
				if (*(colourRow + i) == maxGenState) {
					count++;
				}
			}
			colourRow += colourGridWidth;

			for (j = 1; j <= xrange; j++) {
				if (*colourRow == maxGenState) {
					count++;
				}
				if (*(colourRow + j) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationTriangularN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, i, j, k, l, width, count;

	// triangular
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		// for the first cell compute the whole neighbourhood
		count = 0;
		k = (x + y) & 1;

		if (k == 0) {
			width = yrange + 1;

			uint8_t* colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j < 0; j++) {
				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) == maxGenState) {
						count++;
					}
					if (*(colourRow + i + 1) == maxGenState) {
						count++;
					}
				}

				if (*(colourRow + i) == maxGenState) {
					count++;
				}
				width++;

				colourRow += colourGridWidth;
			}

			for (j = 0; j <= yrange; j++) {
				width--;
				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) == maxGenState) {
						count++;
					}
					if (*(colourRow + i + 1) == maxGenState) {
						count++;
					}
				}

				if (*(colourRow + i) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}
		} else {
			width = yrange;

			uint8_t* colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= 0; j++) {
				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) == maxGenState) {
						count++;
					}
					if (*(colourRow + i + 1) == maxGenState) {
						count++;
					}
				}

				if (*(colourRow + i) == maxGenState) {
					count++;
				}
				width++;

				colourRow += colourGridWidth;
			}

			for (j = 1; j <= yrange; j++) {
				width--;

				for (i = -width; i < width; i += 2) {
					if (*(colourRow + i) == maxGenState) {
						count++;
					}
					if (*(colourRow + i + 1) == maxGenState) {
						count++;
					}
				}

				if (*(colourRow + i) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;
			}
		}
		*(countRow + x) = count;

		// for the remaining cells compute the edge differences
		x++;
		while (x <= rightX + xrange) {
			k = (x + y) & 1;
			if (k == 0) {
				l = yrange;

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j < 0; j++) {
					if (*(colourRow + l) == maxGenState) {
						count++;
					}
					l++;
					if (*(colourRow + l) == maxGenState) {
						count++;
					}

					colourRow += colourGridWidth;
				}

				// j == 0 case
				if (*(colourRow - l - 1) == maxGenState) {
					count--;
				}
				if (*(colourRow + l) == maxGenState) {
					count++;
				}
				l++;

				colourRow += colourGridWidth;

				for (j = 1; j <= yrange; j++) {
					l--;
					if (*(colourRow - l - 1) == maxGenState) {
						count--;
					}
					if (*(colourRow - l) == maxGenState) {
						count--;
					}

					colourRow += colourGridWidth;
				}
			} else {
				l = yrange + 1;

				uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

				for (j = -yrange; j < 0; j++) {
					if (*(colourRow - l - 1) == maxGenState) {
						count--;
					}
					if (*(colourRow - l) == maxGenState) {
						count--;
					}
					l++;

					colourRow += colourGridWidth;
				}

				// j == 0 case
				l--;
				if (*(colourRow - l - 1) == maxGenState) {
					count--;
				}
				if (*(colourRow + l) == maxGenState) {
					count++;
				}

				colourRow += colourGridWidth;

				for (j = 1; j <= yrange; j++) {
					l--;
					if (*(colourRow + l) == maxGenState) {
						count++;
					}
					if (*(colourRow + l + 1) == maxGenState) {
						count++;
					}

					colourRow += colourGridWidth;
				}
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationSaltireN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, i, j, count;

	// saltire
	int32_t * countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;
		while (x <= rightX + xrange) {
			count = 0;
			uint8_t *colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
			uint8_t *colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

			for (j = 1; j <= yrange; j++) {
				if (*(colourRow1 - j) == maxGenState) {
					count++;
				}

				if (*(colourRow1 + j) == maxGenState) {
					count++;
				}

				if (*(colourRow2 - j) == maxGenState) {
					count++;
				}

				if (*(colourRow2 + j) == maxGenState) {
					count++;
				}

				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			uint8_t *colourRow = colourGrid + y * colourGridWidth + x;
			if (*colourRow == maxGenState) {
				count++;
			}

			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationStarN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, i, j, count;

	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		x = leftX - xrange;

		while (x <= rightX + xrange) {
			count = 0;
			uint8_t *colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
			uint8_t *colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

			for (j = 1; j <= yrange; j++) {
				if (*(colourRow1 - j) == maxGenState) {
					count++;
				}

				if (*colourRow1 == maxGenState) {
					count++;
				}

				if (*(colourRow1 + j) == maxGenState) {
					count++;
				}

				if (*(colourRow2 - j) == maxGenState) {
					count++;
				}

				if (*colourRow2 == maxGenState) {
					count++;
				}

				if (*(colourRow2 + j) == maxGenState) {
					count++;
				}

				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			uint8_t *colourRow = colourGrid + y * colourGridWidth + x;
			for (i = -xrange; i <= xrange; i++) {
				if (*(colourRow + i) == maxGenState) {
					count++;
				}
			}
			*(countRow + x) = count;
			x++;
		}

		countRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationHashN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, i, j, count, rowCount, rowCount2;
	int32_t nextRow = countsWidth - (rightX + xrange - (leftX - xrange) + 1);

	// hash
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		int32_t* saveRow = countRow;

		x = leftX - xrange;

		// for the first cell count the entire neighborhood
		count = 0;
		rowCount = 0;
		rowCount2 = 0;

		uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

		for (j = -yrange; j <= yrange; j++) {

			if (j == 1) {
				for (i = -xrange; i <= xrange; i++) {
					if (*(colourRow + i) == maxGenState) {
						rowCount++;
					}
				}
			} else if (j == -1) {
				for (i = -xrange; i <= xrange; i++) {
					if (*(colourRow + i) == maxGenState) {
						rowCount2++;
					}
				}
			} else {
				if (*(colourRow - 1) == maxGenState) {
					count++;
				}
				if (*(colourRow + 1) == maxGenState) {
					count++;
				}
			}

			colourRow += colourGridWidth;
		}

		if (*(colourGrid + y * colourGridWidth + x) == maxGenState) {
			count++;
		}

		countRow[x] = count + rowCount + rowCount2;
		x++;

		// handle remaining rows
		while (x <= rightX + xrange) {
			count = 0;

			uint8_t *colourRow = colourGrid + (y - yrange) * colourGridWidth + x;

			for (j = -yrange; j <= yrange; j++) {

				if (j == 1) {
					if (*(colourRow - xrange - 1) == maxGenState) {
						rowCount--;
					}
					if (*(colourRow + xrange) == maxGenState) {
						rowCount++;
					}
				} else if (j == -1) {
					if (*(colourRow - xrange - 1) == maxGenState) {
						rowCount2--;
					}
					if (*(colourRow + xrange) == maxGenState) {
						rowCount2++;
					}
				} else {
					if (*(colourRow - 1) == maxGenState) {
						count++;
					}
					if (*(colourRow + 1) == maxGenState) {
						count++;
					}
				}

				colourRow += colourGridWidth;
			}

			// check for survival
			if (*(colourGrid + y * colourGridWidth + x) == maxGenState) {
				count++;
			}

			countRow[x] = count + rowCount + rowCount2;
			x++;
		}

		countRow = saveRow + countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void nextGenerationCrossN(
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t* colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const uint32_t maxGenState
) {
	int32_t x, y, i, j, count, rowCount;

	// cross
	int32_t* countRow = counts + (bottomY - yrange) * countsWidth;
	int32_t nextRow = countsWidth - (rightX + xrange - (leftX - xrange) + 1);

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		int32_t *saveRow = countRow;

		x = leftX - xrange;

		// for the first cell count the entire neighborhood
		count = 0;
		rowCount = 0;
		uint8_t *colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
		uint8_t *colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

		for (j = 1; j <= yrange; j++) {
			if (*colourRow1 == maxGenState) {
				count++;
			}
			if (*colourRow2 == maxGenState) {
				count++;
			}
			colourRow1 += colourGridWidth;
			colourRow2 -= colourGridWidth;
		}

		colourRow1 = colourGrid + y * colourGridWidth + x;
		for (i = -xrange; i <= xrange; i++) {
			if (*(colourRow1 + i) == maxGenState) {
				rowCount++;
			}
		}
		countRow[x] = count + rowCount;
		x++;

		// for remaining rows subtract the left and right cells
		while (x <= rightX + xrange) {
			count = 0;
			colourRow1 = colourGrid + (y + 1) * colourGridWidth + x;
			colourRow2 = colourRow1 - colourGridWidth - colourGridWidth;

			for (j = 1; j <= yrange; j++) {
				if (*colourRow1 == maxGenState) {
					count++;
				}
				if (*colourRow2 == maxGenState) {
					count++;
				}
				colourRow1 += colourGridWidth;
				colourRow2 -= colourGridWidth;
			}

			colourRow1 = colourGrid + y * colourGridWidth + x;
			if (*(colourRow1 - xrange - 1) == maxGenState) {
				rowCount--;
			}
			if (*(colourRow1 + xrange) == maxGenState) {
				rowCount++;
			}
			countRow[x] = count + rowCount;
			x++;
		}

		countRow = saveRow + countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void clearTopAndLeft(
	int32_t *counts,
	const uint32_t countsWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t ry2,
	const int32_t rx2
) {
	// put zeros in top 2*range rows
	int32_t *countsRow = counts + bottomY * countsWidth;

	for (int32_t y = bottomY; y < bottomY + ry2; y++) {
		for (int32_t x = leftX; x <= rightX; x++) {
			*(countsRow + x) = 0;
		}
		countsRow += countsWidth;
	}

	// put zeros in left 2*range columns
	countsRow = counts + (bottomY + ry2) * countsWidth;

	for (int32_t y = bottomY + ry2; y <= topY; y++) {
		for (int32_t x = leftX; x <= leftX + rx2; x++) {
			*(countsRow + x) = 0;
		}
		countsRow += countsWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
void wrapTorusHROT(
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const uint32_t lx,
	const uint32_t by,
	const uint32_t rx,
	const uint32_t ty,
	const uint32_t xrange,
	const uint32_t yrange
) {
	// precompute useful values
	uint32_t rowSize = (rx - lx + 1);
	uint32_t extendedSize = (xrange + 1);
	uint32_t y;

	// copy the bottom rows to the top border
	for (y = 0; y < yrange; y++) {
		uint8_t *sourceRow = colourGrid + (by + y) * colourGridWidth + lx;
		uint8_t *destRow = colourGrid + (ty + y + 1) * colourGridWidth + lx;
		for (int i = 0; i < rowSize; i++) {
			destRow[i] = sourceRow[i];
		}
	}

	// copy the top rows to the bottom border
	for (y = 0; y < yrange; y++) {
		uint8_t *sourceRow = colourGrid + (ty - y) * colourGridWidth + lx;
		uint8_t *destRow = colourGrid + (by - y - 1) * colourGridWidth + lx;
		for (int i = 0; i < rowSize; i++) {
			destRow[i] = sourceRow[i];
		}
	}

	// copy the left columns to the right border and the right columns to the left border
	for (y = by; y <= ty; y++) {
		uint8_t *sourceRow = colourGrid + y * colourGridWidth;
		// copy left to right
		for (int i = 0; i < extendedSize; i++) {
			sourceRow[rx + 1 + i] = sourceRow[lx + i];
		}
		// copy right to left
		for (int i = 0; i < extendedSize; i++) {
			sourceRow[lx - xrange - 1 + i] = sourceRow[rx - xrange + i];
		}
	}

	// copy bottom left to top right and bottom right to top left
	for (y = 0; y < yrange; y++) {
		uint8_t *sourceRow = colourGrid + (by + y) * colourGridWidth;
		uint8_t *destRow = colourGrid + (ty + y + 1) * colourGridWidth;
		for (int i = 0; i < extendedSize; i++) {
			destRow[rx + 1 + i] = sourceRow[lx + i];
		}
		for (int i = 0; i < extendedSize; i++) {
			destRow[lx - xrange - 1 + i] = sourceRow[rx - xrange + i];
		}
	}

	// copy top left to bottom right and top right to bottom left
	for (y = 0; y < yrange; y++) {
		uint8_t *sourceRow = colourGrid + (ty - y) * colourGridWidth;
		uint8_t *destRow = colourGrid + (by - y - 1) * colourGridWidth;
		for (int i = 0; i < extendedSize; i++) {
			destRow[rx + 1 + i] = sourceRow[lx + i];
		}
		for (int i = 0; i < extendedSize; i++) {
			destRow[lx - xrange - 1 + i] = sourceRow[rx - xrange + i];
		}
	}
}


EMSCRIPTEN_KEEPALIVE
void clearHROTOutside(
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	const uint32_t lx,
	const uint32_t by,
	const uint32_t rx,
	const uint32_t ty,
	const uint32_t xrange,
	const uint32_t yrange
) {
	// clear the top border
	uint8_t *fromTop = colourGrid + (ty + 1) * colourGridWidth + lx;
	uint32_t amount = rx + 1 - lx;
	uint32_t nextRow = colourGridWidth - amount;

	for (uint32_t y = 0; y < yrange; y++) {
		for (uint32_t x = 0; x < amount; x++) {
			*fromTop++ = 0;
		}
		fromTop += nextRow;
	}

	// clear the bottom border
	uint8_t *fromBottom = colourGrid + (by - 1) * colourGridWidth + lx;
	nextRow = colourGridWidth + amount;

	for (uint32_t y = 0; y < yrange; y++) {
		for (uint32_t x = 0; x < amount; x++) {
			*fromBottom++ = 0;
		}
		fromBottom -=nextRow;
	}

	// clear the left and right columns
	uint8_t *leftChunk = colourGrid + rx + 1 + by * colourGridWidth;
	uint32_t leftAmount = (rx + xrange + 2) - (rx + 1);
	uint32_t nextLeftRow = colourGridWidth - leftAmount;

	uint8_t *rightChunk = colourGrid + lx - xrange - 1 + by * colourGridWidth;
	uint32_t rightAmount = lx - (lx - xrange - 1);
	uint32_t nextRightRow = colourGridWidth - rightAmount;

	for (uint32_t y = by; y <= ty; y++) {
		for (uint32_t x = 0; x < leftAmount; x++) {
			*leftChunk++ = 0;
		}
		for (uint32_t x = 0; x < rightAmount; x++) {
			*rightChunk++ = 0;
		}
		leftChunk += nextLeftRow;
		rightChunk += nextRightRow;
	}

	// clear top right border
	// and top left border
	leftChunk = colourGrid + (ty + 1) * colourGridWidth + rx + 1;
	leftAmount = (rx + xrange + 2) - (rx + 1);
	nextLeftRow = colourGridWidth - leftAmount;

	rightChunk = colourGrid + (ty + 1) * colourGridWidth + lx - xrange - 1;
	rightAmount = lx - (lx - xrange - 1);
	nextRightRow = colourGridWidth - rightAmount;

	for (uint32_t y = 0; y < yrange; y++) {
		for (uint32_t x = 0; x < leftAmount; x++) {
			*leftChunk++ = 0;
		}
		for (uint32_t x = 0; x < rightAmount; x++) {
			*rightChunk++ = 0;
		}
		leftChunk += nextLeftRow;
		rightChunk += nextRightRow;
	}

	// clear bottom right border
	// and bottom left border
	leftChunk = colourGrid + (by - 1) * colourGridWidth + rx + 1;
	leftAmount = (rx + xrange + 2) - (rx + 1);
	nextLeftRow = colourGridWidth + leftAmount;

	rightChunk = colourGrid + (by - 1) * colourGridWidth + lx - xrange - 1;
	rightAmount = lx - (lx - xrange - 1);
	nextRightRow = colourGridWidth + rightAmount;

	for (uint32_t y = 0; y < yrange; y++) {
		for (uint32_t x = 0; x < leftAmount; x++) {
			*leftChunk++ = 0;
		}
		for (uint32_t x = 0; x < rightAmount; x++) {
			*rightChunk++ = 0;
		}
		leftChunk -= nextLeftRow;
		rightChunk -= nextRightRow;
	}
};


// globals for getCount2L()
static int32_t g_ncols = 0;
static int32_t g_ccht = 0;
static int32_t g_halfccwd = 0;
static uint32_t g_countsWidth = 0;;
static int32_t *g_precalc = 0;
static int32_t *g_counts = 0;
static int32_t g_ncolsMinusCcht = 0;
static int32_t g_ncolsMinus1 = 0;
static int32_t g_cchtPlus1 = 0;
static int32_t g_cchtPlusHalfccwdPlus1 = 0;

EMSCRIPTEN_KEEPALIVE
static inline int32_t getCount2L(int32_t i, int32_t j, int32_t *countRow) {
	if (i < 0 || i + j < 0 || j - i >= g_ncols) {
		return 0;
	}

	if (j < 0 && i + j < g_ccht) {
		return *(g_counts + (i + j) * g_countsWidth);
	}

	//if (j >= g_ncols && j - i >= g_ncols - g_ccht) {
	if (j >= g_ncols && j - i >= g_ncolsMinusCcht) {
		//return *(g_counts + (i + g_ncols - 1 - j) * g_countsWidth + (g_ncols - 1));
		return *(g_counts + (i + g_ncolsMinus1 - j) * g_countsWidth + g_ncolsMinus1);
	}

	if (i < g_ccht) {
		return *(countRow + j);
	}

	if ((i - g_ccht + 1) + j <= g_halfccwd) {
		//return *(g_precalc + (i - g_ccht + 1 + j));
		return *(g_precalc + (i - g_cchtPlus1 + j));
	}

	if (j - (i - g_ccht + 1) >= g_halfccwd) {
		return *(g_precalc + (j - (i - g_cchtPlus1)));
	}

	//return *(g_precalc + (g_halfccwd + ((i + j + g_ccht + g_halfccwd + 1) & 1)));
	return *(g_precalc + (g_halfccwd + ((i + j + g_cchtPlusHalfccwdPlus1) & 1)));
}


EMSCRIPTEN_KEEPALIVE
// calculate next generation for Higher Range Outer Totalistic algo with 2-state von Neumann neighbourhood
void nextGenerationHROTVN2(
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *comboList,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t xrange,
	const uint32_t yrange,
	const uint32_t nrows,
	const uint32_t ncols,
	const uint32_t aliveStart,
	const uint32_t aliveMax,
	const uint32_t deadStart,
	const uint32_t deadMin,
	const uint32_t ccht,
	const uint32_t halfccwd,
	uint32_t *shared,
	uint32_t minX,
	uint32_t maxX,
	uint32_t minY,
	uint32_t maxY,
	uint32_t minX1,
	uint32_t maxX1,
	uint32_t minY1,
	uint32_t maxY1,
	uint32_t population,
	uint32_t births,
	uint32_t deaths
) {
	// set the globals used by getCount2L()
	g_ncols = ncols;
	g_ccht = ccht;
	g_halfccwd = halfccwd;
	g_countsWidth = countsWidth;
	g_precalc = counts + (ccht - 1) * countsWidth;
	g_counts = counts;
	g_ncolsMinusCcht = ncols - ccht;
	g_ncolsMinus1 = ncols - 1;
	g_cchtPlus1 = ccht + 1;
	g_cchtPlusHalfccwdPlus1 = ccht + halfccwd + 1;

	// calculate final neighborhood counts and update the corresponding cells in the grid
	for (uint32_t i = yrange; i <= nrows - yrange; i++) {
		const uint32_t im1 = i - 1;
		int32_t *countRowIm1 = counts + im1 * countsWidth;
		const uint32_t ipr = i + yrange;
		int32_t *countRowIpr = counts + ipr * countsWidth;
		const uint32_t iprm1 = ipr - 1;
		int32_t *countRowIprm1 = counts + iprm1 * countsWidth;
		const uint32_t imrm1 = i - yrange - 1;
		int32_t *countRowImrm1 = counts + imrm1 * countsWidth;
		const uint32_t imrm2 = imrm1 - 1;
		int32_t *countRowImrm2 = counts + imrm2 * countsWidth;
		const uint32_t ipminrow = i + bottomY;
		uint8_t *colourRow = colourGrid + ipminrow * colourGridWidth + leftX + xrange;
		uint16_t *colourTileRow = colourTileHistoryGrid + (ipminrow >> 4) * colourTileGridWidth;
		bool rowAlive = false;
		bool liveRowAlive = false;

		for (uint32_t j = xrange; j <= ncols - xrange; j++) {
			// get the neighbourhood count
			const uint32_t jpr = j + xrange;
			const uint32_t jmr = j - xrange;

			const int32_t count = getCount2L(ipr , j, countRowIpr)
				- getCount2L(im1 , jpr + 1, countRowIm1)
				- getCount2L(im1 , jmr - 1, countRowIm1)
				+ getCount2L(imrm2 , j, countRowImrm2)
				+ getCount2L(iprm1 , j, countRowIprm1)
				- getCount2L(im1 , jpr, countRowIm1)
				- getCount2L(im1 , jmr, countRowIm1)
				+ getCount2L(imrm1 , j, countRowImrm1);

			// get the current state
			uint32_t state = *colourRow;

			// update the state based on the rules
			if (state < aliveStart) {
				if (comboList[count] & 2) {
					// new cell is born
					state = aliveStart;
					births++;
				} else {
					// state is still dead
					if (state > deadMin) {
						state--;
					}
				}
			} else {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					deaths++;
					state = deadStart;
				} else {
					if (state < aliveMax) {
						state++;
					}
				}
			}

			// update the cell
			*colourRow = state;

			// check for occupied cells
			if (state > deadMin) {
				// update the bounding box
				uint32_t x = leftX + j;
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				rowAlive = true;

				// update the tile
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));

				// check for alive cells
				if (state >= aliveStart) {
					// update the population
					population++;
					liveRowAlive = true;

					// update the alive bounding box
					if (x < minX1) {
						minX1 = x;
					}
					if (x > maxX1) {
						maxX1 = x;
					}
				}
			}

			// next column
			colourRow++;
		}

		// update the bounding boxes
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

	// return data to JS
	shared[0] = minX;
	shared[1] = maxX;
	shared[2] = minY;
	shared[3] = maxY;
	shared[4] = minX1;
	shared[5] = maxX1;
	shared[6] = minY1;
	shared[7] = maxY1;
	shared[8] = population;
	shared[9] = births;
	shared[10] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// calculate next generation for Higher Range Outer Totalistic algo with 2-state von Neumann neighbourhood
void nextGenerationHROTVNN(
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *counts,
	const uint32_t countsWidth,
	uint8_t *comboList,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t xrange,
	const uint32_t yrange,
	const uint32_t nrows,
	const uint32_t ncols,
	const uint32_t deadState,
	const uint32_t minDeadState,
	const uint32_t maxGenState,
	const uint32_t ccht,
	const uint32_t halfccwd,
	uint32_t *shared,
	uint32_t minX,
	uint32_t maxX,
	uint32_t minY,
	uint32_t maxY,
	uint32_t minX1,
	uint32_t maxX1,
	uint32_t minY1,
	uint32_t maxY1,
	uint32_t population,
	uint32_t births,
	uint32_t deaths
) {
	// set the globals used by getCount2L()
	g_ncols = ncols;
	g_ccht = ccht;
	g_halfccwd = halfccwd;
	g_countsWidth = countsWidth;
	g_precalc = counts + (ccht - 1) * countsWidth;
	g_counts = counts;
	g_ncolsMinusCcht = ncols - ccht;
	g_ncolsMinus1 = ncols - 1;
	g_cchtPlus1 = ccht + 1;
	g_cchtPlusHalfccwdPlus1 = ccht + halfccwd + 1;

	// calculate final neighborhood counts and update the corresponding cells in the grid
	for (uint32_t i = yrange; i <= nrows - yrange; i++) {
		const uint32_t im1 = i - 1;
		int32_t *countRowIm1 = counts + im1 * countsWidth;
		const uint32_t ipr = i + yrange;
		int32_t *countRowIpr = counts + ipr * countsWidth;
		const uint32_t iprm1 = ipr - 1;
		int32_t *countRowIprm1 = counts + iprm1 * countsWidth;
		const uint32_t imrm1 = i - yrange - 1;
		int32_t *countRowImrm1 = counts + imrm1 * countsWidth;
		const uint32_t imrm2 = imrm1 - 1;
		int32_t *countRowImrm2 = counts + imrm2 * countsWidth;
		const uint32_t ipminrow = i + bottomY;
		uint8_t *colourRow = colourGrid + ipminrow * colourGridWidth + leftX + xrange;
		uint16_t *colourTileRow = colourTileHistoryGrid + (ipminrow >> 4) * colourTileGridWidth;
		bool rowAlive = false;
		bool liveRowAlive = false;

		for (uint32_t j = xrange; j <= ncols - xrange; j++) {
			const uint32_t jpr = j + xrange;
			const uint32_t jmr = j - xrange;

			const int32_t count = getCount2L(ipr , j, countRowIpr)
				- getCount2L(im1 , jpr + 1, countRowIm1)
				- getCount2L(im1 , jmr - 1, countRowIm1)
				+ getCount2L(imrm2 , j, countRowImrm2)
				+ getCount2L(iprm1 , j, countRowIprm1)
				- getCount2L(im1 , jpr, countRowIm1)
				- getCount2L(im1 , jmr, countRowIm1)
				+ getCount2L(imrm1 , j, countRowImrm1);

			const uint32_t jpmincol = j + leftX;
			uint32_t state = *colourRow;

			if (state <= deadState) {
				if (comboList[count] & 2) {
					// new cell is born
					state = maxGenState;
					births++;
				} else {
					if (state > minDeadState) {
						state--;
					}
				}
			} else if (state == maxGenState) {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell decays by one state
					state--;
					deaths++;
				}
			} else {
				// this cell will eventually die
				if (state > minDeadState) {
					state--;
				}
			}

			// update the cell
			*colourRow = state;

			if (state > 0) {
				colourTileRow[jpmincol >> 8] |= (1 << (~(jpmincol >> 4) & 15));
				if (jpmincol < minX) {
					minX = jpmincol;
				}
				if (jpmincol > maxX) {
					maxX = jpmincol;
				}

				rowAlive = true;
				if (state == maxGenState) {
					population++;
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

			// next column
			colourRow++;
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

	// return data to JS
	shared[0] = minX;
	shared[1] = maxX;
	shared[2] = minY;
	shared[3] = maxY;
	shared[4] = minX1;
	shared[5] = maxX1;
	shared[6] = minY1;
	shared[7] = maxY1;
	shared[8] = population;
	shared[9] = births;
	shared[10] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// update grid from counts for Higher Range Outer Totalistic algo with 2-states
void updateGridFromCounts2(
	uint8_t* colourGrid,
	const uint32_t colourGridWidth,
	uint16_t* colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t* counts,
	const uint32_t countsWidth,
	uint8_t *comboList,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t topY,
	const uint32_t rightX,
	const uint32_t xrange,
	const uint32_t yrange,
	const uint32_t aliveStart,
	const uint32_t aliveMax,
	const uint32_t deadStart,
	const uint32_t deadMin,
	uint32_t *shared,
	const uint32_t engineWidth,
	const uint32_t engineHeight
) {
	// setup bounding box
	uint32_t minX = engineWidth;
	uint32_t maxX = 0;
	uint32_t minY = engineHeight;
	uint32_t maxY = 0;
	uint32_t minX1 = minX;
	uint32_t maxX1 = maxX;
	uint32_t minY1 = minY;
	uint32_t maxY1 = maxY;

	// clear population
	uint32_t population = 0;
	uint32_t births = 0;
	uint32_t deaths = 0;

	const v128_t zero = wasm_u8x16_splat(0);				// zero
	const v128_t one = wasm_u8x16_splat(1);				// one
	const v128_t two = wasm_u8x16_splat(2);				// two
	const v128_t penBaseSet = wasm_u8x16_splat(64);			// base pen color for newly set cells
	const v128_t penMaxSet = wasm_u8x16_splat(127);			// maximum pen color for set cells after increment
	const v128_t penBaseClear = wasm_u8x16_splat(63);		// base pen color for newly cleared cells
	const v128_t penMinClear = wasm_u8x16_splat(1);			// minimum pen color for cleared cells after decrement
	const v128_t increment = wasm_u8x16_splat(1);			// increment/iecrement by 1

	// compute the rest of the grid
	const uint32_t alignedStart = (leftX - xrange + 15) & ~15;
	const uint32_t alignedEnd = (rightX + xrange) & ~15;

	uint32_t leftMost, rightMost;

	for (int32_t y = bottomY - yrange; y <= topY + yrange; y++) {
		uint8_t *colourRow = colourGrid + y * colourGridWidth;
		uint16_t *colourTileRow = colourTileHistoryGrid + (y >> 4) * colourTileGridWidth;
		int32_t *countRow = counts + y * countsWidth;

		bool rowOccupied = false;
		bool rowAlive = false;

		uint32_t x = leftX - xrange;

		while (x < alignedStart) {
			// get the next state
			uint8_t state = *(colourRow + x);

			// calculate the neighbourhood count
			int32_t count = *(countRow + x);

			if (state < aliveStart) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = aliveStart;
					births++;
				} else {
					// state is still dead
					if (state > deadMin) {
						state--;
					}
				}
			} else {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					deaths++;
					state = deadStart;
				} else {
					// state is still alive
					if (state < aliveMax) {
						state++;
					}
				}
			}

			// update the cell
			*(colourRow + x) = state;

			// update columns used if cell is alive
			if (state > deadMin) {
				rowOccupied = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				if (state >= aliveStart) {
					population++;
					rowAlive = true;
					if (x < minX1) {
						minX1 = x;
					}
					if (x > maxX1) {
						maxX1 = x;
					}
				}
			}

			x++;
		}

		while (x < alignedEnd) {
			// get the next four counts and lookup the births/survivals for each
			v128_t count4 = wasm_v128_load(countRow + x);
			uint8_t sb0 = comboList[wasm_i32x4_extract_lane(count4, 0)];
			uint8_t sb1 = comboList[wasm_i32x4_extract_lane(count4, 1)];
			uint8_t sb2 = comboList[wasm_i32x4_extract_lane(count4, 2)];
			uint8_t sb3 = comboList[wasm_i32x4_extract_lane(count4, 3)];

			// repeat for next 3 sets of four counts
			count4 = wasm_v128_load(countRow + x + 4);
			uint8_t sb4 = comboList[wasm_i32x4_extract_lane(count4, 0)];
			uint8_t sb5 = comboList[wasm_i32x4_extract_lane(count4, 1)];
			uint8_t sb6 = comboList[wasm_i32x4_extract_lane(count4, 2)];
			uint8_t sb7 = comboList[wasm_i32x4_extract_lane(count4, 3)];

			count4 = wasm_v128_load(countRow + x + 8);
			uint8_t sb8 = comboList[wasm_i32x4_extract_lane(count4, 0)];
			uint8_t sb9 = comboList[wasm_i32x4_extract_lane(count4, 1)];
			uint8_t sb10 = comboList[wasm_i32x4_extract_lane(count4, 2)];
			uint8_t sb11 = comboList[wasm_i32x4_extract_lane(count4, 3)];

			count4 = wasm_v128_load(countRow + x + 12);
			uint8_t sb12 = comboList[wasm_i32x4_extract_lane(count4, 0)];
			uint8_t sb13 = comboList[wasm_i32x4_extract_lane(count4, 1)];
			uint8_t sb14 = comboList[wasm_i32x4_extract_lane(count4, 2)];
			uint8_t sb15 = comboList[wasm_i32x4_extract_lane(count4, 3)];

			// get births and survivals for each cell
			v128_t birthsVec = wasm_u8x16_make(sb0, sb1, sb2, sb3, sb4, sb5, sb6, sb7, sb8, sb9, sb10, sb11, sb12, sb13, sb14, sb15);
			v128_t survivalsVec = wasm_v128_and(birthsVec, one);
			survivalsVec = wasm_i8x16_eq(survivalsVec, one);
			birthsVec = wasm_v128_and(birthsVec, two);
			birthsVec = wasm_i8x16_eq(birthsVec, two);

			// get the next 16 states and compute the next generation
			v128_t pens = wasm_v128_load(colourRow + x);

			// get which cells are alive in the previous generation (i.e. pen value >= 64)
			v128_t pensIfAlive = wasm_u8x16_ge(pens, penBaseSet);

			// get surviving cells (cells that were alive and survived)
			v128_t pensIfSurvived = wasm_v128_and(pensIfAlive, survivalsVec);

			// deaths is population count of alive cells that did not survive
			deaths += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(pensIfAlive, survivalsVec)));

			// get born cells (cells that were dead and were born)
			v128_t pensIfBorn = wasm_v128_andnot(birthsVec, pensIfAlive);

			// births is population count of bitmask of born cells
			births += __builtin_popcount(wasm_i8x16_bitmask(pensIfBorn));

			// merge surviving cells and births to get next generation alive/dead state
			v128_t cells = wasm_v128_or(pensIfSurvived, pensIfBorn);

			// now compute the actual states for the next generation
			// case 1: assume cells are alive
			//	pens < 64 become 64
			//	pens >= 64 increment to 127

			// increment the alive lanes and set dead lanes to 64
			v128_t pensAlive = wasm_v128_bitselect(wasm_u8x16_add_sat(pens, increment), penBaseSet, pensIfAlive);

			// ensure increment didn't go above the maximum value of 127
			pensAlive = wasm_u8x16_min(pensAlive, penMaxSet);

			// case 3: assume cells are dead
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
			wasm_v128_store(colourRow + x, pens);

			// update columns used if cells are occupied and/or cells are alive
			v128_t cellsOccupied = wasm_u8x16_ge(pens, penMinClear);
			v128_t cellsAlive = wasm_u8x16_ge(pens, penBaseSet);

			// update the population from the cells alive bitmask population count
			population += __builtin_popcount(wasm_i8x16_bitmask(cellsAlive));

			// check if any cells are occupied
			uint32_t aliveBits = wasm_i8x16_bitmask(cellsOccupied);
			if (aliveBits) {
				// mark the row as having occupied cells
				rowOccupied = true;

				// compute the left and right most occupied cell
				leftMost = 31 - __builtin_clz(aliveBits);
				rightMost = __builtin_ctz(aliveBits);

				// update the min and max X
				if (x + rightMost < minX) {
					minX = x + rightMost;
				}
				if (x + leftMost > maxX) {
					maxX = x + leftMost;
				}

				// check if any of the occupied cells are alive
				aliveBits = wasm_i8x16_bitmask(cellsAlive);
				if (aliveBits) {
					// update the tile
					colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));

					rowAlive = true;
					leftMost = 31 - __builtin_clz(aliveBits);
					rightMost = __builtin_ctz(aliveBits);

					if (x + rightMost < minX1) {
						minX1 = x + rightMost;
					}
					if (x + leftMost > maxX1) {
						maxX1 = x + leftMost;
					}
				}
			}

			x += 16;
		}

		while (x <= rightX + xrange) {
			// get the next state
			uint32_t state = *(colourRow + x);

			// calculate the neighbourhood count
			uint32_t count = *(countRow + x);

			if (state < aliveStart) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = aliveStart;
					births++;
				} else {
					// state is still dead
					if (state > deadMin) {
						state--;
					}
				}
			} else {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					deaths++;
					state = aliveStart - 1;
				} else {
					// state is still alive
					if (state < aliveMax) {
						state++;
					}
				}
			}

			// update the cell
			*(colourRow + x) = state;

			// update columns used if cell is alive
			if (state > deadMin) {
				rowOccupied = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				if (state >= aliveStart) {
					population++;
					if (x < minX1) {
						minX1 = x;
					}
					if (x > maxX1) {
						maxX1 = x;
					}
					rowAlive = true;
				}
			}

			x++;
		}

		// update bounding box y if a cell in the row was occupied
		if (rowOccupied) {
			if (y < minY) {
				minY = y;
			}
			if (y > maxY) {
				maxY = y;
			}

			// update bounding box y if a cell in the row was alive
			if (rowAlive) {
				if (y < minY1) {
					minY1 = y;
				}
				if (y > maxY1) {
					maxY1 = y;
				}
			}
		}
	}

	// return data to JS
	shared[0] = minX;
	shared[1] = maxX;
	shared[2] = minY;
	shared[3] = maxY;
	shared[4] = minX1;
	shared[5] = maxX1;
	shared[6] = minY1;
	shared[7] = maxY1;
	shared[8] = population;
	shared[9] = births;
	shared[10] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// update grid from counts for Higher Range Outer Totalistic algo with N-states
void updateGridFromCountsN(
	uint8_t* colourGrid,
	const uint32_t colourGridWidth,
	uint16_t* colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t* counts,
	const uint32_t countsWidth,
	uint8_t *comboList,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t topY,
	const uint32_t rightX,
	const uint32_t xrange,
	const uint32_t yrange,
	const uint32_t deadState,
	const uint32_t maxGenState,
	const uint32_t minDeadState,
	uint32_t *shared,
	const uint32_t engineWidth,
	const uint32_t engineHeight
) {
	// setup bounding box
	uint32_t minX = engineWidth;
	uint32_t maxX = 0;
	uint32_t minY = engineHeight;
	uint32_t maxY = 0;
	uint32_t minX1 = minX;
	uint32_t maxX1 = maxX;
	uint32_t minY1 = minY;
	uint32_t maxY1 = maxY;

	// clear population
	uint32_t population = 0;
	uint32_t births = 0;
	uint32_t deaths = 0;

	// compute the rest of the grid
	const uint32_t alignedStart = (leftX - xrange + 15) & ~15;
	const uint32_t alignedEnd = (rightX + xrange) & ~15;

	uint32_t leftMost, rightMost;

	const v128_t zeroVec = wasm_u8x16_splat(0);				// zero
	const v128_t oneVec = wasm_u8x16_splat(1);				// one
	const v128_t twoVec = wasm_u8x16_splat(2);				// two
	const v128_t deadStateVec = wasm_u8x16_splat(deadState);		// newly dead state
	const v128_t maxGenStateVec = wasm_u8x16_splat(maxGenState);	// state for alive cell
	const v128_t minDeadStateVec = wasm_u8x16_splat(minDeadState);	// minimum dead state
	const v128_t maskVec = wasm_u64x2_splat(0x0102040810204080);	// mask to isolate cell bits
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	for (int32_t y = bottomY - yrange; y <= topY + yrange; y++) {
		uint8_t *colourRow = colourGrid + y * colourGridWidth;
		uint16_t *colourTileRow = colourTileHistoryGrid + (y >> 4) * colourTileGridWidth;
		int32_t *countRow = counts + y * countsWidth;

		bool rowOccupied = false;
		bool rowAlive = false;

		uint32_t x = leftX - xrange;

		while (x < alignedStart) {
			// get the next state
			uint8_t state = *(colourRow + x);

			// calculate the neighbourhood count
			int32_t count = *(countRow + x);

			if (state <= deadState) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = maxGenState;
					births++;
				} else {
					// state is still dead
					if (state > minDeadState) {
						state--;
					}
				}
			} else if (state == maxGenState) {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					state--;
					deaths++;
				}
			} else {
				// state is still alive
				if (state > minDeadState) {
					state--;
				}
			}

			// update the cell
			*(colourRow + x) = state;

			// update columns used if cell is alive
			if (state > 0) {
				rowOccupied = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				if (state == maxGenState) {
					population++;
				}
				if (state > deadState) {
					rowAlive = true;
					if (x < minX1) {
						minX1 = x;
					}
					if (x > maxX1) {
						maxX1 = x;
					}
				}
			}

			x++;
		}

		while (x < alignedEnd) {
			// get neighbourhood counts, then births and survivals, for cells 0 to 3
			int32_t count0 = *(countRow + x);
			int32_t count1 = *(countRow + x + 1);
			int32_t count2 = *(countRow + x + 2);
			int32_t count3 = *(countRow + x + 3);

			uint8_t sb0 = comboList[count0];
			uint8_t sb1 = comboList[count1];
			uint8_t sb2 = comboList[count2];
			uint8_t sb3 = comboList[count3];

			// now for cells 4 to 7
			count0 = *(countRow + x + 4);
			count1 = *(countRow + x + 5);
			count2 = *(countRow + x + 6);
			count3 = *(countRow + x + 7);

			uint8_t sb4 = comboList[count0];
			uint8_t sb5 = comboList[count1];
			uint8_t sb6 = comboList[count2];
			uint8_t sb7 = comboList[count3];

			// now for cells 8 to 11 
			count0 = *(countRow + x + 8);
			count1 = *(countRow + x + 9);
			count2 = *(countRow + x + 10);
			count3 = *(countRow + x + 11);

			uint8_t sb8 = comboList[count0];
			uint8_t sb9 = comboList[count1];
			uint8_t sb10 = comboList[count2];
			uint8_t sb11 = comboList[count3];

			// finally cells 12 to 15
			count0 = *(countRow + x + 12);
			count1 = *(countRow + x + 13);
			count2 = *(countRow + x + 14);
			count3 = *(countRow + x + 15);

			uint8_t sb12 = comboList[count0];
			uint8_t sb13 = comboList[count1];
			uint8_t sb14 = comboList[count2];
			uint8_t sb15 = comboList[count3];

			// get births and survivals for each cell
			v128_t birthsVec = wasm_u8x16_make(sb0, sb1, sb2, sb3, sb4, sb5, sb6, sb7, sb8, sb9, sb10, sb11, sb12, sb13, sb14, sb15);
			v128_t survivalsVec = wasm_v128_and(birthsVec, oneVec);
			survivalsVec = wasm_i8x16_eq(survivalsVec, oneVec);
			birthsVec = wasm_v128_and(birthsVec, twoVec);
			birthsVec = wasm_i8x16_eq(birthsVec, twoVec);

			// get the next 16 states and compute the next generation
			v128_t colourVec = wasm_v128_load(colourRow + x);

			// get which cells are alive in the previous generation (i.e. pen value == maxGenState)
			v128_t pensIfAlive = wasm_i8x16_eq(colourVec, maxGenStateVec);

			// get surviving cells (cells that were alive and survived)
			v128_t pensIfSurvived = wasm_v128_and(pensIfAlive, survivalsVec);

			// get born cells (cells that were dead and were born)
			v128_t pensIfBorn = wasm_v128_andnot(birthsVec, pensIfAlive);

			// merge surviving cells and births to get next generation alive/dead state
			v128_t cells = wasm_v128_or(pensIfSurvived, pensIfBorn);

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
			births += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(setToAliveMask, pensIfAlive)));
			deaths += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(pensIfAlive, setToAliveMask)));

			// store updated cell colours
			wasm_v128_store(colourRow + x, newColourVec);

			// determine if any cells in the row are non-zero
			uint32_t occupiedBits = wasm_i8x16_bitmask(wasm_i8x16_gt(newColourVec, minDeadStateVec));
			if (occupiedBits) {
				rowOccupied = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));

				// compute the left and right most occupied cell
				uint32_t leftMost = 31 - __builtin_clz(occupiedBits);
				uint32_t rightMost = __builtin_ctz(occupiedBits);

				// update occupied bounding box
				if (x + rightMost < minX) {
					minX = x + rightMost;
				}
				if (x + leftMost > maxX) {
					maxX = x + leftMost;
				}

				// check if any cells in the row are alive
				uint32_t aliveBits = wasm_i8x16_bitmask(wasm_i8x16_gt(newColourVec, deadStateVec));
				if (aliveBits) {
					rowAlive = true;

					// compute the left and right most occupied cell
					uint32_t leftMost = 31 - __builtin_clz(aliveBits);
					uint32_t rightMost = __builtin_ctz(aliveBits);

					// update alive bounding box
					if (x + rightMost < minX1) {
						minX1 = x + rightMost;
					}
					if (x + leftMost > maxX1) {
						maxX1 = x + leftMost;
					}
				}
			}

			x += 16;
		}

		while (x <= rightX + xrange) {
			// get the next state
			uint32_t state = *(colourRow + x);

			// calculate the neighbourhood count
			uint32_t count = *(countRow + x);

			if (state <= deadState) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = maxGenState;
					births++;
				} else {
					// state is still dead
					if (state > minDeadState) {
						state--;
					}
				}
			} else if (state == maxGenState) {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					state--;
					deaths++;
				}
			} else {
				// state is still alive
				if (state > minDeadState) {
					state--;
				}
			}

			// update the cell
			*(colourRow + x) = state;

			// update columns used if cell is alive
			if (state > 0) {
				rowOccupied = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				if (state == maxGenState) {
					population++;
				}
				if (state > deadState) {
					if (x < minX1) {
						minX1 = x;
					}
					if (x > maxX1) {
						maxX1 = x;
					}
					rowAlive = true;
				}
			}

			x++;
		}

		// update bounding box y if a cell in the row was occupied
		if (rowOccupied) {
			if (y < minY) {
				minY = y;
			}
			if (y > maxY) {
				maxY = y;
			}

			// update bounding box y if a cell in the row was alive
			if (rowAlive) {
				if (y < minY1) {
					minY1 = y;
				}
				if (y > maxY1) {
					maxY1 = y;
				}
			}
		}
	}

	// return data to JS
	shared[0] = minX;
	shared[1] = maxX;
	shared[2] = minY;
	shared[3] = maxY;
	shared[4] = minX1;
	shared[5] = maxX1;
	shared[6] = minY1;
	shared[7] = maxY1;
	shared[8] = population;
	shared[9] = births;
	shared[10] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// calculate next generation for Higher Range Outer Totalistic algo with 2-state Moore neighbourhood
void nextGenerationHROTMoore2(
	uint8_t* colourGrid,
	const uint32_t colourGridWidth,
	uint16_t* colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t* counts,
	const uint32_t countsWidth,
	uint8_t *comboList,
	uint8_t* colUsed,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t topY,
	const uint32_t rightX,
	const uint32_t xrange,
	const uint32_t yrange,
	const uint32_t aliveStart,
	const uint32_t aliveMax,
	const uint32_t deadStart,
	const uint32_t deadMin,
	uint32_t *shared,
	uint32_t minY,
	uint32_t maxY,
	uint32_t minY1,
	uint32_t maxY1,
	uint32_t population,
	uint32_t births,
	uint32_t deaths
) {
	const uint32_t rxp1 = xrange + 1;
	const uint32_t ryp1 = yrange + 1;
	const uint32_t leftXp1 = leftX + 1;

	const v128_t zero = wasm_u8x16_splat(0);				// zero
	const v128_t one = wasm_u8x16_splat(1);				// one
	const v128_t two = wasm_u8x16_splat(2);				// two
	const v128_t penBaseSet = wasm_u8x16_splat(64);			// base pen color for newly set cells
	const v128_t penMaxSet = wasm_u8x16_splat(127);			// maximum pen color for set cells after increment
	const v128_t penBaseClear = wasm_u8x16_splat(63);		// base pen color for newly cleared cells
	const v128_t penMinClear = wasm_u8x16_splat(1);			// minimum pen color for cleared cells after decrement
	const v128_t increment = wasm_u8x16_splat(1);			// increment/iecrement by 1

	// compute the rest of the grid
	int32_t *countRowYpr = counts + (bottomY + 1 + yrange) * countsWidth;
	int32_t *countRowYmrp1 = counts + (bottomY + 1 - ryp1) * countsWidth;
	uint8_t *colourRow = colourGrid + (bottomY + 1) * colourGridWidth + leftXp1;
	const uint32_t colourRowOffset = colourGridWidth - (rightX - leftXp1 + 1);

	uint32_t alignedStart = (leftXp1 + 15) & ~15;
	uint32_t alignedEnd = rightX & ~15;

	for (uint32_t y = bottomY + 1; y <= topY; y++) {
		uint16_t *colourTileRow = colourTileHistoryGrid + (y >> 4) * colourTileGridWidth;
		uint32_t xpr = leftXp1 + xrange;
		uint32_t xmrp1 = leftXp1 - rxp1;
		bool rowAlive = false;
		bool liveRowAlive = false;

		uint32_t x = leftXp1;

		while (x < alignedStart) {
			// get the next state
			uint32_t state = *colourRow;

			// calculate the neighbourhood count
			uint32_t count = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];

			if (state < aliveStart) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = aliveStart;
					births++;
				} else {
					// state is still dead
					if (state > deadMin) {
						state--;
					}
				}
			} else {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					deaths++;
					state = deadStart;
				} else {
					// state is still alive
					if (state < aliveMax) {
						state++;
					}
				}
			}

			// update the cell
			*colourRow = state;

			// update columns used if cell is alive
			if (state > deadMin) {
				rowAlive = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				colUsed[x] |= 1;
				if (state >= aliveStart) {
					population++;
					liveRowAlive = true;
					colUsed[x] |= 2;
				}
			}

			// next column
			xpr++;
			xmrp1++;
			colourRow++;

			x++;
		}

		while (x < alignedEnd) {
			// load the next four cells of counts
			v128_t countYprXpr = wasm_v128_load(countRowYpr + xpr);
			v128_t countYmrp1Xmrp1 = wasm_v128_load(countRowYmrp1 + xmrp1);
			v128_t countYprXmrp1 = wasm_v128_load(countRowYpr + xmrp1);
			v128_t countYrmp1Xpr = wasm_v128_load(countRowYmrp1 + xpr);

			// compute the aggregate counts
			v128_t countVec = wasm_i32x4_add(countYprXpr, countYmrp1Xmrp1);
			countVec = wasm_i32x4_sub(countVec, countYprXmrp1);
			countVec = wasm_i32x4_sub(countVec, countYrmp1Xpr);

			// use each cell count to lookup the survival/birth
			const uint8_t sb0 = comboList[wasm_i32x4_extract_lane(countVec, 0)];
			const uint8_t sb1 = comboList[wasm_i32x4_extract_lane(countVec, 1)];
			const uint8_t sb2 = comboList[wasm_i32x4_extract_lane(countVec, 2)];
			const uint8_t sb3 = comboList[wasm_i32x4_extract_lane(countVec, 3)];

			xpr += 4;
			xmrp1 += 4;

			// repeat for the next 3 blocks of 4 cells
			countYprXpr = wasm_v128_load(countRowYpr + xpr);
			countYmrp1Xmrp1 = wasm_v128_load(countRowYmrp1 + xmrp1);
			countYprXmrp1 = wasm_v128_load(countRowYpr + xmrp1);
			countYrmp1Xpr = wasm_v128_load(countRowYmrp1 + xpr);

			countVec = wasm_i32x4_add(countYprXpr, countYmrp1Xmrp1);
			countVec = wasm_i32x4_sub(countVec, countYprXmrp1);
			countVec = wasm_i32x4_sub(countVec, countYrmp1Xpr);

			const uint8_t sb4 = comboList[wasm_i32x4_extract_lane(countVec, 0)];
			const uint8_t sb5 = comboList[wasm_i32x4_extract_lane(countVec, 1)];
			const uint8_t sb6 = comboList[wasm_i32x4_extract_lane(countVec, 2)];
			const uint8_t sb7 = comboList[wasm_i32x4_extract_lane(countVec, 3)];

			xpr += 4;
			xmrp1 += 4;

			countYprXpr = wasm_v128_load(countRowYpr + xpr);
			countYmrp1Xmrp1 = wasm_v128_load(countRowYmrp1 + xmrp1);
			countYprXmrp1 = wasm_v128_load(countRowYpr + xmrp1);
			countYrmp1Xpr = wasm_v128_load(countRowYmrp1 + xpr);

			countVec = wasm_i32x4_add(countYprXpr, countYmrp1Xmrp1);
			countVec = wasm_i32x4_sub(countVec, countYprXmrp1);
			countVec = wasm_i32x4_sub(countVec, countYrmp1Xpr);

			const uint8_t sb8 = comboList[wasm_i32x4_extract_lane(countVec, 0)];
			const uint8_t sb9 = comboList[wasm_i32x4_extract_lane(countVec, 1)];
			const uint8_t sb10 = comboList[wasm_i32x4_extract_lane(countVec, 2)];
			const uint8_t sb11 = comboList[wasm_i32x4_extract_lane(countVec, 3)];

			xpr += 4;
			xmrp1 += 4;

			countYprXpr = wasm_v128_load(countRowYpr + xpr);
			countYmrp1Xmrp1 = wasm_v128_load(countRowYmrp1 + xmrp1);
			countYprXmrp1 = wasm_v128_load(countRowYpr + xmrp1);
			countYrmp1Xpr = wasm_v128_load(countRowYmrp1 + xpr);

			countVec = wasm_i32x4_add(countYprXpr, countYmrp1Xmrp1);
			countVec = wasm_i32x4_sub(countVec, countYprXmrp1);
			countVec = wasm_i32x4_sub(countVec, countYrmp1Xpr);

			const uint8_t sb12 = comboList[wasm_i32x4_extract_lane(countVec, 0)];
			const uint8_t sb13 = comboList[wasm_i32x4_extract_lane(countVec, 1)];
			const uint8_t sb14 = comboList[wasm_i32x4_extract_lane(countVec, 2)];
			const uint8_t sb15 = comboList[wasm_i32x4_extract_lane(countVec, 3)];

			xpr += 4;
			xmrp1 += 4;

			// get births and survivals for each cell
			v128_t birthsVec = wasm_u8x16_make(sb0, sb1, sb2, sb3, sb4, sb5, sb6, sb7, sb8, sb9, sb10, sb11, sb12, sb13, sb14, sb15);
			v128_t survivalsVec = wasm_v128_and(birthsVec, one);
			survivalsVec = wasm_i8x16_eq(survivalsVec, one);
			birthsVec = wasm_v128_and(birthsVec, two);
			birthsVec = wasm_i8x16_eq(birthsVec, two);

			// get the next 16 states and compute the next generation
			v128_t pens = wasm_v128_load(colourRow);

			// get which cells are alive in the previous generation (i.e. pen value >= 64)
			v128_t pensIfAlive = wasm_u8x16_ge(pens, penBaseSet);

			// get surviving cells (cells that were alive and survived)
			v128_t pensIfSurvived = wasm_v128_and(pensIfAlive, survivalsVec);

			// deaths is population count of alive cells that did not survive
			deaths += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(pensIfAlive, survivalsVec)));

			// get born cells (cells that were dead and were born)
			v128_t pensIfBorn = wasm_v128_andnot(birthsVec, pensIfAlive);

			// births is population count of bitmask of born cells
			births += __builtin_popcount(wasm_i8x16_bitmask(pensIfBorn));

			// merge surviving cells and births to get next generation alive/dead state
			v128_t cells = wasm_v128_or(pensIfSurvived, pensIfBorn);

			// now compute the actual states for the next generation
			// case 1: assume cells are alive
			//	pens < 64 become 64
			//	pens >= 64 increment to 127

			// increment the alive lanes and set dead lanes to 64
			v128_t pensAlive = wasm_v128_bitselect(wasm_u8x16_add_sat(pens, increment), penBaseSet, pensIfAlive);

			// ensure increment didn't go above the maximum value of 127
			pensAlive = wasm_u8x16_min(pensAlive, penMaxSet);

			// case 3: assume cells are dead
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

			// update columns used if cells are occupied and/or cells are alive
			v128_t cellsOccupied = wasm_u8x16_ge(pens, penMinClear);
			v128_t cellsAlive = wasm_u8x16_ge(pens, penBaseSet);

			// update the population from the cells alive bitmask population count
			population += __builtin_popcount(wasm_i8x16_bitmask(cellsAlive));

			// load the next 16 column used flags
			v128_t columnsUsed = wasm_v128_load(colUsed + x);

			// create a mask with 1 for each occupied cell
			v128_t deadMinCols = wasm_v128_bitselect(one, zero, cellsOccupied);

			// create a mask with 2 for each alive cell
			v128_t aliveStartCols = wasm_v128_bitselect(two, zero, cellsAlive);

			// OR the masks into the columns used flags
			columnsUsed = wasm_v128_or(columnsUsed, deadMinCols);
			columnsUsed = wasm_v128_or(columnsUsed, aliveStartCols);

			// write the column flags
			wasm_v128_store(colUsed + x, columnsUsed);

			// set the tile flag if any cell are alive
			if (wasm_v128_any_true(cellsOccupied)) {
				rowAlive = true;
				if (wasm_v128_any_true(cellsAlive)) {
					colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
					liveRowAlive = true;
				}
			}


			// next column
			colourRow += 16;
			x += 16;
		}

		while (x <= rightX) {
			// get the next state
			uint32_t state = *colourRow;

			// calculate the neighbourhood count
			uint32_t count = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];

			if (state < aliveStart) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = aliveStart;
					births++;
				} else {
					// state is still dead
					if (state > deadMin) {
						state--;
					}
				}
			} else {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					deaths++;
					state = aliveStart - 1;
				} else {
					// state is still alive
					if (state < aliveMax) {
						state++;
					}
				}
			}

			// update the cell
			*colourRow = state;

			// update columns used if cell is alive
			if (state > deadMin) {
				rowAlive = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				colUsed[x] |= 1;
				if (state >= aliveStart) {
					population++;
					liveRowAlive = true;
					colUsed[x] |= 2;
				}
			}

			// next column
			xpr++;
			xmrp1++;
			colourRow++;

			x++;
		}

		// update bounding box y if a cell in the row was alive
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

		countRowYpr += countsWidth;
		countRowYmrp1 += countsWidth;
		colourRow += colourRowOffset;
	}

	// return data to JS
	shared[0] = minY;
	shared[1] = maxY;
	shared[2] = minY1;
	shared[3] = maxY1;
	shared[4] = population;
	shared[5] = births;
	shared[6] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// calculate next generation for Higher Range Outer Totalistic algo with N-state Moore neighbourhood
void nextGenerationHROTMooreN(
	uint8_t* colourGrid,
	const uint32_t colourGridWidth,
	uint16_t* colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t* counts,
	const uint32_t countsWidth,
	uint8_t *comboList,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t topY,
	const uint32_t rightX,
	const uint32_t xrange,
	const uint32_t yrange,
	const uint32_t deadState,
	const uint32_t minDeadState,
	const uint32_t maxGenState,
	uint32_t *shared,
	uint32_t minX,
	uint32_t maxX,
	uint32_t minY,
	uint32_t maxY,
	uint32_t minX1,
	uint32_t maxX1,
	uint32_t minY1,
	uint32_t maxY1,
	uint32_t population,
	uint32_t births,
	uint32_t deaths
) {
	const uint32_t rxp1 = xrange + 1;
	const uint32_t ryp1 = yrange + 1;
	const uint32_t leftXp1 = leftX + 1;

	const v128_t zeroVec = wasm_u8x16_splat(0);				// zero
	const v128_t oneVec = wasm_u8x16_splat(1);				// one
	const v128_t twoVec = wasm_u8x16_splat(2);				// two
	const v128_t deadStateVec = wasm_u8x16_splat(deadState);		// newly dead state
	const v128_t maxGenStateVec = wasm_u8x16_splat(maxGenState);	// state for alive cell
	const v128_t minDeadStateVec = wasm_u8x16_splat(minDeadState);	// minimum dead state
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	// compute the rest of the grid
	int32_t *countRowYpr = counts + (bottomY + 1 + yrange) * countsWidth;
	int32_t *countRowYmrp1 = counts + (bottomY + 1 - ryp1) * countsWidth;
	uint8_t *colourRow = colourGrid + (bottomY + 1) * colourGridWidth + leftXp1;
	const uint32_t colourRowOffset = colourGridWidth - (rightX - leftXp1 + 1);

	uint32_t alignedStart = (leftXp1 + 15) & ~15;
	uint32_t alignedEnd = rightX & ~15;

	for (uint32_t y = bottomY + 1; y <= topY; y++) {
		uint16_t *colourTileRow = colourTileHistoryGrid + (y >> 4) * colourTileGridWidth;
		uint32_t xpr = leftXp1 + xrange;
		uint32_t xmrp1 = leftXp1 - rxp1;
		bool rowAlive = false;
		bool liveRowAlive = false;

		uint32_t x = leftXp1;

		while (x < alignedStart) {
			// get the next state
			uint32_t state = *colourRow;

			// calculate the neighbourhood count
			uint32_t count = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];

			if (state <= deadState) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = maxGenState;
					births++;
				} else {
					// state is still dead
					if (state > minDeadState) {
						state--;
					}
				}
			} else if (state == maxGenState) {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					state--;
					deaths++;
				}
			} else {
				// this cell will eventually die
				if (state > minDeadState) {
					state--;
				}
			}

			// update the cell
			*colourRow = state;

			if (state > 0) {
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				rowAlive = true;
				if (state == maxGenState) {
					population++;
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

			// next column
			xpr++;
			xmrp1++;
			colourRow++;

			x++;
		}

		while (x < alignedEnd) {
			// get neighbourhood counts, then births and survivals, for cells 0 to 3
			uint32_t count0 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			uint32_t count1 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			uint32_t count2 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			uint32_t count3 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			uint8_t sb0 = comboList[count0];
			uint8_t sb1 = comboList[count1];
			uint8_t sb2 = comboList[count2];
			uint8_t sb3 = comboList[count3];

			// now for cells 4 to 7
			count0 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count1 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count2 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count3 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			uint8_t sb4 = comboList[count0];
			uint8_t sb5 = comboList[count1];
			uint8_t sb6 = comboList[count2];
			uint8_t sb7 = comboList[count3];

			// now for cells 8 to 11 
			count0 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count1 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count2 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count3 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			uint8_t sb8 = comboList[count0];
			uint8_t sb9 = comboList[count1];
			uint8_t sb10 = comboList[count2];
			uint8_t sb11 = comboList[count3];

			// finally cells 12 to 15
			count0 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count1 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count2 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			count3 = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];
			xpr++;
			xmrp1++;

			uint8_t sb12 = comboList[count0];
			uint8_t sb13 = comboList[count1];
			uint8_t sb14 = comboList[count2];
			uint8_t sb15 = comboList[count3];

			// get births and survivals for each cell
			v128_t birthsVec = wasm_u8x16_make(sb0, sb1, sb2, sb3, sb4, sb5, sb6, sb7, sb8, sb9, sb10, sb11, sb12, sb13, sb14, sb15);
			v128_t survivalsVec = wasm_v128_and(birthsVec, oneVec);
			survivalsVec = wasm_i8x16_eq(survivalsVec, oneVec);
			birthsVec = wasm_v128_and(birthsVec, twoVec);
			birthsVec = wasm_i8x16_eq(birthsVec, twoVec);

			// get the next 16 states and compute the next generation
			v128_t colourVec = wasm_v128_load(colourRow);

			// get which cells are alive in the previous generation (i.e. pen value == maxGenState)
			v128_t pensIfAlive = wasm_i8x16_eq(colourVec, maxGenStateVec);

			// get surviving cells (cells that were alive and survived)
			v128_t pensIfSurvived = wasm_v128_and(pensIfAlive, survivalsVec);

			// get born cells (cells that were dead and were born)
			v128_t pensIfBorn = wasm_v128_andnot(birthsVec, pensIfAlive);

			// merge surviving cells and births to get next generation alive/dead state
			v128_t cells = wasm_v128_or(pensIfSurvived, pensIfBorn);

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
			births += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(setToAliveMask, pensIfAlive)));
			deaths += __builtin_popcount(wasm_i8x16_bitmask(wasm_v128_andnot(pensIfAlive, setToAliveMask)));

			// store updated cell colours
			wasm_v128_store(colourRow, newColourVec);

			// determine if any cells in the row are non-zero
			uint32_t occupiedBits = wasm_i8x16_bitmask(wasm_i8x16_gt(newColourVec, minDeadStateVec));
			if (occupiedBits) {
				rowAlive = true;
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));

				// compute the left and right most occupied cell
				uint32_t leftMost = 31 - __builtin_clz(occupiedBits);
				uint32_t rightMost = __builtin_ctz(occupiedBits);

				// update occupied bounding box
				if (x + rightMost < minX) {
					minX = x + rightMost;
				}
				if (x + leftMost > maxX) {
					maxX = x + leftMost;
				}

				// check if any cells in the row are alive
				uint32_t aliveBits = wasm_i8x16_bitmask(wasm_i8x16_gt(newColourVec, deadStateVec));
				if (aliveBits) {
					liveRowAlive = true;

					// compute the left and right most occupied cell
					uint32_t leftMost = 31 - __builtin_clz(aliveBits);
					uint32_t rightMost = __builtin_ctz(aliveBits);

					// update alive bounding box
					if (x + rightMost < minX1) {
						minX1 = x + rightMost;
					}
					if (x + leftMost > maxX1) {
						maxX1 = x + leftMost;
					}
				}
			}

			// next column
			colourRow += 16;
			x += 16;
		}

		while (x <= rightX) {
			// get the next state
			uint32_t state = *colourRow;

			// calculate the neighbourhood count
			uint32_t count = countRowYpr[xpr] +
				countRowYmrp1[xmrp1] -
				countRowYpr[xmrp1] -
				countRowYmrp1[xpr];

			if (state <= deadState) {
				// this cell is dead
				if (comboList[count] & 2) {
					// new cell is born
					state = maxGenState;
					births++;
				} else {
					// state is still dead
					if (state > minDeadState) {
						state--;
					}
				}
			} else if (state == maxGenState) {
				// this cell is alive
				if ((comboList[count] & 1) == 0) {
					// cell dies
					state--;
					deaths++;
				}
			} else {
				// state is still alive
				if (state > minDeadState) {
					state--;
				}
			}

			// update the cell
			*colourRow = state;

			if (state > 0) {
				colourTileRow[x >> 8] |= (1 << (~(x >> 4) & 15));
				if (x < minX) {
					minX = x;
				}
				if (x > maxX) {
					maxX = x;
				}
				rowAlive = true;
				if (state == maxGenState) {
					population++;
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

			// next column
			xpr++;
			xmrp1++;
			colourRow++;

			x++;
		}

		// update bounding box y if a cell in the row was alive
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

		countRowYpr += countsWidth;
		countRowYmrp1 += countsWidth;
		colourRow += colourRowOffset;
	}

	// return data to JS
	shared[0] = minX;
	shared[1] = maxX;
	shared[2] = minY;
	shared[3] = maxY;
	shared[4] = minX1;
	shared[5] = maxX1;
	shared[6] = minY1;
	shared[7] = maxY1;
	shared[8] = population;
	shared[9] = births;
	shared[10] = deaths;
}


EMSCRIPTEN_KEEPALIVE
// cumulative counts for HROT Moore neighbourhood 2-state
void cumulativeMooreCounts2(
	int32_t *counts,
	uint8_t *colourGrid,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t aliveStart,
	const uint32_t countWidth,
	const uint32_t colourGridWidth
) {
	uint8_t *colourRow = colourGrid + bottom * colourGridWidth + left;
	int32_t *countRow = counts + bottom * countWidth + left;
	int32_t *prevCountRow = countRow - countWidth;

	const uint32_t nextColourRow = colourGridWidth - (right - left + 1);
	const uint32_t nextCountRow = countWidth - (right - left + 1);

	const uint32_t align16Left = left & ~15;
	const uint32_t align16Right = right & ~15;
	const uint32_t leftTarget = align16Left + 16 > align16Right ? align16Right : align16Left + 16;

	// alive cells
	const v128_t alive = wasm_u8x16_splat(aliveStart);

	// zero
	const v128_t zero = wasm_u8x16_splat(0);

	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t count = 0;

		uint32_t x = left;
		while (x < leftTarget) {
			if ((*colourRow) >= aliveStart) {
				count++;
			}
			*countRow = *prevCountRow + count;
			colourRow++;
			countRow++;
			prevCountRow++;
			x++;
		}

		while (x < align16Right) {
			// get the next 16 cells
			v128_t row = wasm_v128_load(colourRow);
			v128_t cellsAlive = wasm_u8x16_ge(row, alive);
			uint32_t mask = wasm_i8x16_bitmask(cellsAlive);
			if (mask) {
				for (uint32_t b = 0; b < 16; b++) {
					if (mask & (1 << b)) {
						count++;
					}
					*countRow = *prevCountRow + count;
					countRow++;
					prevCountRow++;
				}
			} else {
				// set the current chunk to the previous counts plus the current cumulative count
				const v128_t addCount = wasm_i32x4_splat(count);

				// set 1 of 4
				v128_t previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;

				// set 2 of 4
				previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;

				// set 3 of 4
				previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;

				// set 4 of 4
				previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;
			}

			// next chunk
			colourRow += 16;
			x += 16;
		}

		while (x <= right) {
			if ((*colourRow) >= aliveStart) {
				count++;
			}
			*countRow = *prevCountRow + count;
			colourRow++;
			countRow++;
			prevCountRow++;
			x++;
		}

		colourRow += nextColourRow;
		countRow += nextCountRow;
		prevCountRow += nextCountRow;
	}
}


EMSCRIPTEN_KEEPALIVE
// cumulative counts for HROT Moore neighbourhood N-state
void cumulativeMooreCountsN(
	int32_t *counts,
	uint8_t *colourGrid,
	const uint32_t bottom,
	const uint32_t left,
	const uint32_t top,
	const uint32_t right,
	const int32_t maxGenState,
	const uint32_t countWidth,
	const uint32_t colourGridWidth
) {
	uint8_t *colourRow = colourGrid + bottom * colourGridWidth + left;
	int32_t *countRow = counts + bottom * countWidth + left;
	int32_t *prevCountRow = countRow - countWidth;

	const uint32_t nextColourRow = colourGridWidth - (right - left + 1);
	const uint32_t nextCountRow = countWidth - (right - left + 1);

	const uint32_t align16Left = left & ~15;
	const uint32_t align16Right = right & ~15;
	const uint32_t leftTarget = align16Left + 16 > align16Right ? align16Right : align16Left + 16;

	// alive cells
	const v128_t alive = wasm_u8x16_splat(maxGenState);

	for (uint32_t y = bottom; y <= top; y++) {
		uint32_t count = 0;

		uint32_t x = left;
		while (x < leftTarget) {
			if ((*colourRow) == maxGenState) {
				count++;
			}
			*countRow = *prevCountRow + count;
			colourRow++;
			countRow++;
			prevCountRow++;
			x++;
		}

		while (x < align16Right) {
			// get the next 16 cells
			v128_t row = wasm_v128_load(colourRow);
			v128_t cellsAlive = wasm_i8x16_eq(row, alive);
			const uint32_t mask = wasm_i8x16_bitmask(cellsAlive);
			if (mask) {
				for (int32_t b = 0; b < 16; b++) {
					if (mask & (1 << b)) {
						count++;
					}
					*countRow = *prevCountRow + count;
					countRow++;
					prevCountRow++;
				}
			} else {
				// set the current chunk to the previous counts plus the current cumulative count
				const v128_t addCount = wasm_i32x4_splat(count);

				// set 1 of 4
				v128_t previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;

				// set 2 of 4
				previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;

				// set 3 of 4
				previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;

				// set 4 of 4
				previousCounts = wasm_v128_load(prevCountRow);
				previousCounts = wasm_i32x4_add(previousCounts, addCount);
				wasm_v128_store(countRow, previousCounts);
				countRow += 4;
				prevCountRow += 4;
			}

			// next chunk
			colourRow += 16;
			x += 16;
		}

		while (x <= right) {
			if ((*colourRow) == maxGenState) {
				count++;
			}
			*countRow = *prevCountRow + count;
			colourRow++;
			countRow++;
			prevCountRow++;
			x++;
		}

		colourRow += nextColourRow;
		countRow += nextCountRow;
		prevCountRow += nextCountRow;
	}
}


EMSCRIPTEN_KEEPALIVE
//int32_t getCount2(int32_t i, int32_t j, int32_t *counts, uint32_t countWidth, int32_t *countRow, int32_t ncols, int32_t ccht, int32_t halfccwd, int32_t *precalc) {
static inline int32_t getCount2(int32_t i, int32_t j, int32_t *countRow) {
	if (j < 0 && i + j < g_ccht) {
		return *(g_counts + (i + j) * g_countsWidth);
	}

	if (j >= g_ncols && j - i >= g_ncols - g_ccht) {
		return *(g_counts + (i + g_ncols - 1 - j) * g_countsWidth + (g_ncols - 1));
	}

	if (i < g_ccht) {
		return *(countRow + j);
	}

	if ((i - g_ccht + 1) + j <= g_halfccwd) {
		return *(g_precalc + (i - g_ccht + 1 + j));
	}

	if (j - (i - g_ccht + 1) >= g_halfccwd) {
		return *(g_precalc + (j - (i - g_ccht + 1)));
	}

	return *(g_precalc + (g_halfccwd + ((i + j + g_ccht + g_halfccwd + 1) & 1)));
}


EMSCRIPTEN_KEEPALIVE
// cumulative counts for HROT von Neumann neighbourhood 2-state
void cumulativeVNCounts2(
	const uint32_t ccht,
	const int32_t ncols,
	const int32_t nrows,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t aliveStart,
	const int32_t halfccwd,
	int32_t *counts,
	uint8_t *colourGrid,
	const uint32_t countsWidth,
	const uint32_t colourGridWidth
) {
	// set the globals used by getCount2()
	g_precalc = counts + (ccht - 1) * countsWidth;
	g_ncols = ncols;
	g_ccht = ccht;
	g_halfccwd = halfccwd;
	g_counts = counts;
	g_countsWidth = countsWidth;

	for (int32_t i = 0; i < ccht; i++) {
		int32_t *countRow = counts + i * countsWidth;
		uint8_t *colourRow = colourGrid + (i + bottomY) * colourGridWidth + leftX;
		const int32_t im1 = i - 1;
		const int32_t im2 = im1 - 1;
		int32_t *countRowIm1 = countRow - countsWidth;
		int32_t *countRowIm2 = countRowIm1 - countsWidth;

		for (int32_t j = 0; j <= ncols; j++) {
			const int32_t count1 = (im1 < 0 || im1 + j - 1 < 0 || j - 1 - im1 >= ncols) ? 0 : getCount2(im1, j - 1, countRowIm1);
			const int32_t count2 = (im1 < 0 || im1 + j + 1 < 0 || j + 1 - im1 >= ncols) ? 0 : getCount2(im1, j + 1, countRowIm1);
			const int32_t count3 = (im2 < 0 || im2 + j < 0 || j - im2 >= ncols) ? 0 : getCount2(im2, j, countRowIm2);

			*countRow = count1 + count2 - count3;

			if (i < nrows && (colourRow[j] >= aliveStart)) {
				*countRow += 1;
			}

			countRow++;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
// cumulative counts for HROT von Neumann neighbourhood N-state
void cumulativeVNCountsN(
	const uint32_t ccht,
	const int32_t ncols,
	const int32_t nrows,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t maxGridState,
	const int32_t halfccwd,
	int32_t *counts,
	uint8_t *colourGrid,
	const uint32_t countsWidth,
	const uint32_t colourGridWidth
) {
	// set the globals used by getCount2()
	g_precalc = counts + (ccht - 1) * countsWidth;
	g_ncols = ncols;
	g_ccht = ccht;
	g_halfccwd = halfccwd;
	g_counts = counts;
	g_countsWidth = countsWidth;

	for (int32_t i = 0; i < ccht; i++) {
		int32_t *countRow = counts + i * countsWidth;
		uint8_t *colourRow = colourGrid + (i + bottomY) * colourGridWidth + leftX;
		const int32_t im1 = i - 1;
		const int32_t im2 = im1 - 1;
		int32_t *countRowIm1 = countRow - countsWidth;
		int32_t *countRowIm2 = countRowIm1 - countsWidth;

		for (int32_t j = 0; j <= ncols; j++) {
			const int32_t count1 = (im1 < 0 || im1 + j - 1 < 0 || j - 1 - im1 >= ncols) ? 0 : getCount2(im1, j - 1, countRowIm1);
			const int32_t count2 = (im1 < 0 || im1 + j + 1 < 0 || j + 1 - im1 >= ncols) ? 0 : getCount2(im1, j + 1, countRowIm1);
			const int32_t count3 = (im2 < 0 || im2 + j < 0 || j - im2 >= ncols) ? 0 : getCount2(im2, j, countRowIm2);

			*countRow = count1 + count2 - count3;

			if (i < nrows && (colourRow[j] == maxGridState)) {
				*countRow += 1;
			}

			countRow++;
		}
	}
}


EMSCRIPTEN_KEEPALIVE
// update cell occupancy for rotor and stator calculation
void updateOccupancyStrict(
	uint8_t* colourGrid,
	uint16_t* frames,
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
	const uint32_t align16Left = left & ~15;
	const uint32_t align16Right = right & ~15;
	const uint32_t leftDelta = left - align16Left;

	// compute the first target (either the start of a 16 byte run or if smaller the right)
	const uint32_t leftTarget = align16Left + 16 > align16Right ? align16Right : align16Left + 16;

	for (uint32_t y = bottom; y <= top; y++) {
		// find the start of the row for this generation frame
		uint16_t *frameRow = frames + rowOffset;

		// process the left section
		uint32_t frameBits = 0;
		uint32_t x = left;
		uint32_t bit = bitStart;

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
		while (x <= align16Right) {
			// get the next 16 cells
			v128_t row = wasm_v128_load(colourRow);
			row = wasm_u8x16_ge(row, alive);
			row = wasm_i8x16_swizzle(row, reverse);
			const uint32_t mask = wasm_i8x16_bitmask(row);

			// merge the frame mask with the last one
			const uint32_t writeMask = frameBits | (mask >> (16 - leftDelta));
			*frameRow = writeMask;
			frameRow++;

			frameBits = mask << leftDelta;
			x += 16;
			colourRow += 16;
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
	uint8_t* colourGrid,
	uint32_t* counts,
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
	const uint32_t align16Left = left & ~15;
	const uint32_t align16Right = right & ~15;
	const uint32_t rightDelta = (align16Right + 15) - right;

	// compute the first target (either the start of a 16 byte run or if smaller the right)
	const uint32_t leftTarget = align16Left + 16 > align16Right ? align16Right : align16Left + 16;

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
		while (x <= align16Right) {
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

		// adjust for the final 16 cell chunk actual size
		counts -= rightDelta;
	}
}


EMSCRIPTEN_KEEPALIVE
// create a hash from the colour grid for two state algo
uint32_t getHashTwoState(
	uint8_t* colourGrid,
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
	uint8_t* colourRow = colourGrid + bottom * colourGridWidth + align16Left;

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
	uint8_t* colourGrid,
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

	// state 6 cells

	// align left to 16 bytes
	// we can read bytes to the left or right of the box since none of them will be alive so won't change the hash value
	const uint32_t align16Left = left & ~15;

	// get the starting offset in the colour grid
	uint8_t* colourRow = colourGrid + bottom * colourGridWidth + align16Left;

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
	uint8_t* colourGrid,
	uint8_t* overlayGrid,
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
	uint8_t* colourRow = colourGrid + bottom * colourGridWidth + align16Left;
	uint8_t* overlayRow = overlayGrid + bottom * colourGridWidth + align16Left;

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
			ov6Row = wasm_i8x16_eq(row, ov6Row);

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
	uint8_t* colourGrid,
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
	uint8_t* colourRow = colourGrid + bottom * colourGridWidth + align16Left;

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
	uint8_t* colourGrid,
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
	uint8_t* colourRow = colourGrid + bottom * colourGridWidth + align16Left;

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


EMSCRIPTEN_KEEPALIVE
// create the 2x2 colour grid by finding the maximum pixel value in each 2x2 block
void create2x2ColourGrid(
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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
	uint32_t bottomY = 0, topY = tileY;

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

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 4x4 colour grid
void create4x4ColourGrid(
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 32x32 colour grid
void create32x32ColourGrid(
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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
	uint32_t bottomY = 0, topY = tileY;

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

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 4x4 colour grid
void create4x4ColourGridSuper(
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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

		bottomY += tileY;
		topY += tileY;
		tileRowOffset += tileGridWidth;
	}
}


EMSCRIPTEN_KEEPALIVE
// create 32x32 colour grid
void create32x32ColourGridSuper(
	uint32_t *colourGrid,
	uint32_t *smallColourGrid,
	uint16_t *tileGrid,
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

					// case 3: assume cells are dead
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
						if (currentX + rightMost < newLeftX) {
							newLeftX = currentX + rightMost;
						}
						if (currentX + leftMost > newRightX) {
							newRightX = currentX + leftMost;
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

			leftX += 16;
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
// render the grid with no clipping or rotation (single layer)
void renderGridNoClipNoRotate(
	uint8_t* grid,
	const uint32_t mask,
	const uint32_t* pixelColours,
	uint32_t* data32,
	const uint32_t displayWidth,
	const uint32_t displayHeight,
	const double camXOff,
	const double camYOff,
	const uint32_t widthMask,
	const uint32_t heightMask,
	const uint32_t gridWidth,
	const double camZoom,
	uint16_t* xOffsets
) {
	const uint32_t w8 = displayWidth >> 3;	// display width in 8 pixel chunks
	const double dyy = 1.0f / camZoom;
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
		uint8_t* gridRow = grid + ((uint32_t)sy & hm) * gridWidth;

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
	uint8_t* grid,
	const uint32_t mask,
	const uint32_t* pixelColours,
	uint32_t* data32,
	const uint32_t displayWidth,
	const uint32_t displayHeight,
	const double camXOff,
	const double camYOff,
	const uint32_t widthMask,
	const uint32_t heightMask,
	const uint32_t gridWidth,
	const double camZoom,
	const uint32_t maxGridSize,
	uint32_t xg,
	uint32_t yg,
	const uint32_t offMaxGrid,
	int32_t *xOffsets,
	int32_t *xMaxOffsets
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
		int32_t xi = (int32_t)x;
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
		int32_t xi = (int32_t)x;
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
		int32_t yi = (int32_t)sy;

		// check the row is on the grid
		if (yi >= 0 && ((yi & ht) == (yi & hm))) {
			uint8_t* gridRow = grid + (yi & hm) * gridWidth;

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
	uint8_t* grid,
	const uint32_t gridWidth,
	uint8_t* overlayGrid,
	const uint32_t mask,
	const uint32_t* pixelColours,
	uint32_t* data32,
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
	uint16_t* xOffsets
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
		uint8_t* gridRow = grid + ((uint32_t)sy & hm) * gridWidth;
		uint8_t* overlayRow = overlayGrid + ((uint32_t)sy & hm) * gridWidth;

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
	uint8_t* grid,
	const uint32_t gridWidth,
	uint8_t* overlayGrid,
	const uint32_t mask,
	const uint32_t* pixelColours,
	uint32_t* data32,
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
	int32_t *xOffsets,
	int32_t *xMaxOffsets
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
		int32_t xi = (int32_t)x;
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
		int32_t xi = (int32_t)x;
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
		int32_t yi = (int32_t)sy;

		// check the row is on the grid
		if (yi >= 0 && ((yi & ht) == (yi & hm))) {
			uint8_t* gridRow = grid + (yi & hm) * gridWidth;
			uint8_t* overlayRow = overlayGrid + (yi & hm) * gridWidth;

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
