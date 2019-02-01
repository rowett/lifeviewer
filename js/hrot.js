// LifeViewer HROT
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Uint8 Uint32 PatternManager LifeConstants */

	// HROT object
	/**
	 * @constructor
	 */
	function HROT(allocator, width, height, engine) {
		// allocator
		this.allocator = allocator;

		// engine
		this.engine = engine;

		// algorithm parameters
		this.range = 1;
		this.scount = 2;
		this.births = allocator.allocate(Uint8, 0, "HROT.births");
		this.survivals = allocator.allocate(Uint8, 0, "HROT.survivals");
		this.type = PatternManager.mooreHROT;

		// neighbour count array (will be resized)
		this.counts = Array.matrix(Uint32, 1, 1, 0, allocator, "HROT.counts");

		// range width array (will be resized)
		this.widths = allocator.allocate(Uint32, 0, "HROT.widths");

		// used row array (will be resized)
		this.colUsed = allocator.allocate(Uint8, 0, "HROT.colUsed");

		// range threshold to use fast von Neumann algorithm
		this.rangeVN = 6;

		// fast von Neumann algorithm parameters
		this.nrows = 0;
		this.ncols = 0;
		this.ccht = 0;
		this.halfccwd = 0;
	}

	// resize counts array
	HROT.prototype.resize = function(width, height) {
		// resize counts array
		this.counts = Array.matrix(Uint32, height, width, 0, this.allocator, "HROT.counts");
		this.colUsed = this.allocator.allocate(Uint8, width, "HROT.colUsed");
	};

	// set type and range
	HROT.prototype.setTypeAndRange = function(type, range) {
		// compute widest width
		var width = range * 2 + 1,
			r2 = range * range + range,
			i = 0,
			w = 0;

		// save type and range and allocate widths array
		this.type = type;
		this.range = range;
		this.widths = this.allocator.allocate(Uint32, width, "HROT.widths");

		// create the widths array based on the neighborhood type
		switch(type) {
			case PatternManager.mooreHROT:
			// Moore is a square
			for (i = 0; i < width; i += 1) {
				this.widths[i] = range;
			}
			break;

			// von Neumann is a diamond
			case PatternManager.vonNeumannHROT:
			for (i = 0; i < range; i += 1) {
				this.widths[i] = i;
				this.widths[width - i - 1] = i;
			}
			this.widths[i] = range;
			break;

			// circular is a circle
			case PatternManager.circularHROT:
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

	// get the count for von Neumann
	HROT.prototype.getCount = function(i, j) {
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

	// wrap the grid for HROT torus
	HROT.prototype.wrapTorusHROT = function(lx, by, rx, ty) {
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
	HROT.prototype.clearHROTOutside = function(lx, by, rx, ty) {
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
	HROT.prototype.updateGridFromCountsHROT = function(leftX, bottomY, rightX, topY) {
		var x = 0,
			y = 0,
			population = 0,
			births = 0,
			deaths = 0,
			state = 0,
			count = 0,
			rowAlive = false,
			liveRowAlive = false,
			colourGrid = this.engine.colourGrid,
			colourTileHistoryGrid = this.engine.colourTileHistoryGrid,
			colourRow = null,
			countRow = null,
			colourTileRow = null,
			// bounding box for any cell
			minX = this.engine.width,
			maxX = 0,
			minY = this.engine.height,
			maxY = 0,
			// bounding box for alive cells (used for fit zoom)
			minX1 = minX,
			maxX1 = maxX,
			minY1 = minY,
			maxY1 = maxY,
			zoomBox = this.engine.zoomBox,
			HROTBox = this.engine.HROTBox,
			range = this.range,
			birthList = this.births,
			survivalList = this.survivals,
			counts = this.counts,
			maxGeneration = this.scount - 1,
			aliveStart = LifeConstants.aliveStart,
			deadMin = LifeConstants.deadMin,
			aliveIndex = 0,
			colourLookup = this.engine.colourLookup,

			// maximum generations state
			maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,

			// maximum dead state number
			deadState = this.engine.historyStates,

			// minimum dead state number
			minDeadState = (this.engine.historyStates > 0 ? 1 : 0);

		// compute next generation
		population = 0;
		births = 0;
		deaths = 0;
		if (maxGeneration === 1) {
			// 2 state version
			for (y = bottomY - range; y <= topY + range; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				liveRowAlive = false;
				for (x = leftX - range; x <= rightX + range; x += 1) {
					state = colourRow[x];
					count = countRow[x];
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
							// this cell doesn't survive
							deaths += 1;
						} else {
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
			for (y = bottomY - range; y <= topY + range; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				liveRowAlive = false;
				for (x = leftX - range; x <= rightX + range; x += 1) {
					state = colourRow[x];
					count = countRow[x];
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
						maxY1 =y;
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
		} else {
			this.engine.anythingAlive = 0;
		}
	};

	// update the life grid region using HROT for 2 state patterns
	HROT.prototype.nextGenerationHROT2 = function() {
		var x = 0, y = 0, i = 0, j = 0,
			leftX = this.engine.zoomBox.leftX,
			rightX = this.engine.zoomBox.rightX,
			bottomY = this.engine.zoomBox.bottomY,
			topY = this.engine.zoomBox.topY,
			range = this.range,
			birthList = this.births,
			survivalList = this.survivals,
			r2 = range + range,
			rp1 = range + 1,
			scount = this.scount,
			counts = this.counts,
			type = this.type,
			maxGeneration = scount - 1,
			count = 0,
			minX = this.engine.width, maxX = 0,
			minY = this.engine.height, maxY = 0,
			minX1 = minX, maxX1 = maxX,
			minY1 = minY, maxY1 = maxY,
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
			rowAlive = false, colAlive = false,
			liveRowAlive = false, liveColAlive = false,
			chunk = 8,  // must be the same as the unrolled loop!
			aliveStart = LifeConstants.aliveStart,
			deadMin = LifeConstants.deadMin,
			aliveIndex = 0,
			colourLookup = this.engine.colourLookup,
			colUsed = this.colUsed,
			im1 = 0, im2 = 0,
			iprm1 = 0, imrm1 = 0,
			imrm2 = 0, ipminrow = 0,
			ipr = 0, jpr = 0,
			jmr = 0, jpmincol = 0;

		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			// get grid extent
			gridLeftX = Math.round((this.engine.width - bgWidth) / 2);
			gridBottomY = Math.round((this.engine.height - bgHeight) / 2);
			gridRightX = gridLeftX + bgWidth - 1;
			gridTopY = gridBottomY + bgHeight - 1;

			// if B0 then process every cell
			if (birthList[0] === 1) {
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
				this.wrapTorusHROT(gridLeftX, gridBottomY, gridRightX, gridTopY);
			}

			// check if the bounded grid is a plane and there are just 2 states
			if (this.engine.boundedGridType === 0 && maxGeneration === 1) {
				// clear bounded grid cells since they have value 255
				// they will be replaced before rendering
				this.engine.drawBoundedGridBorder(0);
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

			if (type === PatternManager.mooreHROT) {
				leftX -= r2;
				bottomY -= r2;
				rightX += r2;
				topY += r2;
			} else {
				if (type === PatternManager.vonNeumannHROT && range > this.rangeVN) {
					leftX -= range;
					bottomY -= range;
					rightX += range;
					topY += range;
				}
			}
		}

		// compute counts for given neighborhood
		if (type === PatternManager.mooreHROT) {
			// temporarily expand bounding box
			leftX -= r2;
			bottomY -= r2;
			rightX += r2;
			topY += r2;

			// put zeros in top 2*range rows
			for (y = bottomY; y < bottomY + r2; y += 1) {
				countRow = counts[y];
				x = leftX;
				while (x + chunk <= rightX) {
					// unrolled loop must match chunk value
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
				}
				while (x <= rightX) {
					countRow[x] = 0;
					x += 1;
				}
			}

			// put zeros in left 2*range columns
			for (y = bottomY + r2; y <= topY; y += 1) {
				countRow = counts[y];
				x = leftX;
				while (x + chunk <= leftX + r2) {
					// unrolled loop must match chunk value
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
					countRow[x] = 0;
					x += 1;
				}
				while (x <= leftX + r2) {
					countRow[x] = 0;
					x += 1;
				}
			}

			// calculate cumulative counts for each column
			prevCountRow = counts[bottomY + r2 - 1];
			for (y = bottomY + r2; y <= topY; y += 1) {
				countRow = counts[y];
				colourRow = colourGrid[y];
				count = 0;
				x = leftX + r2;
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
			countRow = counts[bottomY + range];
			prevCountRow = counts[bottomY + range];
			colourRow = colourGrid[bottomY];
			colourTileRow = colourTileHistoryGrid[bottomY >> 4];
			for (x = leftX + 1; x <= rightX; x += 1) {
				state = colourRow[x];
				count = countRow[x + range] - prevCountRow[x - rp1];
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
			xpr = leftX + range;
			for (y = bottomY + 1; y <= topY; y += 1) {
				state = colourGrid[y][leftX];
				count = counts[y + range][xpr] - counts[y - rp1][xpr];
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
						// cell decays by one state
						deaths += 1;
					} else {
						aliveIndex = 128;
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
				countRowYpr = counts[y + range];
				countRowYmrp1 = counts[y - rp1];
				xpr = leftX + 1 + range;
				xmrp1 = leftX + 1 - rp1;
				rowAlive = false;
				liveRowAlive = false;
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRowYpr[xpr]
						+ countRowYmrp1[xmrp1]
						- countRowYpr[xmrp1]
						- countRowYmrp1[xpr];
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
			} else {
				this.engine.anythingAlive = 0;
			}
		} else {
			if (type === PatternManager.vonNeumannHROT && range > this.rangeVN) {
				// set variables to use in getCount
				leftX -= range;
				rightX += range;
				bottomY -= range;
				topY += range;
				if (this.engine.boundedGridType === -1) {
					leftX -= range;
					rightX += range;
					bottomY -= range;
					topY += range;
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
					for (j = 0; j <= this.ncols; j += 1) {
						countRow[j] = this.getCount(im1, j - 1) + this.getCount(im1, j + 1) - this.getCount(im2, j);
						if (i < this.nrows) {
							if (colourRow[j + leftX] >= aliveStart) {
								countRow[j] += 1;
							}
						}
					}
				}

				// calculate final neighborhood counts and update the corresponding cells in the grid
				for (i = range; i <= this.nrows - range; i += 1) {
					im1 = i - 1;
					ipr = i + range;
					iprm1 = ipr - 1;
					imrm1 = i - range - 1;
					imrm2 = imrm1 - 1;
					ipminrow = i + bottomY;
					colourRow = colourGrid[ipminrow];
					colourTileRow = colourTileHistoryGrid[ipminrow >> 4];
					rowAlive = false;
					liveRowAlive = false;
					for (j = range; j <= this.ncols - range; j += 1) {
						jpr = j + range;
						jmr = j - range;
						count = this.getCount(ipr , j)   - this.getCount(im1 , jpr + 1) - this.getCount(im1 , jmr - 1) + this.getCount(imrm2 , j) +
								this.getCount(iprm1 , j) - this.getCount(im1 , jpr)     - this.getCount(im1 , jmr)     + this.getCount(imrm1 , j);
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
				} else {
					this.engine.anythingAlive = 0;
				}
			} else {
				// Circular or short range von Neumann
				for (y = bottomY - range; y <= topY + range; y += 1) {
					countRow = counts[y];
					x = leftX - range;
					// for the first cell in the row count the entire neighborhood
					count = 0;
					for (j = -range; j <= range; j += 1) {
						width = widths[j + range];
						colourRow = colourGrid[y + j];
						for (i = -width; i <= width; i += 1) {
							if ((colourRow[x + i]) >= aliveStart) {
								count += 1;
							}
						}
					}
					countRow[x] = count;
					x += 1;
	
					// for the remaining rows subtract the left and add the right cells
					while (x <= rightX + range) {
						for (j = -range; j <= range; j += 1) {
							width = widths[j + range];
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
		if (type !== PatternManager.mooreHROT && !(type === PatternManager.vonNeumannHROT && range > this.rangeVN)) {
			this.updateGridFromCountsHROT(leftX, bottomY, rightX, topY);
		}

		// check if there is a Torus bounded grid
		if (this.engine.boundedGridType === 1) {
			// clear outside
			this.clearHROTOutside(gridLeftX, gridBottomY, gridRightX, gridTopY);
		}
	};

	// update the life grid region using HROT for >2 state patterns
	HROT.prototype.nextGenerationHROTN = function() {
		var x = 0, y = 0, i = 0, j = 0,
			leftX = this.engine.zoomBox.leftX,
			rightX = this.engine.zoomBox.rightX,
			bottomY = this.engine.zoomBox.bottomY,
			topY = this.engine.zoomBox.topY,
			range = this.range,
			birthList = this.births,
			survivalList = this.survivals,
			r2 = range + range,
			rp1 = range + 1,
			counts = this.counts,
			type = this.type,
			count = 0,
			minX = this.engine.width, maxX = 0,
			minY = this.engine.height, maxY = 0,
			minX1 = minX, maxX1 = maxX,
			minY1 = minY, maxY1 = maxY,
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
			rowAlive = false, colAlive = false,
			liveRowAlive = false, liveColAlive = false,
			im1 = 0, im2 = 0,
			iprm1 = 0, imrm1 = 0,
			imrm2 = 0, ipminrow = 0,
			ipr = 0, jpr = 0,
			jmr = 0, jpmincol = 0,

			// maximum generations state
			maxGenState = this.engine.multiNumStates + this.engine.historyStates - 1,

			// maximum dead state number
			deadState = this.engine.historyStates,

			// minimum dead state number
			minDeadState = (this.engine.historyStates > 0 ? 1 : 0);

		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			// get grid extent
			gridLeftX = Math.round((this.engine.width - bgWidth) / 2);
			gridBottomY = Math.round((this.engine.height - bgHeight) / 2);
			gridRightX = gridLeftX + bgWidth - 1;
			gridTopY = gridBottomY + bgHeight - 1;

			// if B0 then process every cell
			if (birthList[0] === 1) {
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
				this.wrapTorusHROT(gridLeftX, gridBottomY, gridRightX, gridTopY);
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

			if (type === PatternManager.mooreHROT) {
				leftX -= r2;
				bottomY -= r2;
				rightX += r2;
				topY += r2;
			} else {
				if (type === PatternManager.vonNeumannHROT && range > this.rangeVN) {
					leftX -= range;
					bottomY -= range;
					rightX += range;
					topY += range;
				}
			}
		}

		// compute counts for given neighborhood
		if (type === PatternManager.mooreHROT) {
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
			for (y = bottomY + r2; y <= topY; y += 1) {
				prevCountRow = counts[y - 1];
				countRow = counts[y];
				colourRow = colourGrid[y];
				count = 0;
				for (x = leftX + r2; x <= rightX; x += 1) {
					if (colourRow[x] === maxGenState) {
						count += 1;
					}
					countRow[x] = prevCountRow[x] + count;
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
			colourGrid[bottomY][leftX] = state;
			if (state > 0) {
				minX = leftX;
				maxX = leftX;
				minY = bottomY;
				maxY = bottomY;
				colourTileHistoryGrid[bottomY >> 4][leftX >> 8] |= (1 << (~(leftX >> 4) & 15));
				if (state === maxGenState) {
					population += 1;
					minX1 = leftX;
					maxX1 = leftX;
					minY1 = bottomY;
					maxY1 = bottomY;
				}
			}

			// process remainder of bottom row (bottom left cell was done above)
			rowAlive = false;
			liveRowAlive = false;
			countRow = counts[bottomY + range];
			prevCountRow = counts[bottomY + range];
			colourRow = colourGrid[bottomY];
			colourTileRow = colourTileHistoryGrid[bottomY >> 4];
			for (x = leftX + 1; x <= rightX; x += 1) {
				state = colourRow[x];
				count = countRow[x + range] - prevCountRow[x - rp1];
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
			xpr = leftX + range;
			for (y = bottomY + 1; y <= topY; y += 1) {
				state = colourGrid[y][leftX];
				count = counts[y + range][xpr] - counts[y - rp1][xpr];
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
				countRowYpr = counts[y + range];
				countRowYmrp1 = counts[y - rp1];
				rowAlive = false;
				liveRowAlive = false;
				xpr = leftX + 1 + range;
				xmrp1 = leftX + 1 - rp1;
				for (x = leftX + 1; x <= rightX; x += 1) {
					state = colourRow[x];
					count = countRowYpr[xpr]
						+ countRowYmrp1[xmrp1]
						- countRowYpr[xmrp1]
						- countRowYmrp1[xpr];
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
			} else {
				this.engine.anythingAlive = 0;
			}
		} else {
			if (type === PatternManager.vonNeumannHROT && range > this.rangeVN) {
				// set variables to use in getCount
				leftX -= range;
				rightX += range;
				bottomY -= range;
				topY += range;
				if (this.engine.boundedGridType === -1) {
					leftX -= range;
					rightX += range;
					bottomY -= range;
					topY += range;
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
					for (j = 0; j <= this.ncols; j += 1) {
						countRow[j] = this.getCount(im1, j - 1) + this.getCount(im1, j + 1) - this.getCount(im2, j);
						if (i < this.nrows) {
							if (colourRow[j + leftX] === maxGenState) {
								countRow[j] += 1;
							}
						}
					}
				}

				// calculate final neighborhood counts and update the corresponding cells in the grid
				for (i = range; i <= this.nrows - range; i += 1) {
					im1 = i - 1;
					ipr = i + range;
					iprm1 = ipr - 1;
					imrm1 = i - range - 1;
					imrm2 = imrm1 - 1;
					ipminrow = i + bottomY;
					colourRow = colourGrid[ipminrow];
					colourTileRow = colourTileHistoryGrid[ipminrow >> 4];
					rowAlive = false;
					liveRowAlive = false;
					for (j = range; j <= this.ncols - range; j += 1) {
						jpr = j + range;
						jmr = j - range;
						count = this.getCount(ipr , j)   - this.getCount(im1 , jpr + 1) - this.getCount(im1 , jmr - 1) + this.getCount(imrm2 , j) +
								this.getCount(iprm1 , j) - this.getCount(im1 , jpr)     - this.getCount(im1 , jmr)     + this.getCount(imrm1 , j);
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
				} else {
					this.engine.anythingAlive = 0;
				}
			} else {
				// von Neumann and Circular
				for (y = bottomY - range; y <= topY + range; y += 1) {
					countRow = counts[y];
					x = leftX - range;
					// for the first cell in the row count the entire neighborhood
					count = 0;
					for (j = -range; j <= range; j += 1) {
						width = widths[j + range];
						colourRow = colourGrid[y + j];
						for (i = -width; i <= width; i += 1) {
							if ((colourRow[x + i]) === maxGenState) {
								count += 1;
							}
						}
					}
					countRow[x] = count;
					x += 1;
	
					// for the remaining rows subtract the left and add the right cells
					while (x <= rightX + range) {
						for (j = -range; j <= range; j += 1) {
							width = widths[j + range];
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
		if (type !== PatternManager.mooreHROT && !(type === PatternManager.vonNeumannHROT && range > this.rangeVN)) {
			this.updateGridFromCountsHROT(leftX, bottomY, rightX, topY);
		}

		// check if there is a Torus bounded grid
		if (this.engine.boundedGridType === 1) {
			// clear outside
			this.clearHROTOutside(gridLeftX, gridBottomY, gridRightX, gridTopY);
		}
	};

	// update the life grid using HROT
	HROT.prototype.nextGenerationHROT = function() {
		if (this.scount === 2) {
			// use 2 state version
			this.nextGenerationHROT2();
		} else {
			// use >2 state version
			this.nextGenerationHROTN();
		}
	};

	// create the global interface
	window["HROT"] = HROT;
}
());
