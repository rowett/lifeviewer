// LifeViewer Stars
// Implements starfield.

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

	// Stars constructor
	/**
	 * @constructor
	 */
	function Stars(/** @type {number} */ numStars, /** @type {Allocator} */ allocator) {
		// number of stars
		/** @type {number} */ this.numStars = numStars;

		// list of stars
		/** type {Float32Array} */ this.x = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "Stars.x")); 
		/** type {Float32Array} */ this.y = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "Stars.y")); 
		/** type {Float32Array} */ this.z = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "Stars.z")); 

		// star colour
		/** @type {Colour} */ this.starColour = new Colour(255, 255, 255);

		// random number generator
		/** @type {Random} */ this.randGen = new Random();

		// initialise random seed
		this.randGen.init(Date.now().toString());

		// degrees in a circle
		/** @type {number} */ this.circleDegrees = 360;

		// degree parts
		/** @type {number} */ this.degreeParts = 8;

		// table for sin and cos
		/** @type {Float32Array} */ this.sin = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "Stars.sin"));
		/** @type {Float32Array} */ this.cos = /** @type {!Float32Array} */ (allocator.allocate(Type.Float32, 0, "Stars.cos"));

		// conversions
		/** @type {number} */ this.degToRad = Math.PI / (this.circleDegrees / 2);
		/** @type {number} */ this.radToDeg = (this.circleDegrees / 2) / Math.PI;

		// save the allocator
		/** @type {Allocator} */ this.allocator = allocator;

		// whether initialized
		/** @type {boolean} */ this.initialized = false;
	}

	// initialise stars
	Stars.prototype.init = function(/** @type {number} */ maxX, /** @type {number} */ maxY, /** @type {number} */ maxZ) {
		var	/** @type {number} */ i = 0,
			/** @type {number} */ curX = 0,
			/** @type {number} */ curY = 0,
			/** @type {number} */ curZ = 0,

			// number of stars
			/** @type {number} */ numStars = this.numStars,

			// compute the radius of the starfield
			/** @type {number} */ radius2 = (maxX * maxX) + (maxY * maxY);

		// allocate the stars
		this.x = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, numStars, "Stars.x")); 
		this.y = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, numStars, "Stars.y")); 
		this.z = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, numStars, "Stars.z")); 

		// create random stars
		for (i = 0; i < numStars; i += 1) {
			// get the next z coordinate based on the cube of the star number (more stars nearer the camera)
			curZ = ((i / numStars) * (i / numStars) * (i / numStars) * (i / numStars) * maxZ) + 1;

			// pick a random 2d position and ensure it's within the radius
			do {
				curX = 3 * ((this.randGen.random() * maxX) - (maxX / 2));
				curY = 3 * ((this.randGen.random() * maxY) - (maxY / 2));
			} while (((curX * curX) + (curY * curY)) > radius2);

			// save the star position
			this.x[i] = curX;
			this.y[i] = curY;
			this.z[i] = curZ;
		}

		// populate the sin and cos tables
		this.sin = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, this.circleDegrees * this.degreeParts, "Stars.sin"));
		this.cos = /** @type {!Float32Array} */ (this.allocator.allocate(Type.Float32, this.circleDegrees * this.degreeParts, "Stars.cos"));

		i = 0;
		while (i < (this.circleDegrees * this.degreeParts)) {
			this.sin[i] = Math.sin((i / this.degreeParts) * this.degToRad);
			this.cos[i] = Math.cos((i / this.degreeParts) * this.degToRad);
			i += 1;
		}
	};

	// convert stars to display position
	Stars.prototype.create2D = function(/** @type {number} */ xOff, /** @type {number} */ yOff, /** @type {number} */ zOff, /** @type {number} */ angle, /** @type {number} */ displayWidth, /** @type {number} */ displayHeight, /** @type {Uint32Array} */ pixelBuffer, /** @type {number} */ blackPixel) {
		var	/** @type {number} */ i = 0,

			// offset in pixel data
			/** @type {number} */ offset = 0,

			// computed star colour
			/** @type {number} */ pixelColour = 0,

			// z distance and x, y position of star
			/** @type {number} */ zDist = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,

			// computed angle and radius
			/** @type {number} */ theta = 0,
			/** @type {number} */ radius = 0,

			// r g b components of background colour
			/** @type {number} */ blackRed = 0,
			/** @type {number} */ blackGreen = 0,
			/** @type {number} */ blackBlue = 0,

			// r g b components of star colour
			/** @type {number} */ currentRed = 0,
			/** @type {number} */ currentGreen = 0,
			/** @type {number} */ currentBlue = 0,

			// half width and height
			/** @const {number} */ halfWidth = displayWidth >> 1,
			/** @const {number} */ halfHeight = displayHeight >> 1,

			// width and height minus 1
			/** @const {number} */ widthMinus1 = displayWidth - 1,
			/** @const {number} */ heightMinus1 = displayHeight - 1,

			/** @type {number} */ starMinusBlackRed = 0,
			/** @type {number} */ starMinusBlackGreen = 0,
			/** @type {number} */ starMinusBlackBlue = 0;

		// check if initialized
		if (!this.initialized) {
			this.init(8192, 8192, 1024);
			this.initialized = true;
		}

		// compute black pixel rgb components
		if (Supports.littleEndian) {
			blackBlue = (blackPixel >> 16) & 0xff;
			blackGreen = (blackPixel >> 8) & 0xff;
			blackRed = blackPixel & 0xff;
		} else {
			blackRed = (blackPixel >> 24) & 0xff;
			blackGreen = (blackPixel >> 16) & 0xff;
			blackBlue = (blackPixel >> 8) & 0xff;
		}
		starMinusBlackRed = this.starColour.red - blackRed;
		starMinusBlackGreen = this.starColour.green - blackGreen;
		starMinusBlackBlue = this.starColour.blue - blackBlue;

		// update each star
		for (i = 0; i < this.numStars; i += 1) {
			// get 2d part of 3d position
			x = this.x[i] + xOff;
			y = this.y[i] + yOff;

			// check if angle is non zero
			if (angle !== 0) {
				// compute radius
				radius = Math.sqrt((x * x) + (y * y));

				// apply angle
				theta = Math.atan2(y, x) * this.radToDeg;

				// add current rotation
				theta += angle;

				// check it is in range
				if (theta < 0) {
					theta += this.circleDegrees;
				} else {
					if (theta >= this.circleDegrees) {
						theta -= this.circleDegrees;
					}
				}

				// convert to part degrees
				theta *= this.degreeParts;
				theta |= 0;

				// compute rotated position
				x = radius * this.cos[theta];
				y = radius * this.sin[theta];
			}

			// create the 2D position
			zDist = (this.z[i] / zOff) * 2;
			//x = ((displayWidth / 2) + (x / zDist)) | 0;
			//y = ((displayHeight / 2) + (y / zDist)) | 0;
			x = (halfWidth + (x / zDist)) | 0;
			y = (halfHeight + (y / zDist)) | 0;

			// check if on display (including the halo)
			//if (x > 0 && x < (displayWidth - 1) && y > 0 && y < (displayHeight - 1)) {
			if (x > 0 && x < widthMinus1 && y > 0 && y < heightMinus1) {
				// compute the pixel buffer offset
				offset = x + y * displayWidth;

				// use the z distance for pixel brightness
				zDist = (1536 / zDist | 0);

				// ensure it's not too bright
				if (zDist > 255) {
					zDist = 255;
				}

				// normalize
				zDist = zDist / 255;

				// check if the pixel is black
				if (pixelBuffer[offset] === blackPixel) {
					// compute the pixel colour components
					currentRed = blackRed + starMinusBlackRed * zDist;
					currentGreen = blackGreen + starMinusBlackGreen * zDist;
					currentBlue = blackBlue + starMinusBlackBlue * zDist;

					// set the pixel
					if (Supports.littleEndian) {
						pixelColour = (0xff << 24) | (currentBlue << 16) | (currentGreen << 8) | currentRed;
					} else {
						pixelColour = (currentRed << 24) | (currentGreen << 16) | (currentBlue << 8) | 0xff;
					}

					// draw the star center
					pixelBuffer[offset] = pixelColour;
				}

				// compute the dimmer colour for the halo
				zDist = zDist / 2;

				// compute the pixel colour components
				currentRed = blackRed + starMinusBlackRed * zDist;
				currentGreen = blackGreen + starMinusBlackGreen * zDist;
				currentBlue = blackBlue + starMinusBlackBlue * zDist;

				// set the pixel
				if (Supports.littleEndian) {
					pixelColour = (0xff << 24) | (currentBlue << 16) | (currentGreen << 8) | currentRed;
				} else {
					pixelColour = (currentRed << 24) | (currentGreen << 16) | (currentBlue << 8) | 0xff;
				}

				// draw left halo
				offset -= 1;
				if (pixelBuffer[offset] === blackPixel) {
					pixelBuffer[offset] = pixelColour;
				}

				// draw right halo
				offset += 2;
				if (pixelBuffer[offset] === blackPixel) {
					pixelBuffer[offset] = pixelColour;
				}

				// draw top halo
				offset -= 1;
				offset -= displayWidth;
				if (pixelBuffer[offset] === blackPixel) {
					pixelBuffer[offset] = pixelColour;
				}

				// draw bottom halo
				offset += (displayWidth + displayWidth);
				if (pixelBuffer[offset] === blackPixel) {
					pixelBuffer[offset] = pixelColour;
				}
			}
		}
	};
