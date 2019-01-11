// LifeViewer LTL
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Uint32 PatternManager LifeConstants */

	// LTL object
	/**
	 * @constructor
	 */
	function LTL(allocator, width, height, engine) {
		// allocator
		this.allocator = allocator;

		// engine
		this.engine = engine;

		// algorithm parameters
		this.range = 1;
		this.minS = 0;
		this.maxS = 0;
		this.minB = 0;
		this.maxB = 0;
		this.scount = 2;
		this.type = PatternManager.mooreLTL;

		// neighbour count array (will be reszied)
		this.counts = Array.matrix(Uint32, 1, 1, 0, allocator, "LTL.counts");

		// column count array
		this.colCounts = allocator.allocate(Uint32, this.range * 2 + 1, "LTL.colCounts");

		// range width array
		this.widths = allocator.allocate(Uint32, this.range * 2 + 1, "LTL.widths");
	}

	// set type and range
	LTL.prototype.setTypeAndRange = function(type, range) {
		// compute widest width
		var width = range * 2 + 1,
			r2 = range * range + range,
			i = 0,
			w = 0;

		// save type and range and allocate widths array
		this.type = type;
		this.range = range;
		this.widths = this.allocator.allocate(Uint32, range * 2 + 1, "LTL.widths");
		this.colCounts = this.allocator.allocate(Uint32, range * 2 + 1, "LTL.colCounts");

		// create the widths array based on the neighborhood type
		switch(type) {
			case PatternManager.mooreLTL:
			// Moore is a square
			for (i = 0; i < width; i += 1) {
				this.widths[i] = range;
			}
			break;

			// von Neumann is a diamond
			case PatternManager.vonNeumannLTL:
			for (i = 0; i < range; i += 1) {
				this.widths[i] = i;
				this.widths[width - i - 1] = i;
			}
			this.widths[i] = range;
			break;

			// circular is a circle
			case PatternManager.circularLTL:
			for (i = -range; i <= range; i += 1) {
				w = 0;
				while ((w + 1) * (w + 1) + (i * i) <= r2) {
					w += 1;
				}
				this.widths[i + range] = w;
			}
			break;
		}
	};

	// resize counts array
	LTL.prototype.resize = function(width, height) {
		// resize count array
		this.counts = Array.matrix(Uint32, height, width, 0, this.allocator, "LTL.counts");
	};

	// wrap the grid for LTL torus
	LTL.prototype.wrapTorusLTL = function(lx, by, rx, ty) {
		var colourGrid = this.engine.colourGrid,
			sourceRow = null,
			destRow = null,
			range = this.range,
			x = 0,
			y = 0;

		// copy the bottom rows to the top border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[by + y];
			destRow = colourGrid[ty + y + 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = sourceRow[x];
			}
		}

		// copy the top rows to the bottom border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[ty - y];
			destRow = colourGrid[by - y - 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = sourceRow[x];
			}
		}

		// copy the left columns to the right border
		// and the right columns to the left border
		for (y = by; y <= ty; y += 1) {
			sourceRow = colourGrid[y];
			for (x = 0; x < range; x += 1) {
				sourceRow[rx + x + 1] = sourceRow[lx + x];
				sourceRow[lx - x - 1] = sourceRow[rx - x];
			}
		}

		// copy bottom left cells to top right border
		// and bottom right cells to top left border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[by + y];
			destRow = colourGrid[ty + y + 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = sourceRow[x + lx];
				destRow[lx - x - 1] = sourceRow[rx - x];
			}
		}

		// copy top left cells to bottom right border
		// and top right cells to bottom left border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[ty - y];
			destRow = colourGrid[by - y - 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = sourceRow[x + lx];
				destRow[lx - x - 1] = sourceRow[rx - x];
			}
		}
	};

	// clear the outside the bounded grid
	LTL.prototype.clearLTLOutside = function(lx, by, rx, ty) {
		var colourGrid = this.engine.colourGrid,
			destRow = null,
			range = this.range,
			x = 0,
			y = 0;

		// clear the top border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[ty + y + 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = 0;
			}
		}

		// copy the bottom border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[by - y - 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = 0;
			}
		}

		// clear the left and right columns
		for (y = by; y <= ty; y += 1) {
			destRow = colourGrid[y];
			for (x = 0; x < range; x += 1) {
				destRow[rx + x + 1] = 0;
				destRow[lx - x - 1] = 0;
			}
		}

		// clear top right border
		// and top left border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[ty + y + 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = 0;
				destRow[lx - x - 1] = 0;
			}
		}

		// clear bottom right border
		// and bottom left border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[by - y - 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = 0;
				destRow[lx - x - 1] = 0;
			}
		}
	};

	// update the life grid region using computed counts
	LTL.prototype.updateGridFromCountsLTL = function(leftX, bottomY, rightX, topY) {
		var x = 0,
			y = 0,
			population = 0,
			births = 0,
			deaths = 0,
			state = 0,
			count = 0,
			somethingAlive = false,
			rowAlive = false,
			colourGrid = this.engine.colourGrid,
			colourTileHistoryGrid = this.engine.colourTileHistoryGrid,
			colourRow = null,
			countRow = null,
			colourTileRow = null,
			minX = this.engine.width,
			maxX = 0,
			minY = this.engine.height,
			maxY = 0,
			zoomBox = this.engine.zoomBox,
			range = this.range,
			minB = this.minB,
			maxB = this.maxB,
			minS = this.minS,
			maxS = this.maxS,
			counts = this.counts,
			maxGeneration = this.scount - 1,
			aliveStart = LifeConstants.aliveStart,
			aliveIndex = 0,
			colourLookup = this.engine.colourLookup;

		// compute next generation
		population = 0;
		births = 0;
		deaths = 0;
		somethingAlive = false;
		if (maxGeneration === 1) {
			// 2 state version
			for (y = bottomY - range; y <= topY + range; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				for (x = leftX - range; x <= rightX + range; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					aliveIndex = 0;
					if (state < aliveStart) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							births += 1;
							aliveIndex = 128;
						}
					} else {
						// this cell is alive
						if (count < minS || count > maxS) {
							// this cell doesn't survive
							deaths += 1;
						} else {
							aliveIndex = 128;
						}
					}
					state = colourLookup[state + aliveIndex];
					colourRow[x] = state;
					if (state >= aliveStart) {
						population += 1;
					}
					// update bounding box columns
					if (state > LifeConstants.deadMin) {
						rowAlive = true;
						colourTileRow[x >> 8] = 65535;
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
					}
				}
				if (rowAlive) {
					// if something was alive in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
					somethingAlive = true;
				}
			}
		} else {
			// >2 state version
			for (y = bottomY - range; y <= topY + range; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				for (x = leftX - range; x <= rightX + range; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					if (state === 0) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							state = maxGeneration;
							births += 1;
						}
					} else if (state === maxGeneration) {
						// this cell is alive
						if (count < minS || count > maxS) {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// this cell will eventually die
						state -= 1;
					}
					colourRow[x] = state;
					// update bounding box columns
					if (state > 0) {
						rowAlive = true;
						colourTileRow[x >> 8] = 65535;
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						if (state === maxGeneration) {
							population += 1;
						}
					}
				}
				if (rowAlive) {
					// if something was alive in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
					somethingAlive = true;
				}
			}
		}

		// save population and bounding box
		this.engine.population = population;
		this.engine.births = births;
		this.engine.deaths = deaths;
		zoomBox.leftX = minX;
		zoomBox.rightX = maxX;
		zoomBox.bottomY = minY;
		zoomBox.topY = maxY;

		// stop if population zero
		if (!somethingAlive) {
			this.engine.generationsAlive = 0;
			this.engine.anythingAlive = 0;
		}
	};

	// update the life grid region using LTL
	LTL.prototype.nextGenerationLTL = function() {
		var x = 0, y = 0, i = 0, j = 0,
			leftX = this.engine.zoomBox.leftX,
			rightX = this.engine.zoomBox.rightX,
			bottomY = this.engine.zoomBox.bottomY,
			topY = this.engine.zoomBox.topY,
			range = this.range,
			r2 = range + range,
			rp1 = range + 1,
			minB = this.minB, maxB = this.maxB,
			minS = this.minS, maxS = this.maxS,
			scount = this.scount,
			counts = this.counts,
			type = this.type,
			maxGeneration = scount - 1,
			count = 0,
			minX = this.engine.width, maxX = 0,
			minY = this.engine.height, maxY = 0,
			colourGrid = this.engine.colourGrid,
			colourTileHistoryGrid = this.engine.colourTileHistoryGrid,
			colourRow = null, countRowYpr = null, countRowYmrp1 = null,
			colourTileRow = null,
			countRow = null, prevCountRow = null,
			widths = this.widths,
			width = 0,
			bgWidth = this.engine.boundedGridWidth,
			bgHeight = this.engine.boundedGridHeight,
			gridLeftX = 0, gridRightX = 0, gridBottomY = 0, gridTopY = 0,
			population = 0, births = 0, deaths = 0,
			state = 0,
			xpr = 0, xmrp1 = 0,
			rowAlive = false, colAlive = false, somethingAlive = false,
			chunk = 8,  // must be the same as the unrolled loop!
			aliveStart = LifeConstants.aliveStart,
			aliveMax = LifeConstants.aliveMax,
			aliveIndex = 0,
			colourLookup = this.engine.colourLookup;

		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			// get grid extent
			gridLeftX = Math.round((this.engine.width - bgWidth) / 2);
			gridBottomY = Math.round((this.engine.height - bgHeight) / 2);
			gridRightX = gridLeftX + bgWidth - 1;
			gridTopY = gridBottomY + bgHeight - 1;

			// if B0 then process every cell
			if (minB === 0) {
				leftX = gridLeftX + range;
				rightX = gridRightX - range;
				topY = gridTopY - range;
				bottomY = gridBottomY + range;
			}

			// check if the bounded grid is a torus
			if (this.engine.boundedGridType === 1) {
				// extend range if needed for wrap
				if (leftX - gridLeftX < range) {
					rightX = gridRightX;
				}
				if (gridRightX - rightX < range) {
					leftX = gridLeftX;
				}
				if (gridTopY - topY < range) {
					bottomY = gridBottomY;
				}
				if (bottomY - gridBottomY < range) {
					topY = gridTopY;
				}
				this.wrapTorusLTL(gridLeftX, gridBottomY, gridRightX, gridTopY);
			}

			// fit to bounded grid
			if (leftX - gridLeftX < range) {
				leftX = gridLeftX + range;
			}
			if (gridRightX - rightX < range) {
				rightX = gridRightX - range;
			}
			if (gridTopY - topY < range) {
				topY = gridTopY - range;
			}
			if (bottomY - gridBottomY < range) {
				bottomY = gridBottomY + range;
			}

			if (type === PatternManager.mooreLTL) {
				leftX -= r2;
				bottomY -= r2;
				rightX += r2;
				topY += r2;
			}
		}

		// compute counts for given neighborhood
		if (type === PatternManager.mooreLTL) {
			// temporarily expand bounding box
			leftX -= r2;
			bottomY -= r2;
			rightX += r2;
			topY += r2;

			// put zeros in top 2*range rows
			for (y = bottomY; y < bottomY + r2; y += 1) {
				countRow = counts[y];
				for (x = leftX; x <= rightX; x += 1) {
					countRow[x] = 0;
				}
			}

			// put zeros in left 2*range columns
			for (x = leftX; x < leftX + r2; x += 1) {
				for (y = bottomY + r2; y <= topY; y += 1) {
					counts[y][x] = 0;
				}
			}

			// calculate cumulative counts for each column
			if (maxGeneration === 1) {
				// 2 state version
				prevCountRow = counts[bottomY + r2 - 1];
				for (y = bottomY + r2; y <= topY; y += 1) {
					countRow = counts[y];
					colourRow = colourGrid[y];
					count = 0;
					x = leftX + r2;
					while (x + chunk <= rightX) {
						// unrolled loop must match chunk value
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
					}
					while (x <= rightX) {
						if (colourRow[x] >= aliveStart && colourRow[x] <= aliveMax) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
						x += 1;
					}
					prevCountRow = countRow;
				}
			} else {
				// >2 state version
				for (y = bottomY + r2; y <= topY; y += 1) {
					prevCountRow = counts[y - 1];
					countRow = counts[y];
					colourRow = colourGrid[y];
					count = 0;
					for (x = leftX + r2; x <= rightX; x += 1) {
						if (colourRow[x] === maxGeneration) {
							count += 1;
						}
						countRow[x] = prevCountRow[x] + count;
					}
				}
			}

			// restore limits
			leftX += range;
			bottomY += range;
			rightX -= range;
			topY -= range;

			if (this.engine.boundedGridType !== -1) {
				leftX += r2;
				bottomY += r2;
				rightX -= r2;
				topY -= r2;
			}

			// calculate final neighborhood counts and update cells

			// process bottom left cell
			state = colourGrid[bottomY][leftX];
			count = counts[bottomY + range][leftX + range];
			if (maxGeneration === 1) {
				// 2 state version
				aliveIndex = 0;
				if (state < aliveStart) {
					// this cell is dead
					if (count >= minB && count <= maxB) {
						// new cell is born
						births += 1;
						aliveIndex = 128;
					}
				} else {
					// this cell is alive
					if (count < minS || count > maxS) {
						// cell dies
						deaths += 1;
					} else {
						aliveIndex = 128;
					}
				}
				// update the cell
				state = colourLookup[state + aliveIndex];
				colourGrid[bottomY][leftX] = state;
				if (state >= aliveStart) {
					population += 1;
				}
				if (state > LifeConstants.deadMin) {
					minX = leftX;
					maxX = leftX;
					minY = bottomY;
					maxY = bottomY;
					somethingAlive = true;
					colourTileHistoryGrid[bottomY >> 4][leftX >> 8] = 65535;
				}
			} else {
				// >2 state version
				if (state === 0) {
					// this cell is dead
					if (count >= minB && count <= maxB) {
						// new cell is born
						state = maxGeneration;
						births += 1;
					}
				} else if (state === maxGeneration) {
					// this cell is alive
					if (count < minS || count > maxS) {
						// cell decays by one state
						state -= 1;
						deaths += 1;
					}
				} else {
					// this cell will eventually die
					state -= 1;
				}
				// update the cell
				colourGrid[bottomY][leftX] = state;
				if (state === maxGeneration) {
					population += 1;
				}
				if (state > 0) {
					minX = leftX;
					maxX = leftX;
					minY = bottomY;
					maxY = bottomY;
					somethingAlive = true;
					colourTileHistoryGrid[bottomY >> 4][leftX >> 8] = 65535;
				}
			}

			// process remainder of bottom row (bottom left cell was done above)
			rowAlive = false;
			countRow = counts[bottomY + range];
			prevCountRow = counts[bottomY + range];
			colourRow = colourGrid[bottomY];
			colourTileRow = colourTileHistoryGrid[bottomY >> 4];
			if (maxGeneration === 1) {
				// 2 state version
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRow[x + range] - prevCountRow[x - rp1];
					aliveIndex = 0;
					if (state < aliveStart) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							births += 1;
							aliveIndex = 128;
						}
					} else {
						// this cell is alive
						if (count < minS || count > maxS) {
							// cell dies
							deaths += 1;
						} else {
							aliveIndex = 128;
						}
					}
					// update the cell
					state = colourLookup[state + aliveIndex];
					colourRow[x] = state;
					if (state >= aliveStart) {
						population += 1;
					}
					if (state > LifeConstants.deadMin) {
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						rowAlive = true;
						colourTileRow[x >> 8] = 65535;
					}
				}
				if (rowAlive) {
					somethingAlive = true;
					minY = bottomY;
					maxY = bottomY;
				}
			}
			else {
				// >2 state version
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRow[x + range] - prevCountRow[x - rp1];
					if (state === 0) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							state = maxGeneration;
							births += 1;
						}
					} else if (state === maxGeneration) {
						// this cell is alive
						if (count < minS || count > maxS) {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// this cell will eventually die
						state -= 1;
					}
					// update the cell
					colourRow[x] = state;
					if (state === maxGeneration) {
						population += 1;
					}
					if (state > LifeConstants.deadMin) {
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						rowAlive = true;
						colourTileRow[x >> 8] = 65535;
					}
				}
				if (rowAlive) {
					somethingAlive = true;
					minY = bottomY;
					maxY = bottomY;
				}
			}

			// process remainder of left column (bottom left cell was done above)
			colAlive = false;
			if (maxGeneration === 1) {
				// 2 state version
				for (y = bottomY + 1; y <= topY; y += 1) {
					state = colourGrid[y][leftX];
					count = counts[y + range][leftX + range] - counts[y - rp1][leftX + range];
					aliveIndex = 0;
					if (state < aliveStart) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							births += 1;
							aliveIndex = 128;
						}
					} else {
						// this cell is alive
						if (count < minS || count > maxS) {
							// cell decays by one state
							deaths += 1;
						} else {
							aliveIndex = 128;
						}
					}
					// update the cell
					state = colourLookup[state + aliveIndex];
					colourGrid[y][leftX] = state;
					if (state >= aliveStart) {
						population += 1;
					}
					if (state > LifeConstants.deadMin) {
						if (y < minY) {
							minY = y;
						}
						if (y > maxY) {
							maxY = y;
						}
						colAlive = true;
						colourTileHistoryGrid[y >> 4][leftX >> 8] = 65535;
					}
				}
				if (colAlive) {
					somethingAlive = true;
					if (leftX < minX) {
						minX = leftX;
					}
					if (leftX > maxX) {
						maxX = leftX;
					}
				}
			} else {
				// >2 state version
				for (y = bottomY + 1; y <= topY; y += 1) {
					state = colourGrid[y][leftX];
					count = counts[y + range][leftX + range] - counts[y - rp1][leftX + range];
					if (state === 0) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							state = maxGeneration;
							births += 1;
						}
					} else if (state === maxGeneration) {
						// this cell is alive
						if (count < minS || count > maxS) {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// this cell will eventually die
						state -= 1;
					}
					// update the cell
					colourGrid[y][leftX] = state;
					if (state === maxGeneration) {
						population += 1;
					}
					if (state > 0) {
						if (y < minY) {
							minY = y;
						}
						if (y > maxY) {
							maxY = y;
						}
						colAlive = true;
						colourTileHistoryGrid[y >> 4][leftX >> 8] = 65535;
					}
				}
				if (colAlive) {
					somethingAlive = true;
					if (leftX < minX) {
						minX = leftX;
					}
					if (leftX > maxX) {
						maxX = leftX;
					}
				}
			}

			// compute the rest of the grid
			if (maxGeneration === 1) {
				// 2 state version
				for (y = bottomY + 1; y <= topY; y += 1) {
					colourRow = colourGrid[y];
					colourTileRow = colourTileHistoryGrid[y >> 4];
					countRowYpr = counts[y + range];
					countRowYmrp1 = counts[y - rp1];
					xpr = leftX + 1 + range;
					xmrp1 = leftX + 1 - rp1;
					for (x = leftX + 1; x <= rightX; x += 1) {
						state = colourRow[x];
						count = countRowYpr[xpr]
							+ countRowYmrp1[xmrp1]
							- countRowYpr[xmrp1]
							- countRowYmrp1[xpr];
						aliveIndex = 0;
						if (state < aliveStart) {
							// this cell is dead
							if (count >= minB && count <= maxB) {
								// new cell is born
								aliveIndex = 128;
								births += 1;
							}
						} else {
							// this cell is alive
							if (count < minS || count > maxS) {
								// cell dies
								deaths += 1;
							} else {
								aliveIndex = 128;
							}
						}
						// update the cell
						state = colourLookup[state + aliveIndex];
						colourRow[x] = state;
						if (state >= aliveStart) {
							population += 1;
						}
						if (state > LifeConstants.deadMin) {
							rowAlive = true;
							colourTileRow[x >> 8] = 65535;
							if (x < minX) {
								minX = x;
							}
							if (x > maxX) {
								maxX = x;
							}
						}
						xpr += 1;
						xmrp1 += 1;
					}
					if (rowAlive) {
						if (y < minY) {
							minY = y;
						}
						if (y > maxY) {
							maxY = y;
						}
						somethingAlive = true;
					}
				}
			} else {
				// >2 state version
				for (y = bottomY + 1; y <= topY; y += 1) {
					colourRow = colourGrid[y];
					colourTileRow = colourTileHistoryGrid[y >> 4];
					countRowYpr = counts[y + range];
					countRowYmrp1 = counts[y - rp1];
					rowAlive = false;
					xpr = leftX + 1 + range;
					xmrp1 = leftX + 1 - rp1;
					for (x = leftX + 1; x <= rightX; x += 1) {
						state = colourRow[x];
						count = countRowYpr[xpr]
							+ countRowYmrp1[xmrp1]
							- countRowYpr[xmrp1]
							- countRowYmrp1[xpr];
						if (state === 0) {
							// this cell is dead
							if (count >= minB && count <= maxB) {
								// new cell is born
								state = maxGeneration;
								births += 1;
							}
						} else if (state === maxGeneration) {
							// this cell is alive
							if (count < minS || count > maxS) {
								// cell decays by one state
								state -= 1;
								deaths += 1;
							}
						} else {
							// this cell will eventually die
							state -= 1;
						}
						// update the cell
						colourRow[x] = state;
						if (state === maxGeneration) {
							population += 1;
						}
						if (state > 0) {
							colourTileRow[x >> 8] = 65535;
							if (x < minX) {
								minX = x;
							}
							if (x > maxX) {
								maxX = x;
							}
							rowAlive = true;
						}
						xpr += 1;
						xmrp1 += 1;
					}
					if (rowAlive) {
						somethingAlive = true;
						if (y < minY) {
							minY = y;
						}
						if (y > maxY) {
							maxY = y;
						}
					}
				}
			}

			// save statistics
			this.engine.population = population;
			this.engine.births = births;
			this.engine.deaths = deaths;
			this.engine.zoomBox.leftX = minX;
			this.engine.zoomBox.rightX = maxX;
			this.engine.zoomBox.bottomY = minY;
			this.engine.zoomBox.topY = maxY;

			// stop if population zero
			if (!somethingAlive) {
				this.engine.generationsAlive = 0;
				this.engine.anythingAlive = 0;
			}
		} else {
			// von Neumann and Circular
			if (maxGeneration === 1) {
				// 2 state version
				for (y = bottomY - range; y <= topY + range; y += 1) {
					countRow = counts[y];
					for (x = leftX - range; x <= rightX + range; x += 1) {
						count = 0;
						for (j = -range; j <= range; j += 1) {
							width = widths[j + range];
							colourRow = colourGrid[y + j];
							for (i = -width; i <= width; i += 1) {
								if ((colourRow[x + i]) >= aliveStart && colourRow[x + i] <= aliveMax) {
									count += 1;
								}
							}
						}
						countRow[x] = count;
					}
				}
			} else {
				// >2 state version
				for (y = bottomY - range; y <= topY + range; y += 1) {
					countRow = counts[y];
					for (x = leftX - range; x <= rightX + range; x += 1) {
						count = 0;
						for (j = -range; j <= range; j += 1) {
							width = widths[j + range];
							colourRow = colourGrid[y + j];
							for (i = -width; i <= width; i += 1) {
								if ((colourRow[x + i]) === maxGeneration) {
									count += 1;
								}
							}
						}
						countRow[x] = count;
					}
				}
			}
		}

		// adjust range if using bounded grid
		if (this.engine.boundedGridType !== -1) {
			if (leftX < gridLeftX + range) {
				leftX = gridLeftX + range;
			}
			if (rightX > gridRightX - range) {
				rightX = gridRightX - range;
			}
			if (bottomY < gridBottomY + range) {
				bottomY = gridBottomY + range;
			}
			if (topY > gridTopY - range) {
				topY = gridTopY - range;
			}
		}

		// compute next generation from counts if not Moore which was done above
		if (type !== PatternManager.mooreLTL) {
			this.updateGridFromCountsLTL(leftX, bottomY, rightX, topY);
		}

		// check if there is a Torus bounded grid
		if (this.engine.boundedGridType === 1) {
			// clear outside
			this.clearLTLOutside(gridLeftX, gridBottomY, gridRightX, gridTopY);
		}
	};

	// create the global interface
	window["LTL"] = LTL;
}
());


