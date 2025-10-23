// LifeViewer WebAssembly functions
// Faster versions of LifeViewer functions implemented using WebAssembly SIMD Intrinstics
// See: https://emscripten.org/docs/porting/simd.html#webassembly-simd-intrinsics
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
//
// TODO:
//	handle negative counts from Weighted Grid in updateGridFromCounts2/N

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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int16_t *const neighbourList,
	const int32_t neighbourLength,
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
	const int8_t *weightedNeighbourhood,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t topY,
	const int32_t rightX,
	const int32_t range,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int8_t *const weightedNeighbourhood,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int8_t *const weightedNeighbourhood,
	const uint32_t weightedNeighbourhoodLength,
	const uint8_t *const weightedStates,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const uint32_t *const widths,
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
				if (*(colourRow + i + 1) >= aliveStart) {
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t aliveStart
) {
	int32_t x, y, j, count;

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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int16_t *neighbourList,
	const int32_t neighbourLength,
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
	const int8_t *weightedNeighbourhood,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t topY,
	const int32_t rightX,
	const int32_t range,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int8_t *weightedNeighbourhood,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int8_t *weightedNeighbourhood,
	const uint32_t weightedNeighbourhoodLength,
	const uint8_t *weightedStates,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const uint32_t *widths,
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
				if (*(colourRow + i + 1) == maxGenState) {
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	const int32_t bottomY,
	const int32_t topY,
	const int32_t leftX,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const int32_t maxGenState
) {
	int32_t x, y, j, count;

	// saltire
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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

	// hash
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

	for (y = bottomY - yrange; y <= topY + yrange; y++) {
		int32_t *saveRow = countRow;

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
	int32_t *const counts,
	const uint32_t countsWidth,
	uint8_t *const colourGrid,
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
	int32_t *countRow = counts + (bottomY - yrange) * countsWidth;

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
	int32_t *const counts,
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
	uint8_t *const colourGrid,
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
		for (uint32_t i = 0; i < rowSize; i++) {
			destRow[i] = sourceRow[i];
		}
	}

	// copy the top rows to the bottom border
	for (y = 0; y < yrange; y++) {
		uint8_t *sourceRow = colourGrid + (ty - y) * colourGridWidth + lx;
		uint8_t *destRow = colourGrid + (by - y - 1) * colourGridWidth + lx;
		for (uint32_t i = 0; i < rowSize; i++) {
			destRow[i] = sourceRow[i];
		}
	}

	// copy the left columns to the right border and the right columns to the left border
	for (y = by; y <= ty; y++) {
		uint8_t *sourceRow = colourGrid + y * colourGridWidth;
		// copy left to right
		for (uint32_t i = 0; i < extendedSize; i++) {
			sourceRow[rx + 1 + i] = sourceRow[lx + i];
		}
		// copy right to left
		for (uint32_t i = 0; i < extendedSize; i++) {
			sourceRow[lx - xrange - 1 + i] = sourceRow[rx - xrange + i];
		}
	}

	// copy bottom left to top right and bottom right to top left
	for (y = 0; y < yrange; y++) {
		uint8_t *sourceRow = colourGrid + (by + y) * colourGridWidth;
		uint8_t *destRow = colourGrid + (ty + y + 1) * colourGridWidth;
		for (uint32_t i = 0; i < extendedSize; i++) {
			destRow[rx + 1 + i] = sourceRow[lx + i];
		}
		for (uint32_t i = 0; i < extendedSize; i++) {
			destRow[lx - xrange - 1 + i] = sourceRow[rx - xrange + i];
		}
	}

	// copy top left to bottom right and top right to bottom left
	for (y = 0; y < yrange; y++) {
		uint8_t *sourceRow = colourGrid + (ty - y) * colourGridWidth;
		uint8_t *destRow = colourGrid + (by - y - 1) * colourGridWidth;
		for (uint32_t i = 0; i < extendedSize; i++) {
			destRow[rx + 1 + i] = sourceRow[lx + i];
		}
		for (uint32_t i = 0; i < extendedSize; i++) {
			destRow[lx - xrange - 1 + i] = sourceRow[rx - xrange + i];
		}
	}
}


EMSCRIPTEN_KEEPALIVE
void clearHROTOutside(
	uint8_t *const colourGrid,
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
static inline int32_t getCount2L(int32_t i, int32_t j, int32_t *const countRow) {
	if (i < 0 || i + j < 0 || j - i >= g_ncols) {
		return 0;
	}

	if (j < 0 && i + j < g_ccht) {
		return *(g_counts + (i + j) * g_countsWidth);
	}

	//if (j >= g_ncols && j - i >= g_ncols - g_ccht) {
	if (j >= g_ncols && j - i >= g_ncolsMinusCcht) {
		return *(g_counts + (i + g_ncolsMinus1 - j) * g_countsWidth + g_ncolsMinus1);
	}

	if (i < g_ccht) {
		return *(countRow + j);
	}

	if ((i - g_ccht + 1) + j <= g_halfccwd) {
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
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *const counts,
	const uint32_t countsWidth,
	const uint8_t *const comboList,
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
	uint32_t *const shared,
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
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *const counts,
	const uint32_t countsWidth,
	const uint8_t *const comboList,
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
	uint32_t *const shared,
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

			if (state > minDeadState) {
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
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *const counts,
	const uint32_t countsWidth,
	const uint8_t *const comboList,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t topY,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const uint32_t aliveStart,
	const uint32_t aliveMax,
	const uint32_t deadStart,
	const uint32_t deadMin,
	uint32_t *const shared,
	const uint32_t engineWidth,
	const uint32_t engineHeight
) {
	// setup bounding box
	int32_t minX = engineWidth;
	int32_t maxX = 0;
	int32_t minY = engineHeight;
	int32_t maxY = 0;
	int32_t minX1 = minX;
	int32_t maxX1 = maxX;
	int32_t minY1 = minY;
	int32_t maxY1 = maxY;

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
	const v128_t increment = wasm_u8x16_splat(1);			// increment/decrement by 1

	// compute the rest of the grid
	int32_t alignedStart = (leftX - xrange + 15) & ~15;
	const int32_t alignedEnd = (rightX + xrange) & ~15;
	if (alignedStart > rightX + xrange) {
		alignedStart = rightX + xrange + 1;
	}

	int32_t leftMost, rightMost;

	for (int32_t y = bottomY - yrange; y <= topY + yrange; y++) {
		uint8_t *colourRow = colourGrid + y * colourGridWidth;
		uint16_t *colourTileRow = colourTileHistoryGrid + (y >> 4) * colourTileGridWidth;
		int32_t *countRow = counts + y * countsWidth;

		bool rowOccupied = false;
		bool rowAlive = false;

		int32_t x = leftX - xrange;

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
			v128_t pensAlive = wasm_v128_bitselect(wasm_i8x16_add(pens, increment), penBaseSet, pensIfAlive);

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
			v128_t cellsOccupied = wasm_u8x16_gt(pens, penMinClear);
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
	uint8_t *colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *const counts,
	const uint32_t countsWidth,
	const uint8_t *const comboList,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t topY,
	const int32_t rightX,
	const int32_t xrange,
	const int32_t yrange,
	const uint32_t deadState,
	const uint32_t maxGenState,
	const uint32_t minDeadState,
	uint32_t *const shared,
	const uint32_t engineWidth,
	const uint32_t engineHeight
) {
	// setup bounding box
	int32_t minX = engineWidth;
	int32_t maxX = 0;
	int32_t minY = engineHeight;
	int32_t maxY = 0;
	int32_t minX1 = minX;
	int32_t maxX1 = maxX;
	int32_t minY1 = minY;
	int32_t maxY1 = maxY;

	// clear population
	uint32_t population = 0;
	uint32_t births = 0;
	uint32_t deaths = 0;

	// compute the rest of the grid
	int32_t alignedStart = (leftX - xrange + 15) & ~15;
	const int32_t alignedEnd = (rightX + xrange) & ~15;
	if (alignedStart > rightX + xrange) {
		alignedStart = rightX + xrange + 1;
	}

	const v128_t oneVec = wasm_u8x16_splat(1);				// one
	const v128_t twoVec = wasm_u8x16_splat(2);				// two
	const v128_t deadStateVec = wasm_u8x16_splat(deadState);		// newly dead state
	const v128_t maxGenStateVec = wasm_u8x16_splat(maxGenState);	// state for alive cell
	const v128_t minDeadStateVec = wasm_u8x16_splat(minDeadState);	// minimum dead state
	const v128_t reverseVec = wasm_u8x16_make(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);

	for (int32_t y = bottomY - yrange; y <= topY + yrange; y++) {
		uint8_t *colourRow = colourGrid + y * colourGridWidth;
		uint16_t *colourTileRow = colourTileHistoryGrid + (y >> 4) * colourTileGridWidth;
		int32_t *countRow = counts + y * countsWidth;

		bool rowOccupied = false;
		bool rowAlive = false;

		int32_t x = leftX - xrange;

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
			if (state > minDeadState) {
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
				int32_t leftMost = 31 - __builtin_clz(occupiedBits);
				int32_t rightMost = __builtin_ctz(occupiedBits);

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
					int32_t leftMost = 31 - __builtin_clz(aliveBits);
					int32_t rightMost = __builtin_ctz(aliveBits);

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
			if (state > minDeadState) {
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
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *const counts,
	const uint32_t countsWidth,
	const uint8_t *const comboList,
	uint8_t *const colUsed,
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
	uint32_t *const shared,
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
	const v128_t increment = wasm_u8x16_splat(1);			// increment/decrement by 1

	// compute the rest of the grid
	int32_t *countRowYpr = counts + (bottomY + 1 + yrange) * countsWidth;
	int32_t *countRowYmrp1 = counts + (bottomY + 1 - ryp1) * countsWidth;
	uint8_t *colourRow = colourGrid + (bottomY + 1) * colourGridWidth + leftXp1;
	const uint32_t colourRowOffset = colourGridWidth - (rightX - leftXp1 + 1);

	uint32_t alignedStart = (leftXp1 + 15) & ~15;
	const uint32_t alignedEnd = rightX & ~15;
	if (alignedStart > rightX) {
		alignedStart = rightX + 1;
	}

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
			v128_t pensAlive = wasm_v128_bitselect(wasm_i8x16_add(pens, increment), penBaseSet, pensIfAlive);

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
			v128_t cellsOccupied = wasm_u8x16_gt(pens, penMinClear);
			v128_t cellsAlive = wasm_u8x16_ge(pens, penBaseSet);

			// update the population from the cells alive bitmask population count
			population += __builtin_popcount(wasm_i8x16_bitmask(cellsAlive));

			// load the next 16 column used flags
			v128_t columnsUsed = wasm_v128_load(colUsed + x);

			// create a mask with 1 for each occupied cell
			v128_t deadMinCols = wasm_v128_and(cellsOccupied, one);

			// create a mask with 2 for each alive cell
			v128_t aliveStartCols = wasm_v128_and(cellsAlive, two);

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
	uint8_t *const colourGrid,
	const uint32_t colourGridWidth,
	uint16_t *const colourTileHistoryGrid,
	const uint32_t colourTileGridWidth,
	int32_t *const counts,
	const uint32_t countsWidth,
	const uint8_t *const comboList,
	const uint32_t bottomY,
	const uint32_t leftX,
	const uint32_t topY,
	const uint32_t rightX,
	const uint32_t xrange,
	const uint32_t yrange,
	const uint32_t deadState,
	const uint32_t minDeadState,
	const uint32_t maxGenState,
	uint32_t *const shared,
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
	const uint32_t alignedEnd = rightX & ~15;
	if (alignedStart > rightX + xrange) {
		alignedStart = rightX + xrange + 1;
	}

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

			if (state > minDeadState) {
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

			if (state > minDeadState) {
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
	int32_t *const counts,
	uint8_t *const colourGrid,
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

	const uint32_t align16Left = (left + 15) & ~15;
	const uint32_t align16Right = (right + 1) & ~15;
	const uint32_t leftTarget = align16Left > align16Right ? align16Right : align16Left;

	const v128_t addFour = wasm_i32x4_splat(4);	// add four

	// alive cells
	const v128_t alive = wasm_u8x16_splat(aliveStart);

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
				if (mask == 0xffff) {
					// all cells alive so add 1, 2, 3, ... 16 to the previous counts
					v128_t addCount = wasm_i32x4_make(count + 1, count + 2, count + 3, count + 4);

					// set 1 of 4
					v128_t previousCounts = wasm_v128_load(prevCountRow);
					previousCounts = wasm_i32x4_add(previousCounts, addCount);
					wasm_v128_store(countRow, previousCounts);
					countRow += 4;
					prevCountRow += 4;

					// set 2 of 4
					addCount = wasm_i32x4_add(addCount, addFour);
					previousCounts = wasm_v128_load(prevCountRow);
					previousCounts = wasm_i32x4_add(previousCounts, addCount);
					wasm_v128_store(countRow, previousCounts);
					countRow += 4;
					prevCountRow += 4;

					// set 3 of 4
					addCount = wasm_i32x4_add(addCount, addFour);
					previousCounts = wasm_v128_load(prevCountRow);
					previousCounts = wasm_i32x4_add(previousCounts, addCount);
					wasm_v128_store(countRow, previousCounts);
					countRow += 4;
					prevCountRow += 4;

					// set 4 of 4
					addCount = wasm_i32x4_add(addCount, addFour);
					previousCounts = wasm_v128_load(prevCountRow);
					previousCounts = wasm_i32x4_add(previousCounts, addCount);
					wasm_v128_store(countRow, previousCounts);
					countRow += 4;
					prevCountRow += 4;
					count += 16;
				} else {
					// unrolled loop for each bit in the mask
					for (int32_t b = 0; b < 4; b++) {
						if (mask & 15) {
							count += mask & 1;
							mask >>= 1;
							*countRow = *prevCountRow + count;
							countRow++;
							prevCountRow++;

							count += mask & 1;
							mask >>= 1;
							*countRow = *prevCountRow + count;
							countRow++;
							prevCountRow++;

							count += mask & 1;
							mask >>= 1;
							*countRow = *prevCountRow + count;
							countRow++;
							prevCountRow++;

							count += mask & 1;
							mask >>= 1;
							*countRow = *prevCountRow + count;
							countRow++;
							prevCountRow++;
						} else {
							const v128_t addCount = wasm_i32x4_splat(count);
							v128_t previousCounts = wasm_v128_load(prevCountRow);
							previousCounts = wasm_i32x4_add(previousCounts, addCount);
							wasm_v128_store(countRow, previousCounts);
							countRow += 4;
							prevCountRow += 4;
							mask >>= 4;
						}
					}
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
	int32_t *const counts,
	uint8_t *const colourGrid,
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

	const uint32_t align16Left = (left + 15) & ~15;
	const uint32_t align16Right = right & ~15;
	const uint32_t leftTarget = align16Left > align16Right ? align16Right : align16Left;

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
static inline int32_t getCount2(int32_t i, int32_t j, int32_t *const countRow) {
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
	const int32_t ccht,
	const int32_t ncols,
	const int32_t nrows,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t aliveStart,
	const int32_t halfccwd,
	int32_t *const counts,
	uint8_t *const colourGrid,
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
	const int32_t ccht,
	const int32_t ncols,
	const int32_t nrows,
	const int32_t bottomY,
	const int32_t leftX,
	const int32_t maxGridState,
	const int32_t halfccwd,
	int32_t *const counts,
	uint8_t *const colourGrid,
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

