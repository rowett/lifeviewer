// html5 canvas menu library
// LifeViewer UI library.

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

	// TextAlert
	/**
	 * @constructor
	 */
	function TextAlert(/** @type {number} */ appear, /** @type {number} */ hold, /** @type {number} */ disappear, /** @type {CanvasRenderingContext2D} */ context, /** @type {MenuManager} */ menuManager) {
		// menu manager
		/** @type {MenuManager} */ this.menuManager = menuManager;

		// steps for text to appear
		/** @type {number} */ this.textAppear = appear;

		// steps to hold text
		/** @type {number} */ this.textHold = hold;

		// steps for text to disappear
		/** @type {number} */ this.textDisappear = disappear;

		// current text message
		/** @type {string} */ this.message = "";

		// priority message steps
		/** @type {number} */ this.priorityAppear = appear;
		/** @type {number} */ this.priorityHold = hold;
		/** @type {number} */ this.priorityDisappear = disappear;

		// current priority message
		/** @type {string} */ this.priorityMessage = "";

		// flag for pending clear used if message is reset before disappear
		/** @type {boolean} */ this.pendingNormalClear = false;
		/** @type {boolean} */ this.pendingPriorityClear = false;

		// drawing context
		/** @type {CanvasRenderingContext2D} */ this.context = context;

		// whether notification has background
		/** @type {boolean} */ this.txtBg = false;

		// start time for current notification
		/** @type {number} */ this.startTime = 0;

		// start time for priority notification
		/** @type {number} */ this.priorityStart = 0;

		// colour for notifications
		/** @type {string} */ this.colour = "rgb(32,255,255)";

		// colour for priority notifications
		/** @type {string} */ this.priorityColour = "white";

		// iterator for animated priority notification colour
		/** @type {number} */ this.priorityIter = 0;

		// whether animation required for priority notification
		/** @type {boolean} */ this.animate = false;

		// shadow colour for notifications
		/** @type {string} */ this.shadowColour = "black";

		// background colour for notifications
		/** @type {string} */ this.backgroundColour = "black";

		// whether notifications are enabled
		/** @type {boolean} */ this.enabled = false;

		// default font size
		/** @type {number} */ this.defaultFontSize = 30;

		// vertical adjust for notifitions
		/** @type {number} */ this.notificationYOffset = 45;

		// scale
		/** @type {number} */ this.scale = 1;
	}

	// return whether a notification is displayed
	/** @returns {boolean} */
	TextAlert.prototype.displayed = function() {
		var	/** @type {boolean} */ result = false;

		// check if standard or priority message are displayed
		if (this.message !== "" || this.priorityMessage !== "") {
			result = true;
		}

		// return the flag
		return result;
	};

	// clear notification
	TextAlert.prototype.clear = function(/** @type {boolean} */ priority, /** @type {boolean} */ immediately) {
		var	/** @type {number} */	elapsed = 0;

		if (priority) {
			// check if priority message is displayed
			if (this.priorityMessage !== "") {
				// check if immediate clear is required
				if (immediately || this.pendingPriorityClear) {
					this.priorityMessage = "";
					this.pendingPriorityClear = false;
				} else {
					// switch to disappear section
					elapsed = performance.now() - this.priorityStart;
					if (elapsed < this.priorityAppear + this.priorityHold) {
						this.priorityStart = performance.now() - (this.priorityAppear + this.priorityHold);
					}
					this.pendingPriorityClear = true;
				}
			}
		} else {
			// check normal message
			if (this.message !== "") {
				// check if immediate clear is required
				if (immediately || this.pendingNormalClear) {
					this.pendingNormalClear = false;
					this.message = "";
				} else {
					// switch to disappear section
					elapsed = performance.now() - this.startTime;
					if (elapsed < this.textAppear + this.textHold) {
						this.startTime = performance.now() - (this.textAppear + this.textHold);
					}
					this.pendingNormalClear = true;
				}
			}
		}
	};

	// create notification
	TextAlert.prototype.notify = function(/** @type {string} */ message, /** @type {number} */ appear, /** @type {number} */ hold, /** @type {number} */ disappear, /** @type {boolean} */ priority) {
		// create the notification if enabled
		if (this.enabled) {
			// check if this is a priority message
			if (priority) {
				// check if message already displayed
				if (this.priorityMessage !== message) {
					// set priority message
					this.priorityMessage = message;

					// convert frames to milliseconds
					this.priorityAppear = appear * 16;
					this.priorityHold = hold * 16;
					this.priorityDisappear = disappear * 16;

					// set start time to now
					this.priorityStart = performance.now();
					this.pendingPriorityClear = false;

					// clear the priority iterator for colour animation
					this.priorityIter = 0;

					// disable animation
					this.animate = false;
				}
			} else {
				// set normal message
				this.message = message;

				// convert frames to milliseconds
				this.textAppear = appear * 16;
				this.textHold = hold * 16;
				this.textDisappear = disappear * 16;

				// set the start time to now
				this.startTime = performance.now();
				this.pendingNormalClear = false;
			}
		}
	};

	// set animated colour for notification
	TextAlert.prototype.setAnimatedColour = function() {
		var	/** @type {number} */ dR = 0,
			/** @type {number} */ dG = 0,
			/** @type {number} */ dB = 0,
			/** @type {number} */ percent = 0;

		if (this.priorityIter < 128) {
			percent = this.priorityIter / 128;
		} else {
			percent = (255 - this.priorityIter) / 128;
		}

		dR = this.menuManager.fgR * percent + this.menuManager.selectR * (1 - percent);
		dG = this.menuManager.fgG * percent + this.menuManager.selectG * (1 - percent);
		dB = this.menuManager.fgB * percent + this.menuManager.selectB * (1 - percent);

		this.context.fillStyle = "rgb(" + dR + "," + dG + "," + dB + ")";
	};

	// draw notification string
	TextAlert.prototype.draw = function(/** @type {string} */ message, /** @type {boolean} */ isPriority, /** @type {number} */ lineHeight) {
		var	/** @type {number} */ xPos = 0,

			// alpha for background
			/** @type {number} */ alpha = 0;

		// compute x position to center text horizontally
		xPos = this.context.measureText(message).width >> 1;

		// draw background if required
		if (this.txtBg) {
			this.context.fillStyle = this.backgroundColour;
			alpha = this.context.globalAlpha;
			this.context.globalAlpha = alpha * 0.5;
			this.context.fillRect(-xPos - 20, -lineHeight, xPos * 2 + 40, lineHeight * 2);
			this.context.globalAlpha = alpha;
		}

		// draw shadow
		this.context.fillStyle = this.shadowColour;
		this.context.fillText(message, -xPos + 2, 2);

		// draw string
		if (isPriority) {
			// check if animated colour needed
			if (this.animate) {
				this.setAnimatedColour();
				this.priorityIter = (this.priorityIter + 4) & 255;
			} else {
				this.context.fillStyle = this.priorityColour;
			}
		} else {
			this.context.fillStyle = this.colour;
		}
		this.context.fillText(message, -xPos, 0);
	};

	// update notification
	/** @returns {boolean} */
	TextAlert.prototype.updateNotification = function(/** @type {string} */ message, /** @type {number} */ appear, /** @type {number} */ hold, /** @type {number} */ disappear, /** @type {number} */ start, /** @type {number} */ offset, /** @type {boolean} */ isPriority) {
		var	/** @type {number} */ scaleFactor = 0,
			/** @type {number} */ elapsedTime = 0,
			/** @type {number} */ index = 0,

			// default font size when not in thumbnail mode
			/** @type {number} */ fontSize = this.defaultFontSize * this.scale,

			// line height
			/** @type {number} */ lineHeight = (this.defaultFontSize + 2) * this.scale,

			// thumbnail divisor
			/** @type {number} */ thumbDivisor = this.menuManager.thumbnailDivisor,

			// number of pixels from top of display
			/** @type {number} */ fromTop = 60 * this.scale,

			// flag whether to clear message
			/** @type {boolean} */ clearMessage = true;

		// check for noGUI
		if (this.menuManager.noGUI) {
			fromTop = 0;
			offset = this.context.canvas.height / 2;
			this.txtBg = true;
		} else {
			this.txtBg = false;
		}

		// check if there is anything to draw
		if (message !== "") {
			// flag there is nothing to clear
			clearMessage = false;

			// compute the elapsed time
			elapsedTime = performance.now() - start;

			// save context
			this.context.save();

			// check for thumbnail mode
			if (this.menuManager.thumbnail) {
				// check for system messages
				if (isPriority) {
					// vertically center the system message
					fromTop = 0;
					offset = this.context.canvas.height / 2;
				} else {
					// reduce the font size by the thumbnail divisor
					fontSize = (fontSize / thumbDivisor);
					lineHeight = (lineHeight / thumbDivisor) | 0;

					// reduce the offset
					offset = (offset / thumbDivisor) | 0;

					// reduce the pixels from top of display
					fromTop = (fromTop / thumbDivisor) | 0;
				}
			}

			// set the font size
			this.context.font = (fontSize | 0) + "px Arial";

			// scale based on appear or disappear
			this.context.translate(this.context.canvas.width / 2 - 1, fromTop + offset);

			// check for appear
			if (elapsedTime <= appear) {
				// zoom in and increase alpha
				scaleFactor = (elapsedTime / appear);
				scaleFactor *= scaleFactor;
				this.context.globalAlpha = scaleFactor;
				this.context.scale(scaleFactor, scaleFactor);
			} else {
				// check for disappear
				if (elapsedTime > (appear + hold) && elapsedTime <= (appear + hold + disappear)) {
					// zoom out and decrease alpha
					scaleFactor = (disappear - (elapsedTime - (appear + hold))) / disappear;
					scaleFactor *= scaleFactor;
					this.context.globalAlpha = scaleFactor;
					this.context.scale(scaleFactor, scaleFactor);
				}
			}

			// check if finished
			if (elapsedTime > (appear + hold + disappear)) {
				// set the clear message flag
				clearMessage = true;
			} else {
				// check if the message contains a newline
				index = message.indexOf("\\n");
				if (index === -1) {
					// draw the text
					this.draw(message, isPriority, lineHeight);
				} else {
					// draw the first line
					this.draw(message.substring(0, index), isPriority, lineHeight);

					// go to next line
					this.context.translate(0, lineHeight);

					// draw the second line
					this.draw(message.substring(index + 2), isPriority, lineHeight);
				}
			}

			// restore context
			this.context.restore();
		}

		// return the clear message flag
		return clearMessage;
	};

	// update notification
	TextAlert.prototype.update = function() {
		var	/** @type {number} */ yScale = this.menuManager.currentMenu.yScale;

		// update the standard message
		if (this.updateNotification(this.message, this.textAppear, this.textHold, this.textDisappear, this.startTime, (36 + this.notificationYOffset) * yScale, false)) {
			this.message = "";
		}

		// update the priority message
		if (!this.menuManager.thumbnail || this.priorityMessage === "Expand" || this.priorityMessage === "Launch") {
			if (this.updateNotification(this.priorityMessage, this.priorityAppear, this.priorityHold, this.priorityDisappear, this.priorityStart, (this.notificationYOffset * yScale), true)) {
				this.priorityMessage = "";
			}
		}
	};

	// Icon
	/**
	 * @constructor
	 */
	function Icon(/** @type {string} */ name, /** @type {number} */ width, /** @type {number} */ height, /** @type {number} */ number) {
		/** @type {string} */ this.name = name;
		/** @type {number} */ this.width = width;
		/** @type {number} */ this.height = height;
		/** @type {number} */ this.number = number;
	}

	// IconManager
	/**
	 * @constructor
	 */
	function IconManager(/** @type {CanvasRenderingContext2D} */ iconsImage, /** @type {CanvasRenderingContext2D} */ context) {
		// save the drawing context
		/** @type {CanvasRenderingContext2D} */ this.context = context;

		// save the icon image
		/** @type {CanvasRenderingContext2D} */ this.iconsImage = iconsImage;
		/** @type {number} */ this.width = 0;
		/** @type {number} */ this.height = 0;
		/** @type {HTMLCanvasElement} */ this.iconCanvas = null;
		/** @type {CanvasRenderingContext2D} */ this.iconContext = null;
		/** @type {CanvasRenderingContext2D} */ this.convertedImage = null;
		/** @type {CanvasRenderingContext2D} */ this.greyedOutImage = null;
		/** @type {Uint32Array} */ this.iconData32 = null;

		// list of icons
		/** @type {Array} */ this.iconList = [];

		// whether icons need recolouring
		/** @type {boolean} */ this.recolour = true;

		// recolour shade
		/** @type {number} */ this.recolourCol = 0xffffffff;

		// recolour grid shade
		/** @type {number} */ this.recolourGrid = 0xffffffff;

		// shadow shade
		/** @type {number} */ this.shadowCol = 0;

		// greyed out shade
		/** @type {number} */ this.greyedOutCol = 0;

		// whether initialised
		/** @type {boolean} */ this.init = false;

		// scale
		/** @type {number} */ this.scale = 1;
	}

	// set scale
	IconManager.prototype.setScale = function(/** @type {number} */ scale) {
		/** @type {number} */ this.scale = scale;
	};

	// draw icon
	IconManager.prototype.draw = function(/** @type {Icon} */ icon, /** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ locked) {
		var	/** @type {ImageData} */ data = null,
			/** @type {Uint32Array} */ data32 = null,
			/** @type {Uint32Array} */ dest32 = null,
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ destIndex = 0,
			/** @type {number} */ sourceIndex = 0,
			/** @type {number} */ numIcons = this.iconList.length,
			/** @type {number} */ iconWidth = 40,
			/** @type {number} */ iconHeight = 40,
			/** @type {number} */ ix = 0,
			/** @type {number} */ iy = 0,
			/** @type {number} */ shadowCol = this.shadowCol,
			/** @type {number} */ iconFGHex = 0xffffffff,
			/** @type {number} */ iconFG = 255 << 24 | 255 << 16 | 255 << 8 | 255,
			/** @type {HTMLCanvasElement} */ canvas = null;

		// check if image load
		if (this.iconsImage.canvas.width > 0) {
			if (!this.init) {
				this.width = this.iconsImage.canvas.width;
				this.height = this.iconsImage.canvas.height;

				// create a context the same size as the image and draw the image onto it
				this.iconCanvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
				this.iconCanvas.width = this.width;
				this.iconCanvas.height = this.height;
				this.iconContext = /** @type {!CanvasRenderingContext2D} */ (this.iconCanvas.getContext("2d"));

				// create a new image for the converted colours
				canvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
				canvas.width = this.width;
				canvas.height = this.height;
				this.convertedImage = /** @type {!CanvasRenderingContext2D} */ (canvas.getContext("2d"));

				// create a new image for the greyed out icons
				canvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
				canvas.width = this.width;
				canvas.height = this.height;
				this.greyedOutImage = /** @type {!CanvasRenderingContext2D} */ (canvas.getContext("2d"));

				// get the pixel data from the loaded icons
				this.iconContext.clearRect(0, 0, this.iconCanvas.width, this.iconCanvas.height);
				this.iconContext.drawImage(this.iconsImage.canvas, 0, 0);
				data = this.iconContext.getImageData(0, 0, this.iconCanvas.width, this.iconCanvas.height);
				this.iconData32 = new Uint32Array(data.data.buffer);
			}

			// change the pixel colours if required
			if (this.recolour) {
				// get the pixel data from the loaded icons
				data32 = new Uint32Array(this.iconData32);

				// ensure shadow colour is different than foreground colour
				if (shadowCol === iconFG) {
					shadowCol = 0xfffefeff;
				}

				// create the icon shadows
				j = 0;
				for (i = 0; i < numIcons; i += 1) {
					for (iy = iconHeight - 2; iy > 1; iy -= 1) {
						destIndex = j + iy * this.width;
						sourceIndex = destIndex - 2 - this.width - this.width;
						for (ix = iconWidth - 2; ix > 1; ix -= 1) {
							if (data32[destIndex + ix] === 0) {
								if (data32[sourceIndex + ix] === iconFGHex) {
									data32[destIndex + ix] = shadowCol;
								}
							}
						}
					}
					j += iconWidth;
				}

				// change target pixel to greyed out colour
				for (i = 0; i < data32.length; i += 1) {
					if (data32[i] === iconFGHex || data32[i] === 0xff707070) {
						data32[i] = this.greyedOutCol;
					}
				}

				// create the greyed out icons
				data = this.greyedOutImage.createImageData(this.greyedOutImage.canvas.width, this.greyedOutImage.canvas.height);
				dest32 = new Uint32Array(data.data.buffer);
				dest32.set(data32);
				this.greyedOutImage.putImageData(data, 0,0);

				// get the pixel data from the loaded icons again
				data32 = new Uint32Array(this.iconData32);

				// create the icon shadows
				j = 0;
				for (i = 0; i < numIcons; i += 1) {
					for (iy = iconHeight - 2; iy > 1; iy -= 1) {
						destIndex = j + iy * this.width;
						sourceIndex = destIndex - 2 - this.width - this.width;
						for (ix = iconWidth - 2; ix > 1; ix -= 1) {
							if (data32[destIndex + ix] === 0) {
								if (data32[sourceIndex + ix] === 0xffffffff) {
									data32[destIndex + ix] = shadowCol;
								}
							}
						}
					}
					j += iconWidth;
				}

				// change target pixel to new colour
				for (i = 0; i < data32.length; i += 1) {
					if (data32[i] === 0xffffffff) {
						data32[i] = this.recolourCol;
					} else {
						if (data32[i] === 0xff707070) {
							data32[i] = this.recolourGrid;
						}
					}
				}

				// put back the pixel data
				data = this.iconContext.createImageData(this.iconContext.canvas.width, this.iconContext.canvas.height);
				dest32 = new Uint32Array(data.data.buffer);
				dest32.set(data32);
				this.iconContext.putImageData(data, 0, 0);
				this.recolour = false;
				this.init = false;
			}

			if (!this.init) {
				// create a new image with the updated colours
				this.convertedImage.putImageData(data, 0, 0);
				this.init = true;
			}

			// draw the icon onto the canvas
			if (this.scale !== 1) {
				this.context.save();
				this.context.translate(x, y);
				this.context.scale(this.scale, this.scale);
				this.context.imageSmoothingEnabled = true;
				x = 0;
				y = 0;
			}
			if (locked) {
				this.context.drawImage(this.greyedOutImage.canvas, icon.number * icon.width, 0, icon.width, icon.height, x, y, icon.width, icon.height);
			} else {
				this.context.drawImage(this.convertedImage.canvas, icon.number * icon.width, 0, icon.width, icon.height, x, y, icon.width, icon.height);
			}
			if (this.scale !== 1) {
				this.context.restore();
				this.context.imageSmoothingEnabled = false;
			}
		}
	};

	// return number of icons
	/** @returns {number} */
	IconManager.prototype.length = function() {
		return this.iconList.length;
	};

	// return the named icon
	/** @returns {Icon} */
	IconManager.prototype.icon = function(/** @type {string} */ name) {
		var	/** @type {number} */ a,
			/** @type {Array<Icon>} */ i = this.iconList,
			/** @type {number} */ l = this.length(),
			/** @type {Icon} */ result = null;

		// search the list for the named icon
		a = 0;
		while (a < l && !result) {
			if (i[a].name === name) {
				result = i[a];
			} else {
				a += 1;
			}
		}

		return result;
	};

	// add an icon to the list
	IconManager.prototype.add = function(/** @type {string} */ name, /** @type {number} */ width, /** @type {number} */ height) {
		// create new icon
		var	/** @type {number} */ iconNum = this.iconList.length,
			/** @type {Icon} */ newIcon = new Icon(name, width, height, iconNum);

		// add to the list of icons
		this.iconList[iconNum] = newIcon;
	};

	// constants
	var Menu = {
		// orientations
		auto : 0,
		horizontal : 1,
		vertical : 2,

		// menu types
		range : 0,
		button : 1,
		progressBar : 2,
		list : 3,
		label : 4,

		// list selection modes
		single : 0,
		multi : 1,

		// text alignment
		left : 0,
		center : 1,
		right : 2,

		// control position
		north : 0,
		northEast : 1,
		east : 2,
		southEast : 3,
		south : 4,
		southWest : 5,
		west : 6,
		northWest : 7,
		middle : 8
	};

	// MenuItem
	/**
	 * @constructor
	 */
	function MenuItem(/** @type {number} */ id, callback, /** @type {View} */ caller, /** @type {number} */ position, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ width, /** @type {number} */ height,
			/** @type {number|Array<string>} */ lower, /** @type {number} */ upper, /** @type {number|Array<boolean>} */ current, /** @type {number} */ type, /** @type {number} */ orientation, /** @type {boolean} */ valueDisplay, /** @type {string} */ preText, /** @type {string} */ postText, /** @type {number} */ fixed, icon, /** @type {MenuList} */ owner) {
		var	/** @type {number} */ i = 0;

		// id
		/** @type {number} */ this.id = id;

		// owning menu
		/** @type {MenuList} */ this.owner = owner;

		// tool tip
		/** @type {string|Array<string>} */ this.toolTip = null;

		// item in a multi-select that is highlighted
		/** @type {number} */ this.highlightItem = -1;

		// whether multi-select highlight item is locked
		/** @type {boolean} */ this.highlightLocked = false;

		// whether deleted
		/** @type {boolean} */ this.deleted = false;

		// callback
		this.callback = callback;

		// caller
		/** @type {View} */ this.caller = caller;

		// icon (list)
		this.icon = icon;

		// absolute position top left
		/** @type {number} */ this.x = x;
		/** @type {number} */ this.y = y;

		// relative position
		/** @type {number} */ this.relX = x;
		/** @type {number} */ this.relY = y;

		// position type
		/** @type {number} */ this.position = position;

		// width and height
		/** @type {number} */ this.width = width;
		/** @type {number} */ this.height = height;

		// relative width and height
		/** @type {number} */ this.relWidth = width;
		/** @type {number} */ this.relHeight = height;

		// type of menu item
		/** @type {number} */ this.type = type;

		// menu orientation
		/** @type {number} */ this.orientation = orientation;
		if (orientation === Menu.auto) {
			// select orientation based on width and height
			if (width >= height) {
				this.orientation = Menu.horizontal;
			} else {
				this.orientation = Menu.vertical;
			}
		}

		// text orientation
		/** @type {number} */ this.textOrientation = this.orientation;

		// value range represented (order is important)
		this.lower = lower;
		/** @type {number} */ this.upper = upper;

		// current value
		if (type === Menu.range) {
			// allocate value and display value
			this.current = [current, current];
		} else {
			this.current = current;
		}

		// whether to display the value
		/** @type {boolean} */ this.valueDisplay = valueDisplay;

		// text to prefix to the value
		/** @type {string} */ this.preText = preText;

		// text to postfix after the value
		/** @type {string} */ this.postText = postText;

		// decimal places for the value (-1 not numeric)
		/** @type {number} */ this.fixed = fixed;

		// flag for mouse down last update
		/** @type {boolean} */ this.lastMouseDown = false;

		// last mouse position
		/** @type {number} */ this.lastMouseX = -1;
		/** @type {number} */ this.lastMouseY = -1;

		// text alignment
		/** @type {number} */ this.textAlign = Menu.center;

		// whether enabled
		/** @type {boolean} */ this.enabled = true;

		// whether locked
		/** @type {boolean} */ this.locked = false;

		// whether unlock override is on
		/** @type {boolean} */ this.overrideLocked = false;

		// whether individual list items are locked
		/** @type {Array<boolean>} */ this.itemLocked = [];
		if (this.type === Menu.list) {
			for (i = 0; i < /** @type {!Array} */ (lower).length; i += 1) {
				this.itemLocked[i] = false;
			}
		}

		// toggle menu parents
		/** @type {Array} */ this.toggleMenuParents = [];

		// number of toggle menu items
		/** @type {number} */ this.numToggleMenuParents = 0;

		// invert rule
		/** @type {boolean} */ this.invert = false;

		// whether to cascade toggle menu
		/** @type {boolean} */ this.cascade = true;

		// background colour and alpha
		/** @type {string} */ this.bgCol = owner.bgCol;
		/** @type {number} */ this.bgAlpha = owner.bgAlpha;

		// set background colour list
		if (type === Menu.list) {
			/** @type {Array<string>} */ this.bgColList = [];
			for (i = 0; i < /** @type {!Array} */ (lower).length; i += 1) {
				this.bgColList[i] = this.bgCol;
			}
		}

		// foreground colour and alpha
		/** @type {string} */ this.fgCol = owner.fgCol;
		/** @type {number} */ this.fgAlpha = owner.fgAlpha;

		// highlight colour and alpha when mouse is over item
		/** @type {string} */ this.hlCol = owner.hlCol;
		/** @type {number} */ this.hlAlpha = owner.hlAlpha;

		// selected colour and alpha when item selected
		/** @type {string} */ this.selectedCol = owner.selectedCol;
		/** @type {number} */ this.selectedAlpha = owner.selectedAlpha;

		// locked colour and alpha when item locked
		/** @type {string} */ this.lockedCol = owner.lockedCol;
		/** @type {number} */ this.lockedAlpha = owner.lockedAlpha;

		// border colour and alpha
		/** @type {string} */ this.borderCol = owner.borderCol;
		/** @type {number} */ this.borderAlpha = owner.borderAlpha;

		// border thickness (or 0 for no border)
		/** @type {number} */ this.border = owner.border;

		// decompose the font into size and family
		/** @type {number} */ this.fontSize = parseInt(owner.defaultFont.substring(0, owner.defaultFont.indexOf("px")), 10);
		/** @type {string} */ this.fontFamily = owner.defaultFont.substring(owner.defaultFont.indexOf("px") + 3);

		// callback to draw custom icons
		/** @type {function(View):void|null} */ this.drawIconCallback = null;
	}

	// set icon callback
	MenuItem.prototype.setDrawIconCallback = function(/** @type {function(View):void} */ callback) {
		this.drawIconCallback = callback;
	};

	// delete if shown
	MenuItem.prototype.deleteIfShown = function(/** @type {boolean} */ del) {
		if (!this.deleted && del) {
			this.deleted = true;
		}
	};

	// set font
	MenuItem.prototype.setFont = function(/** @type {string} */ font) {
		this.fontSize = parseInt(font.substring(0, font.indexOf("px")), 10);
		this.fontFamily = font.substring(font.indexOf("px") + 3);
	};

	// set item foreground and background colour
	MenuItem.prototype.setColours = function(/** @type {string} */ fg, /** @type {string} */ bg, /** @type {string} */ highlight, /** @type {string} */ selected, /** @type {string} */ locked, /** @type {string} */ border) {
		var	/** @type {number} */ i = 0;

		this.fgCol = fg;
		this.bgCol = bg;
		this.hlCol = highlight;
		this.selectedCol = selected;
		this.lockedCol = locked;
		this.borderCol = border;
		if (this.type === Menu.list) {
			this.bgColList = [];
			for (i = 0; i < /** @type {!Array} */ (this.lower).length; i += 1) {
				this.bgColList[i] = this.bgCol;
			}
		}
	};

	// set border width
	MenuItem.prototype.setBorder = function(/** @type {number} */ border) {
		this.border = border;
	};

	// set a new width
	MenuItem.prototype.setWidth = function(/** @type {number} */ width) {
		this.relWidth = width;
	};

	// set a new height
	MenuItem.prototype.setHeight = function(/** @type {number} */ height) {
		this.relHeight = height;
	};

	// set a new X coordinate
	MenuItem.prototype.setX = function(/** @type {number} */ x) {
		this.relX = x;
	};

	// set a new Y coordinate
	MenuItem.prototype.setY = function(/** @type {number} */ y) {
		this.relY = y;
	};

	// set a new absolute position
	MenuItem.prototype.setPosition = function(/** @type {number} */ position, /** @type {number} */ x, /** @type {number} */ y) {
		this.position = position;
		this.relX = x;
		this.relY = y;
	};

	// calculate item position
	MenuItem.prototype.calculatePosition = function(/** @type {number} */ width, /** @type {number} */ height) {
		var	/** @type {number} */ xScale = this.owner.xScale,
			/** @type {number} */ yScale = this.owner.yScale,
			/** @type {number} */ relXS = this.relX * xScale,
			/** @type {number} */ relYS = this.relY * yScale,
			/** @type {number} */ relWidthS = this.relWidth * xScale,
			/** @type {number} */ relHeightS = this.relHeight * yScale;

		// copy the absolute position from the relative position
		this.x = relXS;
		this.y = relYS;
		this.width = relWidthS;
		this.height = relHeightS;

		// override x or y based on position type
		switch (this.position) {
		// north (top of display)
		case Menu.north:
			// center x
			this.x = ((width - relWidthS) >> 1) + relXS;
			break;

		// north east (top right of display)
		case Menu.northEast:
			// make x relative to right of display
			this.x = width + relXS;
			break;

		// east (right of display)
		case Menu.east:
			// center y
			this.y = ((height - relHeightS) >> 1) + relYS;

			// make x relative to right of display
			this.x = width + relXS;
			break;

		// south east (bottom right of display)
		case Menu.southEast:
			// make x relative to right of display
			this.x = width + relXS;

			// make y relative to bottom of display
			this.y = height + relYS;
			break;

		// south (bottom of display)
		case Menu.south:
			// center x
			this.x = ((width - relWidthS) >> 1) + relXS;

			// make y relative to bottom of display
			this.y = height + relYS;
			break;

		// south west (bottom left of display)
		case Menu.southWest:
			// make y relative to bottom of display
			this.y = height + relYS;
			break;

		// west (left of display)
		case Menu.west:
			// center y
			this.y = ((height - relHeightS) >> 1) + relYS;
			break;

		// north west (top left of display)
		case Menu.northWest:
			// nothing to do since top left is always row 0, column 0
			break;

		// middle
		case Menu.middle:
			// make x and y relative to middle of display
			this.x = ((width - relWidthS) >> 1) + relXS;
			this.y = ((height - relHeightS) >> 1) + relYS;
			break;

		// ignore others
		default:
			break;
		}
	};

	// add a toggle menu parent
	MenuItem.prototype.addToggleMenuParent = function(/** @type {MenuItem} */ parentItem, /** @type {boolean} */ cascade) {
		var	/** @type {number} */ n = this.numToggleMenuParents;

		// save the parent in the list and increment number
		this.toggleMenuParents[n] = [parentItem, cascade];
		n += 1;

		// save the number
		this.numToggleMenuParents = n;
	};

	// add a list of specific items to a toggle menu
	MenuItem.prototype.addItemsToToggleMenu = function(/** @type {Array<MenuItem>} */ itemList, /** @type {Array<MenuItem>} */ noCascadeList) {
		// add the items to the list
		var	/** @type {number} */ i,
			/** @type {number} */ l;

		// find out how many items are in the list to add
		l = itemList.length;

		// add the parent to each item
		for (i = 0; i < l; i += 1) {
			itemList[i].addToggleMenuParent(this, true);
		}

		// add the no-cascade parent to each item
		l = noCascadeList.length;
		for (i = 0; i < l; i += 1) {
			noCascadeList[i].addToggleMenuParent(this, false);
		}
	};

	// check if cursor is over this menu item
	/** @returns {boolean} */
	MenuItem.prototype.mouseIsOver = function(/** @type {number} */ mouseX, /** @type {number} */ mouseY) {
		var	/** @type {boolean} */ result = false;

		// check whether this item is enabled
		if (this.enabled) {
			// check rectangle
			if (mouseX >= this.x && mouseX < this.x + this.width && mouseY >= this.y && mouseY < this.y + this.height) {
				result = true;
			}
		}
		return result;
	};

	// MenuList
	/**
	 * @constructor
	 */
	function MenuList(/** @type {MenuManager} */ manager, /** @type {function(number,View):void} */ callback, /** @type {function(View):void} */ activate, /** @type {View} */ caller, /** @type {CanvasRenderingContext2D} */ context, /** @type {string} */ defaultFont) {
		// manager
		/** @type {MenuManager} */ this.manager = manager;

		// context
		/** @type {CanvasRenderingContext2D} */ this.context = context;

		// x and y scale
		/** @type {number} */ this.xScale = 1;
		/** @type {number} */ this.yScale = 1;

		// default font
		/** @type {string} */ this.defaultFont = defaultFont;

		// whether menu deleted
		/** @type {boolean} */ this.deleted = false;

		// whether menu locked
		/** @type {boolean} */ this.locked = false;

		// mouse position
		/** @type {number} */ this.mouseX = -1;
		/** @type {number} */ this.mouseY = -1;
		/** @type {boolean} */ this.mouseDown = false;
		/** @type {boolean} */ this.clickHappened = false;
		/** @type {number} */ this.origX = -1;
		/** @type {number} */ this.origY = -1;

		// range highlight width
		/** @type {number} */ this.rangeHighlightSize = 6;

		// callback function to update
		/** @type {function(number,View):void} */ this.callback = callback;

		// holds the list of menu items
		/** @type {Array<MenuItem>} */ this.menuItems = [];

		// number of menu items
		/** @type {number} */ this.numMenuItems = 0;

		// background colour and alpha
		/** @type {string} */ this.bgCol = "";
		/** @type {number} */ this.bgAlpha = 0;

		// foreground colour and alpha
		/** @type {string} */ this.fgCol = "";
		/** @type {number} */ this.fgAlpha = 0;

		// highlight colour and alpha when mouse is over item
		/** @type {string} */ this.hlCol = "";
		/** @type {number} */ this.hlAlpha = 0;

		// selected colour and alpha when item selected
		/** @type {string} */ this.selectedCol = "";
		/** @type {number} */ this.selectedAlpha = 0;

		// locked colour and alpha when item locked
		/** @type {string} */ this.lockedCol = "";
		/** @type {number} */ this.lockedAlpha = 0;

		// border colour and alpha
		/** @type {string} */ this.borderCol = "";
		/** @type {number} */ this.borderAlpha = 0;

		// border thickness (or 0 for no border)
		/** @type {number} */ this.border = 0;

		// default orientation (auto bases orientation on the width and height of the item)
		/** @type {number} */ this.defaultOrientation = Menu.auto;

		// active item
		/** @type {number} */ this.activeItem = -1;

		// mouse over item
		/** @type {number} */ this.mouseOverItem = -1;

		// wakeup callback when GUI locked
		/** @type {function(number,number,boolean,View):void|null} */ this.wakeCallback = null;

		// callback when no item drag
		/** @type {function(number,number,boolean,View):void|null} */ this.dragCallback = null;

		// callback when menu activated
		/** @type {function(View):void} */ this.activateCallback = activate;

		// caller object for callbacks
		/** @type {View} */ this.caller = caller;

		// icon manager
		/** @type {IconManager} */ this.iconManager = null;

		// cursor style for controls
		/** @type {string} */ this.cursorControls = "auto";

		// cursor style for background
		/** @type {string} */ this.cursorBackground = "auto";

		// current cursor style
		/** @type {string} */ this.cursorCurrent = "auto";

		// current set cursor style
		/** @type {string} */ this.cursorSet = "auto";
	}

	// resize controls
	MenuList.prototype.resizeControls = function(/** @type {number} */ scale) {
		this.xScale = scale;
		this.yScale = scale;
		this.manager.notification.scale = scale;
	};

	// set menu foreground and background colour
	MenuList.prototype.setColours = function(/** @type {string} */ fg, /** @type {string} */ bg, /** @type {string} */ highlight, /** @type {string} */ selected, /** @type {string} */ locked, /** @type {string} */ border) {
		var	/** @type {number} */ i = 0;

		// set colours for new controls
		this.fgCol = fg;
		this.bgCol = bg;
		this.hlCol = highlight;
		this.selectedCol = selected;
		this.lockedCol = locked;
		this.borderCol = border;

		// set the colours in every control
		for (i = 0; i < this.menuItems.length; i += 1) {
			this.menuItems[i].setColours(fg, bg, highlight, selected, locked, border);
		}
	};

	// set border width
	MenuList.prototype.setBorderWidth = function(/** @type {number} */ border) {
		var	/** @type {number} */ i = 0;

		// set width for new controls
		this.border = border;

		// set width in every control
		for (i = 0; i < this.menuItems.length; i += 1) {
			this.menuItems[i].setBorder(border);
		}
	};

	// check parent toggle menu state for visibility
	/** @returns {boolean} */
	MenuList.prototype.parentMenu = function(/** @type {MenuItem} */ parentItem, /** @type {boolean} */ cascade) {
		var	/** @type {boolean} */ result = false,
			/** @type {number} */ i,
			/** @type {number} */ l = parentItem.numToggleMenuParents;

		// start from this toggle menu
		if (parentItem.type === Menu.list && parentItem.upper === Menu.multi) {
			result = parentItem.current[0];
		} else {
			result = (parentItem.current === parentItem.upper);
		}

		// invert if required
		if (parentItem.invert) {
			result = !result;
		}

		// combine with any parent toggle menus
		if (result && cascade) {
			for (i = 0; i < l; i += 1) {
				result = result && this.parentMenu(parentItem.toggleMenuParents[i][0], parentItem.toggleMenuParents[i][1]);
			}
		}

		return result;
	};

	// set whether this item is enabled (visible) based on any toggle menu parents
	MenuList.prototype.toggleMenu = function(/** @type {MenuItem} */ menuItem) {
		var	/** @type {boolean} */ result = true,
			/** @type {number} */ i,
			/** @type {number} */ l = menuItem.numToggleMenuParents;

		// assume enabled
		result = true;

		// combine with the toggle menu parents state
		for (i = 0; i < l; i += 1) {
			result = result && this.parentMenu(menuItem.toggleMenuParents[i][0], menuItem.toggleMenuParents[i][1]);
		}

		// set the enabled state
		menuItem.enabled = result;
	};

	// initialise menu list
	MenuList.prototype.init = function() {
		var	/** @type {MenuItem} */ currentItem,
			/** @type {number} */ i;

		// iterate over each menu item
		for (i = 0; i < this.numMenuItems; i += 1) {
			currentItem = this.menuItems[i];

			// enable each item
			currentItem.enabled = true;

			// read the current value
			switch (currentItem.type) {
			// range
			case Menu.range:
				if (currentItem.callback) {
					// read the current range value
					currentItem.current = currentItem.callback(currentItem.current, false, this.caller);
				}
				break;

			// list
			case Menu.list:
				if (currentItem.callback) {
					// initialise default item
					currentItem.current = currentItem.callback(currentItem.current, false, this.caller);
				}
				break;

			// ignore others
			default:
				break;
			}

			// process toggle menu items
			this.toggleMenu(currentItem);
		}
	};

	// add list item
	MenuList.prototype.addListItem = function(callback, /** @type {number} */ position, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ width, /** @type {number} */ height, /** @type {Array<string>} */ list, /** @type {number|Array<boolean>} */ current, /** @type {number} */ selection) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, callback, this.caller, position, x, y, width, height, list, selection, current, Menu.list, this.defaultOrientation, true, "", "", -1, [], this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add range item
	MenuList.prototype.addRangeItem = function(/** @type {function(Array,boolean,View):Array} */ callback, /** @type {number} */ position, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ width, /** @type {number} */ height, /** @type {number|Array<string>} */ lower, /** @type {number} */ upper, /** @type {number|Array<boolean>} */ current, /** @type {boolean} */ valueDisplay, /** @type {string} */ preText, /** @type {string} */ postText, /** @type{number} */ fixed) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, callback, this.caller, position, x, y, width, height, lower, upper, current, Menu.range, this.defaultOrientation, valueDisplay, preText, postText, fixed, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add label item
	MenuList.prototype.addLabelItem = function(/** @type {number} */ position, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ width, /** @type {number} */ height, /** @type {string} */ caption) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, null, null, position, x, y, width, height, 0, 0, 0, Menu.label, this.defaultOrientation, true, caption, "", -1, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add button item
	MenuList.prototype.addButtonItem = function(/** @type {function(View):void|null} */ callback, /** @type {number} */ position, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ width, /** @type {number} */ height, /** @type {string} */ caption) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, callback, this.caller, position, x, y, width, height, 0, 0, 0, Menu.button, this.defaultOrientation, true, caption, "", -1, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// add progress bar item
	MenuList.prototype.addProgressBarItem = function(/** @type {number} */ position, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ width, /** @type {number} */ height, /** @type {number} */ lower, /** @type {number} */ upper, /** @type {number} */ current, /** @type {boolean} */ valueDisplay, /** @type {string} */ preText, /** @type {string} */ postText, /** @type {number} */ fixed) {
		// create the item
		this.menuItems[this.numMenuItems] = new MenuItem(this.numMenuItems, null, null, position, x, y, width, height, lower, upper, current, Menu.progressBar, this.defaultOrientation, valueDisplay, preText, postText, fixed, null, this);

		// increment the item number
		this.numMenuItems += 1;

		// return the item
		return this.menuItems[this.numMenuItems - 1];
	};

	// draw shadow string
	MenuList.prototype.drawShadowString = function(/** @type {string} */ string, /** @type {MenuItem} */ item) {
		var	/** @type {number} */ textWidth,
			/** @type {number} */ target,
			/** @type {number} */ i,
			/** @type {number} */ j,
			/** @type {string} */ testString = "",
			/** @type {string} */ ellipsis = "\u2026",
			/** @type {number} */ alignPos;

		// convert the string to a string
		string += String();

		// check there is something to write
		if (string !== "") {
			// set the origin to the center of the menu item
			this.context.save();
			this.context.translate(item.x + item.width / 2, item.y + item.height / 2);

			// set the font
			this.context.font = ((item.fontSize * this.xScale) | 0) + "px " + item.fontFamily;

			// rotate if the item is vertical
			if (item.textOrientation === Menu.vertical) {
				this.context.rotate(90 / 180 * Math.PI);
			}

			// get the text item width
			textWidth = this.context.measureText(string).width;

			// check if the text is wider than the control
			if (item.textOrientation === Menu.vertical) {
				target = item.height;
			} else {
				target = item.width;
			}

			if (textWidth >= target - 6) {
				i = string.length;
				j = 0;

				// find a shorter string that will fit
				if (i) {
					do {
						testString = string.substring(0, j) + ellipsis;
						textWidth = this.context.measureText(testString).width;
						j += 1;
					}
					while (j < i && textWidth <= target - 10);
					j -= 1;
					testString = string.substring(0, j) + ellipsis;
				}
				string = testString;
			}

			// compute the alignment
			switch (item.textAlign) {
			// left aligned
			case Menu.left:
				alignPos = item.width / 2 - 2;
				break;

			// centered
			case Menu.center:
				alignPos = textWidth / 2;
				break;

			// right aligned
			case Menu.right:
				alignPos = textWidth / 2 - (item.width - textWidth) / 2 + 4;
				break;

			// ignore other alignments
			default:
				break;
			}

			// draw the shadow
			this.context.fillStyle = item.bgCol;
			this.context.fillText(string, 2 - alignPos + 0.5, 2 + 0.5);

			// draw the text
			if ((item.locked || this.locked) && !item.overrideLocked) {
				this.context.fillStyle = item.lockedCol;
			} else {
				this.context.fillStyle = item.fgCol;
			}
			this.context.fillText(string, -alignPos + 0.5, 0.5);

			// restore transformation
			this.context.restore();
		}
	};

	// draw label item value
	MenuList.prototype.drawLabelValue = function(/** @type {MenuItem} */ item) {
		var	/** @type {string} */ itemString;

		// set the alpha
		this.context.globalAlpha = this.fgAlpha;

		// build the caption from the pre text
		itemString = item.preText;

		// draw the string
		this.drawShadowString(itemString, item);
	};

	// draw button item value
	MenuList.prototype.drawButtonValue = function(/** @type {MenuItem} */ item) {
		var	/** @type {string} */ itemString;

		// set the alpha
		this.context.globalAlpha = this.fgAlpha;

		// build the caption from the pre text
		itemString = item.preText;

		// draw the string
		this.drawShadowString(itemString, item);
	};

	// draw progress bar item value
	MenuList.prototype.drawProgressBarValue = function(/** @type {MenuItem} */ item) {
		var	/** @type {string} */ itemString,
			/** @type {number} */ markerPos;

		// compute the marker position in the bar
		markerPos = ((/** @type {!number} */ (item.current) - /** @type {!number} */ (item.lower)) / ((item.upper) - /** @type {!number} */ (item.lower)));

		// set the highlight alpha
		this.context.globalAlpha = item.bgAlpha;
		this.context.fillStyle = item.fgCol;

		// scale to the bar item
		if (item.orientation === Menu.horizontal) {
			// horizontal marker
			markerPos *= (item.width - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the marker
			this.context.fillRect(item.x + markerPos, item.y, 1, item.height);
		} else {
			// vertical marker
			markerPos *= (item.height - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the marker
			this.context.fillRect(item.x, item.y + markerPos, item.width, 1);
		}

		// build the caption from the pre text
		itemString = item.preText;

		// check whether to display the caption
		if (item.valueDisplay) {
			// add the value
			if (item.fixed !== -1) {
				itemString += /** @type {!number} */ (item.current).toFixed(item.fixed);
			} else {
				itemString += item.current;
			}

			// add the post text
			itemString += item.postText;
		}

		// draw the string if non-blank
		if (itemString !== "") {
			this.context.globalAlpha = item.fgAlpha;
			this.drawShadowString(itemString, item);
		}
	};

	// draw range item value
	MenuList.prototype.drawRangeValue = function(/** @type {MenuItem} */ item, /** @type {boolean} */ highlight) {
		var	/** @type {number} */ markerPos,
			/** @type {number} */ highlightSize,
			/** @type {string} */ itemString;

		// compute the marker position in the range
		markerPos = (item.current[0] - /** @type {!number} */ (item.lower)) / (item.upper - /** @type {!number} */ (item.lower));

		// get the highlight size
		highlightSize = this.rangeHighlightSize;

		// scale to the range item
		if (item.orientation === Menu.horizontal) {
			// horizontal marker
			markerPos *= (item.width - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the highlight
			if (highlight) {
				this.context.fillStyle = item.hlCol;
				this.context.globalAlpha = item.hlAlpha;

				this.context.fillRect(item.x + markerPos - highlightSize, item.y, highlightSize, item.height);
				this.context.fillRect(item.x + markerPos + 1, item.y, highlightSize, item.height);
			}

			// draw the marker
			if ((item.locked || this.locked) && !item.overrideLocked) {
				this.context.fillStyle = item.lockedCol;
				this.context.globalAlpha = item.lockedAlpha;
			} else {
				this.context.fillStyle = item.fgCol;
				this.context.globalAlpha = item.fgAlpha;
			}
			this.context.fillRect(item.x + markerPos, item.y, 1, item.height);
		} else {
			// vertical marker
			markerPos *= (item.height - 3);
			markerPos = (markerPos + 1) | 0;

			// draw the highlight
			if (highlight) {
				this.context.fillStyle = item.hlCol;
				this.context.globalAlpha = item.hlAlpha;

				this.context.fillRect(item.x, item.y + markerPos - highlightSize, item.width, highlightSize);
				this.context.fillRect(item.x, item.y + markerPos + 1, item.width, highlightSize);
			}

			// draw the marker
			if ((item.locked || this.locked) && !item.overrideLocked) {
				this.context.fillStyle = item.lockedCol;
				this.context.globalAlpha = item.lockedAlpha;
			} else {
				this.context.fillStyle = item.fgCol;
				this.context.globalAlpha = item.fgAlpha;
			}
			this.context.fillRect(item.x, item.y + markerPos, item.width, 1);
		}

		// build the caption from the pre text
		itemString = item.preText;

		// check whether to display the caption
		if (item.valueDisplay) {
			if (item.fixed >= 0) {
				itemString += item.current[1].toFixed(item.fixed);
			} else {
				itemString += item.current[1];
			}
		}

		// add the post text
		itemString += item.postText;

		if (itemString !== "") {
			// draw the string
			this.context.globalAlpha = this.fgAlpha;
			this.drawShadowString(itemString, item);
		}
	};

	// draw toggle item value
	MenuList.prototype.drawToggleValue = function(/** @type {MenuItem} */ item) {
		var	/** @type {string} */ itemString;

		// set the alpha
		this.context.globalAlpha = this.fgAlpha;

		// build the caption from the pre text
		itemString = item.preText;

		// add the value if enabled
		if (item.valueDisplay) {
			itemString += item.current;
		}

		// add the post text
		itemString += item.postText;

		// draw the string
		this.drawShadowString(itemString, item);
	};

	// get grid cell value
	/** @returns {Array<number>} */
	MenuList.prototype.gridCell = function(/** @type {MenuItem} */ item) {
		var	/** @type {number} */ cellX,
			/** @type {number} */ cellY,
			/** @type {number} */ gridX,
			/** @type {number} */ gridY,
			/** @type {number} */ mouseX,
			/** @type {number} */ mouseY;

		// read the grid size
		gridX = /** @type {!number} */ (item.lower);
		gridY = item.upper;

		mouseX = this.mouseX;
		mouseY = this.mouseY;

		// check item is in range
		if (mouseX < item.x) {
			mouseX = item.x;
		} else {
			if (mouseX >= item.x + item.width) {
				mouseX = item.x + item.width - 1;
			}
		}
		if (mouseY < item.y) {
			mouseY = item.y;
		} else {
			if (mouseY >= item.y + item.height) {
				mouseY = item.y + item.height - 1;
			}
		}

		// find the cell
		cellX = ((mouseX - item.x) / gridX)|0;
		cellY = ((mouseY - item.y) / gridY)|0;

		// return the cell
		return [cellX, cellY];
	};

	// draw list values
	MenuList.prototype.drawListValue = function(/** @type {MenuItem} */ item, /** @type {boolean} */ highlight) {
		var	/** @type {number} */ i,
			/** @type {number} */ l,
			/** @type {number} */ itemSize,
			/** @type {string} */ text,
			/** @type {number} */ itemNum,
			/** @type {Array} */ list,
			// get the item position and size
			/** @type {number} */ x = item.x,
			/** @type {number} */ y = item.y,
			/** @type {number} */ width = item.width,
			/** @type {number} */ height = item.height,
			/** @type {number} */ orientation = item.orientation,
			values = item.current;

		// get the list items
		list = /** @type {!Array} */ (item.lower);
		l = list.length;
		if (item.orientation === Menu.horizontal) {
			itemSize = width / l;
		} else {
			itemSize = height / l;
		}

		// draw the set item or items
		this.context.globalAlpha = item.selectedAlpha;
		this.context.fillStyle = item.selectedCol;

		if (item.upper === Menu.single) {
			// single so draw set item
			i =  /** @type {number} */ (item.current);
			if (i >= 0 && i < l) {
				if (item.orientation === Menu.horizontal) {
					this.context.fillRect(x + i * itemSize + 1, y + 1, itemSize - 2, height - 2);
				} else {
					this.context.fillRect(x + 1, y + 1 + i * itemSize, width - 2, itemSize - 2);
				}
			}
		} else {
			// multi so draw all set items
			if (item.orientation === Menu.horizontal) {
				for (i = 0; i < l; i += 1) {
					if (values[i]) {
						this.context.fillRect(x + i * itemSize + 1, y + 1, itemSize - 2, height - 2);
					}
				}

				// for since item lists (typically used as toggle buttons) show +/x at top right
				if (l === 1) {
					// set colour based on whether item is locked
					if ((item.locked || this.locked) && !item.overrideLocked) {
						this.context.strokeStyle = item.lockedCol;
						this.context.globalAlpha = item.lockedAlpha;
					} else {
						this.context.strokeStyle = item.borderCol;
						this.context.globalAlpha = item.borderAlpha;
					}

					// if the item is selected draw an x
					this.context.beginPath();
					if (values[0]) {
						this.context.moveTo(x + itemSize - 6 + 0.5, y + 5 + 0.5);
						this.context.lineTo(x + itemSize - 2 + 0.5, y + 1 + 0.5);
						this.context.moveTo(x + itemSize - 2 + 0.5, y + 5 + 0.5);
						this.context.lineTo(x + itemSize - 6 + 0.5, y + 1 + 0.5);
					} else {
						// otherwise draw a +
						this.context.moveTo(x + itemSize - 4 + 0.5, y + 5 + 0.5);
						this.context.lineTo(x + itemSize - 4 + 0.5, y + 1 + 0.5);
						this.context.moveTo(x + itemSize - 6 + 0.5, y + 3 + 0.5);
						this.context.lineTo(x + itemSize - 2 + 0.5, y + 3 + 0.5);
					}
					this.context.stroke();
				}
			} else {
				for (i = 0; i < l; i += 1) {
					if (values[i]) {
						this.context.fillRect(x + 1, y + 1 + i * itemSize, width - 2, itemSize - 2);
					}
				}
			}
		}

		// draw highlight if required
		item.highlightLocked = false;
		if (highlight) {
			this.context.globalAlpha = item.hlAlpha;
			this.context.fillStyle = item.hlCol;

			if (item.orientation === Menu.horizontal) {
				itemNum = (((this.mouseX - x) / width) * l) | 0;
				if (itemNum >= 0 && itemNum < l) {
					if (!item.itemLocked[itemNum]) {
						this.context.fillRect(x + itemNum * itemSize + 0.5, y + 0.5, itemSize - 1, height - 1);
					} else {
						item.highlightLocked = true;
					}
				}
			} else {
				itemNum = (((this.mouseY - y) / height) * l) | 0;
				if (itemNum >= 0 && itemNum < l) {
					if (!item.itemLocked[itemNum]) {
						this.context.fillRect(x + 0.5, y + 0.5 + itemNum * itemSize, width - 1, itemSize - 1);
					} else {
						item.highlightLocked = true;
					}
				}
			}

			// save the highlight item
			item.highlightItem = itemNum;
		} else {
			// mark no highlight item
			item.highlightItem = -1;
		}

		// draw the icons if present
		this.context.globalAlpha = this.fgAlpha;
		if (item.orientation === Menu.horizontal) {
			for (i = 0; i < l; i += 1) {
				if (item.icon[i]) {
					this.iconManager.draw(item.icon[i], item.x + itemSize * i, item.y, this.locked || item.locked || item.itemLocked[i]);
				}
			}
		} else {
			for (i = 0; i < l; i += 1) {
				if (item.icon[i]) {
					this.iconManager.draw(item.icon[i], item.x, item.y + itemSize * i, this.locked || item.locked || item.itemLocked[i]);
				}
			}
		}

		// draw the items
		this.context.globalAlpha = item.fgAlpha;
		this.context.fillStyle = item.fgCol;
		if (orientation === Menu.horizontal) {
			// draw each item
			for (i = 0; i < l; i += 1) {
				text = list[i];
				if (text !== "") {
					this.context.save();
					this.context.translate((0.5 + (i - l / 2)) * itemSize, 0);
					this.drawShadowString(text, item);
					this.context.restore();
				}
			}
		} else {
			for (i = 0; i < l; i += 1) {
				text = list[i];
				if (text !== "") {
					this.context.save();
					this.context.translate(0, (0.5 + (i - l / 2)) * itemSize);
					this.drawShadowString(text, item);
					this.context.restore();
				}
			}
		}
	};

	// draw menu item
	MenuList.prototype.drawItem = function(/** @type {MenuItem} */ item, /** @type {boolean} */ mouseIsOver, /** @type {number} */ itemNum, /** @type {number} */ activeNum, /** @type {boolean} */ touch) {
		var	/** @type {number} */ markerPos,
			/** @type {boolean} */ highlight,
			/** @type {number} */ highlightSize,
			/** @type {number} */ markerX,
			/** @type {number} */ markerY,
			/** @type {number} */ mX,
			/** @type {number} */ mY,
			/** @type {number} */ i,
			/** @type {number} */ l,
			/** @type {number} */ w,
			/** @type {boolean} */ canHighlight = true;

		// highlight disabled if touch events just caused a click
		if (mouseIsOver && !this.mouseDown && touch) {
			canHighlight = false;
		}

		// button and toggle types use the highlight colour as the background if active or no active item and mouse over
		if (canHighlight && (itemNum === activeNum || (activeNum === -1 && mouseIsOver)) && (item.type === Menu.button)) {
			this.context.fillStyle = item.hlCol;
			this.context.globalAlpha = item.hlAlpha;
		} else {
			// use the background colour
			this.context.fillStyle = item.bgCol;
			this.context.globalAlpha = item.bgAlpha;
		}

		// draw the background
		switch (item.type) {
		// progress bar
		case Menu.progressBar:
			// compute the marker position
			markerPos = (/** @type {!number} */ (item.current) - /** @type {!number} */ (item.lower)) / (item.upper - /** @type {!number} */ (item.lower));

			// set selected colour
			this.context.fillStyle = item.selectedCol;
			this.context.globalAlpha = item.selectedAlpha;

			// check orientation
			if (item.orientation === Menu.horizontal) {
				// horizontal marker
				markerPos *= (item.width - 3);
				markerPos = (markerPos + 1) | 0;

				// draw highlight
				this.context.fillRect(item.x, item.y, markerPos, item.height);

				// draw background
				this.context.fillStyle = item.bgCol;
				this.context.globalAlpha = item.bgAlpha;
				this.context.fillRect(item.x + markerPos, item.y, item.width - markerPos, item.height);
			} else {
				// vertical
				markerPos *= (item.height - 3);
				markerPos = (markerPos + 1) | 0;

				// draw highlight
				this.context.fillRect(item.x, item.y, item.width, markerPos);

				// draw background
				this.context.fillStyle = item.bgCol;
				this.context.fillRect(item.x, item.y + markerPos, item.width, item.height - markerPos);
			}
			break;

		// range
		case Menu.range:
			// compute the marker position in the range
			markerPos = (item.current[0] - /** @type {!number} */ (item.lower)) / (item.upper - /** @type {!number} */ (item.lower));
			highlight = canHighlight && ((itemNum === activeNum) || (activeNum === -1 && mouseIsOver));

			// get the highlight size
			highlightSize = 1;
			if (highlight) {
				highlightSize = this.rangeHighlightSize;

				// scale to the range item
				if (item.orientation === Menu.horizontal) {
					// horizontal marker
					markerPos *= (item.width - 3);
					markerPos = (markerPos + 1) | 0;

					// draw left part
					markerX = markerPos - highlightSize;
					if (markerX > 0) {
						this.context.fillRect(item.x, item.y, markerX, item.height);
					}

					// draw right part
					markerX = 1 + markerPos + highlightSize;
					if (markerX < item.width) {
						this.context.fillRect(item.x + markerX, item.y, item.width - markerX, item.height);
					}
				} else {
					// vertical marker
					markerPos *= (item.height - 3);
					markerPos = (markerPos + 1) | 0; 

					// draw top part
					markerY = markerPos - highlightSize;
					if (markerY > 0) {
						this.context.fillRect(item.x, item.y, item.width, markerY);
					}

					// draw bottom part
					markerY = 1 + markerPos + highlightSize;
					if (markerY < item.height) {
						this.context.fillRect(item.x, item.y + markerY, item.width, item.height - markerY);
					}
				}
			} else {
				// no highlight
				this.context.fillRect(item.x, item.y, item.width, item.height);
			}
			break;

		// list
		case Menu.list:
			l = /** @type {!Array} */ (item.lower).length;
			if (item.orientation === Menu.horizontal) {
				w = item.width / l;
				for (i = 0; i < l; i += 1) {
					this.context.fillStyle = item.bgColList[i];
					this.context.fillRect(item.x + i * w + 1, item.y + 1, w - 2, item.height - 2);
				}
			} else {
				w = item.height / l;
				for (i = 0; i < l; i += 1) {
					this.context.fillStyle = item.bgColList[i];
					this.context.fillRect(item.x + 1, item.y + 1 + i * w, item.width - 2, w - 2);
				}
			}
			break;

		// other types (draw rectangle)
		default:
			this.context.fillRect(item.x, item.y, item.width, item.height);
			break;
		}

		// draw the icon if present
		if (item.type !== Menu.list) {
			if (item.icon) {
				// draw the icon
				this.context.globalAlpha = item.fgAlpha;
				this.iconManager.draw(item.icon, item.x, item.y, this.locked || item.locked);
			}
		}

		// draw custom icons if callback supplied
		if (item.drawIconCallback !== null) {
			item.drawIconCallback(this.caller);
		}

		// draw the border if non-zero
		if (item.border > 0) {
			// set foreground colour and alpha
			if ((item.locked || this.locked) && !item.overrideLocked) {
				this.context.strokeStyle = item.lockedCol;
				this.context.globalAlpha = item.lockedAlpha;
			} else {
				this.context.strokeStyle = item.borderCol;
				this.context.globalAlpha = item.borderAlpha;
			}

			// set border width
			this.context.lineWidth = item.border;

			// draw the border
			switch (item.type) {
			case Menu.label:
				// draw nothing
				break;

			case Menu.list:
				// draw boxes around each list item
				l = /** @type {!Array} */ (item.lower).length;
				if (item.orientation === Menu.horizontal) {
					w = item.width / l;
					for (i = 0; i < l; i += 1) {
						if (this.locked || item.locked || item.itemLocked[i]) {
							this.context.strokeStyle = item.lockedCol;
							this.context.globalAlpha = item.lockedAlpha;
						} else {
							this.context.strokeStyle = item.borderCol;
							this.context.globalAlpha = item.borderAlpha;
						}
						this.context.strokeRect(item.x + 0.5 + i * w, item.y + 0.5, w - 1, item.height - 1);
					}
				} else {
					w = item.height / l;
					for (i = 0; i <l; i += 1) {
						if (this.locked || item.locked || item.itemLocked[i]) {
							this.context.strokeStyle = item.lockedCol;
							this.context.globalAlpha = item.lockedAlpha;
						} else {
							this.context.strokeStyle = item.borderCol;
							this.context.globalAlpha = item.borderAlpha;
						}
						this.context.strokeRect(item.x + 0.5, item.y + 0.5 + i * w, item.width - 1, w - 1);
					}
				}
				break;

			default:
				// other types (draw rectangle)
				this.context.strokeRect(item.x + 0.5, item.y + 0.5, item.width - 1, item.height - 1);
				break;
			}
		}

		// draw the value with the foreground colour
		switch (item.type) {
		// button
		case Menu.button:
			this.drawButtonValue(item);
			break;

		// label
		case Menu.label:
			this.drawLabelValue(item);
			break;

		// range
		case Menu.range:
			this.drawRangeValue(item, canHighlight && ((itemNum === activeNum) || (activeNum === -1 && mouseIsOver)));
			break;

		// progress bar
		case Menu.progressBar:
			this.drawProgressBarValue(item);
			break;

		// list
		case Menu.list:
			this.drawListValue(item, canHighlight && ((itemNum === activeNum) || (activeNum === -1 && mouseIsOver)));
			break;

		// ignore others
		default:
			break;
		}

		// check if the item is changed
		if (itemNum === activeNum) {
			switch (item.type) {
			// range
			case Menu.range:
				// update the range position
				mY = this.mouseY;

				// vertical orientation
				if (item.orientation === Menu.vertical) {
					// ensure Y is in range
					if (mY < item.y) {
						mY = item.y;
					} else {
						if (mY > item.y + item.height - 1) {
							mY = item.y + item.height - 1;
						}
					}
					i = ((mY - item.y) / (item.height - 1)) * (item.upper - /** @type {!number} */ (item.lower)) + /** @type {!number} */ (item.lower);
					if (/** @type {!number} */ (item.lower) < item.upper) {
						if (i < /** @type {!number} */ (item.lower)) {
							i = /** @type {!number} */ (item.lower);
						}
						if (i > item.upper) {
							i = item.upper;
						}
					} else {
						if (i < item.upper) {
							i = item.upper;
						}
						if (i > /** @type {!number} */ (item.lower)) {
							i = /** @type {!number} */ (item.lower);
						}
					}
					item.current[0] = i;
				} else {
					// horizontal orientation
					mX = this.mouseX;

					// ensure X is in range
					if (mX < item.x) {
						mX = item.x;
					} else {
						if (mX > item.x + item.width - 1) {
							mX = item.x + item.width - 1;
						}
					}
					i = ((mX - item.x) / (item.width - 1)) * (item.upper - /** @type {!number} */ (item.lower)) + /** @type {!number} */ (item.lower);
					if (/** @type {!number} */ (item.lower) < item.upper) {
						if (i < /** @type {!number} */ (item.lower)) {
							i = /** @type {!number} */ (item.lower);
						}
						if (i > item.upper) {
							i = item.upper;
						}
					} else {
						if (i < item.upper) {
							i = item.upper;
						}
						if (i > /** @type {!number} */ (item.lower)) {
							i = /** @type {!number} */ (item.lower);
						}
					}
					item.current[0] = i;
				}

				// execute callback
				if (item.callback) {
					item.current = item.callback(item.current, true, item.caller);
				}
				break;

			// ignore others
			default:
				break;
			}
		}

		// check if this item was clicked
		if (mouseIsOver && !this.mouseDown && item.lastMouseDown) {
			switch (item.type) {
			// button clicked
			case Menu.button:
				// execute callback
				if (item.callback) {
					item.callback(item.caller);
				}
				break;

			// list clicked
			case Menu.list:
				// determine which item clicked
				l = /** @type {!Array} */ (item.lower).length;
				if (item.orientation === Menu.horizontal) {
					w = (((this.mouseX - item.x) / item.width) * l) | 0;
				} else {
					w = (((this.mouseY - item.y) / item.height) * l) | 0;
				}

				// check whether single select or multi
				if (item.upper === Menu.single) {
					if (!item.itemLocked[w]) {
						if (item.callback) {
							item.current = item.callback(w, true, item.caller);
						} else {
							item.current = w;
						}
					}
				} else {
					// multi select so invert current item
					if (!item.itemLocked[w]) {
						item.current[w] = !item.current[w];

						if (item.callback) {
							item.callback(item.current, true, item.caller);
						}
					}
				}
				break;

			// ignore others
			default:
				break;
			}
		}

		// remember the last mouse down state for this item
		if (mouseIsOver && itemNum === activeNum) {
			item.lastMouseDown = this.mouseDown;
			item.lastMouseX = this.mouseX;
			item.lastMouseY = this.mouseY;
		} else {
			// if mouse up then forget state
			item.lastMouseDown = false;
			item.lastMouseX = -1;
			item.lastMouseY = -1;
		}
	};

	// set background cursor style
	MenuList.prototype.setBackgroundCursor = function(/** @type {string} */ cursor) {
		this.cursorBackground = cursor;
	};

	// draw menu items on the given context and return whether to toggle menus
	/** @returns {boolean} */
	MenuList.prototype.drawMenu = function() {
		var	/** @type {MenuItem} */ currentItem = null,
			/** @type {boolean} */ mouseIsOver = false,
			/** @type {number} */ activeItem = this.activeItem,
			/** @type {number} */ i = 0,
			/** @type {boolean} */ result = false,
			/** @type {boolean} */ currentLocked = false,
			/** @type {number} */ canvasWidth = this.context.canvas.width,
			/** @type {number} */ canvasHeight = this.context.canvas.height,
			/** @type {number} */ mouseOverGlobalItem = -1;

		// flag no need to toggle menus
		result = false;

		// clear mouse over item
		this.mouseOverItem = -1;

		// check whether menu is deleted
		if (this.deleted) {
			// check for wakeup
			if (this.mouseDown) {
				if (this.activeItem !== -2) {
					this.origX = this.mouseX;
					this.origY = this.mouseY;
					this.lastMouseX = this.mouseX;
					this.lastMouseY = this.mouseY;
					this.activeItem = -2;
				} else {
					// call drag callback if set and menu not locked
					if (this.dragCallback && !this.locked) {
						this.dragCallback(this.mouseX, this.mouseY, this.mouseDown, this.caller);
					}
				}
			} else {
				if (this.activeItem === -2) {
					if (this.dragCallback && !this.locked) {
						this.dragCallback(this.mouseX, this.mouseY, this.mouseDown, this.caller);
					}
					// check if mouse moved since mouse down
					if (this.mouseX === this.origX && this.mouseY === this.origY) {
						if (this.wakeCallback) {
							// ignore click if getting focus
							if (this.manager.clickToInteract) {
								this.manager.clickToInteract = false;
							} else {
								this.wakeCallback(this.mouseX, this.mouseY, this.mouseDown, this.caller);
							}
						}
					}
				}
				if (!this.mouseDown) {
					this.activeItem = -1;
				}
			}
		} else {
			// get the current active item
			activeItem = this.activeItem;

			// set text alignment
			this.context.textAlign = "left";

			// draw each item
			for (i = 0; i < this.numMenuItems; i += 1) {
				currentItem = this.menuItems[i];

				// ignore item if it is deleted
				if (!currentItem.deleted) {
					// update item position
					currentItem.calculatePosition(canvasWidth, canvasHeight);

					// check if the mouse is over the item
					mouseIsOver = false;
					if (currentItem.mouseIsOver(this.mouseX, this.mouseY)) {
						// mouse is over a control (used to set mouse pointer)
						mouseOverGlobalItem = i;

						// check if the item is locked
						if ((currentItem.locked || this.locked) && !currentItem.overrideLocked) {
							currentLocked = true;
						} else {
							mouseIsOver = true;
						}
					}

					// update the mouse over item
					if (mouseIsOver && !this.mouseDown) {
						this.mouseOverItem = i;
					}

					// update active item if no active item and mouse down over an item and the item can respond to a click
					if ((this.mouseDown && activeItem === -1 && mouseIsOver) || (mouseIsOver && this.clickHappened)) {
						if (currentItem.type !== Menu.label) {
							activeItem = i;
							if (this.clickHappened) {
								currentItem.lastMouseDown = true;
							}
						}
					}

					// if the current item is locked and it is the active item then clear active item
					if ((i === activeItem) && ((currentItem.locked || this.locked) && !currentItem.overrideLocked)) {
						activeItem = -1;
						mouseIsOver = false;
					}

					// draw the item
					if (currentItem.enabled) {
						this.drawItem(currentItem, mouseIsOver, i, activeItem, this.manager.eventWasTouch);
					}
				}
			}

			// if the active item is a toggle menu process it
			if (activeItem >= 0 && !this.mouseDown) {
				// flag we need to toggle menus
				result = true;
			}

			// check for mouse down on background
			if (this.mouseDown && activeItem === -1 && !currentLocked) {
				activeItem = -2;
			}

			// check for background drag
			if (activeItem === -2) {
				// call drag callback if set and menu not locked
				if (this.dragCallback && !this.locked) {
					this.dragCallback(this.mouseX, this.mouseY, this.mouseDown, this.caller);
				}
			}

			// reset active item if mouse up
			if (!this.mouseDown) {
				activeItem = -1;
			}

			// save active item
			this.activeItem = activeItem;

			// reset global alpha
			this.context.globalAlpha = 1;
		}

		// update mouse pointer
		if (mouseOverGlobalItem >= 0 && !this.menuItems[mouseOverGlobalItem].locked) {
			// check what type of control the mouse is over
			if (this.menuItems[mouseOverGlobalItem].type === Menu.range) {
				if (this.menuItems[mouseOverGlobalItem].orientation === Menu.auto || this.menuItems[mouseOverGlobalItem].orientation === Menu.horizontal) {
					this.cursorCurrent = "ew-resize";
				} else {
					this.cursorCurrent = "ns-resize";
				}
			} else {
				this.cursorCurrent = this.cursorControls;
			}
		} else {
			this.cursorCurrent = this.cursorBackground;
		}

		// return flag for toggle menus
		return result;
	};

	// menu manager
	/**
	 * @constructor
	 */
	function MenuManager(/** @type {HTMLCanvasElement} */ mainCanvas, /** @type {CanvasRenderingContext2D} */ mainContext, /** @type {string} */ defaultFont, /** @type {IconManager} */ iconManager, /** @type {View} */ caller, /** @type {Function} */ gotFocus) {
		var	/** @type {MenuManager} */ me = this,
			/** @type {number} */ i = 0;

		// window zoom
		/** @type {number} */ this.windowZoom = 1;

		// refresh rate
		/** @type {number} */ this.refreshRate = Controller.refreshRate;

		// whether event processed
		/** @type {boolean} */ this.processedEvent = true;

		// whether updates are idle
		/** @type {boolean} */ this.idle = true;

		// minimum tooltip Y offset
		/** @type {number} */ this.minToolTipY = 40;

		// minimum tooltip X offset
		/** @type {number} */ this.minToolTipX = 40;

		// tooltip delay
		/** @type {number} */ this.toolTipDelay = 50;

		// current tooltip counter
		/** @type {number} */ this.toolTipCounter = 0;

		// last tooltip control
		/** @type {number} */ this.toolTipControl = -1;

		// last tooltip control multi-item
		/** @type {number} */ this.toolTipMulti = -1;

		// last active control to stop tooltip once item clicked
		/** @type {number} */ this.toolTipLastActive = -1;

		// flag for passing up mouse events
		/** @type {boolean} */ this.passEvents = false;

		// caller for callbacks
		/** @type {View} */ this.caller = caller;

		// whether GUI disabled
		/** @type {boolean} */ this.noGUI = false;

		// whether RLE copy disabled
		/** @type {boolean} */ this.noCopy = false;

		// whether thumbnail mode active
		/** @type {boolean} */ this.thumbnail = false;

		// whether thumbnail launch mode active
		/** @type {boolean} */ this.thumbLaunch = false;

		// thumbnail divisor
		/** @type {number} */ this.thumbnailDivisor = 4;

		// got focus callback
		/** @type {Function} */ this.focusCallback = gotFocus;

		// click to interact flag
		/** @type {boolean} */ this.clickToInteract = false;

		// whether canvas has focus
		/** @type {boolean} */ this.hasFocus = false;

		// auto update flag
		/** @type {boolean} */ this.autoUpdate = true;

		// update scheduled flag
		/** @type {boolean} */ this.updateScheduled = false;

		// count of updates to run
		/** @type {number} */ this.updateCount = 1;

		// default update count
		/** @type {number} */ this.defaultUpdateCount = 8;

		// default hotkey colour
		/** @type {string} */ this.hotkeyCol = "rgb(32,255,255)";

		// default background colour
		/** @type {string} */ this.bgCol = "black";
		/** @type {number} */ this.bgAlpha = 0.7;

		// background colour as hex for comparison (this is format returned from ctx.fillStyle())
		/** @type {string} */ this.bgColHex = "#000000";

		// default foreground colour
		/** @type {string} */ this.fgCol = "white";
		/** @type {number} */ this.fgAlpha = 1.0;
		/** @type {number} */ this.fgR = 0;
		/** @type {number} */ this.fgG = 0;
		/** @type {number} */ this.fgB = 0;

		// default highlight colour
		/** @type {string} */ this.hlCol = "rgb(0,240,32)";
		/** @type {number} */ this.hlAlpha = 0.7;

		// default selected colour
		/** @type {string} */ this.selectedCol = "blue";
		/** @type {number} */ this.selectedAlpha = 0.7;
		/** @type {number} */ this.selectedR = 0;
		/** @type {number} */ this.selectedG = 0;
		/** @type {number} */ this.selectedB = 0;

		// default locked colour
		/** @type {string} */ this.lockedCol = "grey";
		/** @type {number} */ this.lockedAlpha = 1.0;

		// border colour and alpha
		/** @type {string} */ this.borderCol = "rgb(32,255,255)";
		/** @type {number} */ this.borderAlpha = 1.0;

		// default border width
		/** @type {number} */ this.border = 1;

		// callback
		this.callbackFunction = (function(/** @type {MenuManager} */ me) { return function() { me.processCallback(me); }; }(this));

		// icon manager
		/** @type {IconManager} */ this.iconManager = iconManager;

		// main drawing canvas
		/** @type {HTMLCanvasElement} */ this.mainCanvas = mainCanvas;

		// main drawing context
		/** @type {CanvasRenderingContext2D} */ this.mainContext = mainContext;

		// mouse status
		/** @type {boolean} */ this.mouseDown = false;
		/** @type {number} */ this.mouseLastX = -1;
		/** @type {number} */ this.mouseLastY = -1;

		// whether last event was touch
		/** @type {boolean} */ this.eventWasTouch = false;

		// id for up to two touch points
		/** @type {number} */ this.currentTouchId1 = -1;
		/** @type {number} */ this.currentTouchId2 = -1;

		// location for two touch points
		/** @type {number} */ this.touchId1X = -1;
		/** @type {number} */ this.touchId1Y = -1;
		/** @type {number} */ this.touchId2X = -1;
		/** @type {number} */ this.touchId2Y = -1;

		// callback when pinch happens
		/** @type {function(number,number,number,number,number,View):void|null} */ this.pinchCallback = null;

		// active menu list
		/** @type {MenuList} */ this.currentMenu = null;

		// default menu font
		/** @type {string} */ this.defaultFont = defaultFont;

		// whether to display timing information
		/** @type {boolean} */ this.showTiming = false;

		// whether to display extended timing information
		/** @type {boolean} */ this.showExtendedTiming = false;

		// last update
		/** @type {number} */ this.lastUpdate = performance.now();

		// last timings
		/** @type {number} */ this.numTimings = 5;
		/** @type {number} */ this.timingIndex = 0;
		/** @type {Array<number>} */ this.lastMenu = [];
		/** @type {Array<number>} */ this.lastWork = [];
		/** @type {Array<number>} */ this.lastFrame = [];

		// initialise timing
		for (i = 0; i < this.numTimings; i += 1) {
			this.lastMenu[i] = 0;
			this.lastWork[i] = 0;
			this.lastFrame[i] = 0;
		}

		// new menu to load
		/** @type {MenuList} */ this.loadMenu = null;

		// flag if toggle processing required
		/** @type {boolean} */ this.toggleRequired = false;

		// notification
		/** @type {TextAlert} */ this.notification = new TextAlert(25, 100, 25, mainContext, this);
		/** @type {string} */ this.notification.colour = this.fgCol;
		/** @type {string} */ this.notification.priorityColour = this.fgCol;

		// last mouse up time
		/** @type {number} */ this.lastMouseUp = performance.now();

		// whether update processed since last mouse down
		/** @type {boolean} */ this.updateSinceMouseDown = false;

		// whether a click happened (mouse up + mouse down before update)
		/** @type {boolean} */ this.clickHappened = false;

		// canvas offset
		/** @type {number} */ this.offsetLeft = 0;
		/** @type {number} */ this.offsetTop = 0;

		// time interval list
		/** @type {Array<number>} */ this.timeIntervals = [];

		// running total for load
		/** @type {number} */ this.loadTotal = 0;
		/** @type {number} */ this.loadCount = 0;

		// register event listeners for canvas click
		registerEvent(mainCanvas, "mousedown", function(/** @type {MouseEvent} */ event) {me.canvasMouseDown(me, event);}, false);
		registerEvent(mainCanvas, "mousemove", function(/** @type {MouseEvent} */ event) {me.canvasMouseMove(me, event);}, false);
		registerEvent(mainCanvas, "mouseup", function(/** @type {MouseEvent} */ event) {me.canvasMouseUp(me, event);}, false);
		registerEvent(mainCanvas, "mouseover", function(/** @type {MouseEvent} */ event) {me.canvasMouseOver(me, event);}, false);
		registerEvent(mainCanvas, "mouseout", function(/** @type {MouseEvent} */ event) {me.canvasMouseOut(me, event);}, false);

		// register event listeners for touch
		registerEvent(mainCanvas, "touchstart", function(/** @type {TouchEvent} */ event) {me.touchHandler(me, event);}, false);
		registerEvent(mainCanvas, "touchmove", function(/** @type {TouchEvent} */ event) {me.touchHandler(me, event);}, false);
		registerEvent(mainCanvas, "touchend", function(/** @type {TouchEvent} */ event) {me.touchHandler(me, event);}, false);
		registerEvent(mainCanvas, "touchcancel", function(/** @type {TouchEvent} */ event) {me.touchHandler(me, event);}, false);

		// setup r g b components
		this.setRGBComponents();
	}

	// setup RGB components
	MenuManager.prototype.setRGBComponents = function() {
		var	/** @type {string} */ style = "";

		// get foregound elements as hex rgb
		this.mainContext.fillStyle = this.fgCol;
		style = this.mainContext.fillStyle;
		this.fgR = Number("0x" + style.substring(1, 3));
		this.fgG = Number("0x" + style.substring(3, 5));
		this.fgB = Number("0x" + style.substring(5, 7));

		// get selected elements as hex rgb
		this.mainContext.fillStyle = this.selectedCol;
		style = this.mainContext.fillStyle;
		this.selectR = Number("0x" + style.substring(1, 3));
		this.selectG = Number("0x" + style.substring(3, 5));
		this.selectB = Number("0x" + style.substring(5, 7));
	};

	// reset time intervals
	MenuManager.prototype.resetTimeIntervals = function() {
		this.timeIntervals = [];
		this.loadTotal = 0;
		this.loadCount = 0;
	};

	// add time interval
	MenuManager.prototype.addTimeInterval = function() {
		var	/** @type {number} */ interval = 0;

		if (this.loadCount > 0) {
			interval = this.loadTotal / this.loadCount;
		}
		this.timeIntervals[this.timeIntervals.length] = interval;
		this.loadTotal = 0;
		this.loadCount = 0;
	};

	// get time interval
	/** @returns {number} */
	MenuManager.prototype.getTimeInterval = function(/** @type {number} */ which) {
		var	/** @type {number} */ result = -1;

		if (which >= 0 && which < this.timeIntervals.length) {
			result = this.timeIntervals[which];
		}

		return result;
	};

	// set menu border width
	MenuManager.prototype.setBorderWidth = function(/** @type {number} */ border) {
		// set border for new menus
		this.border = border;

		// set the border for the current Menu
		if (this.currentMenu) {
			this.currentMenu.setBorderWidth(border);
		}
	};

	// set menu foreground and background colour
	MenuManager.prototype.setColours = function(/** @type {string} */ fg, /** @type {string} */ bg, /** @type {string} */ highlight, /** @type {string} */ selected, /** @type {string} */ locked, /** @type {string} */ border, /** @type {string} */ hotkey) {
		// set colours for new menus
		this.fgCol = fg;
		this.bgCol = bg;
		this.hlCol = highlight;
		this.selectedCol = selected;
		this.lockedCol = locked;
		this.borderCol = border;
		this.hotkeyCol = hotkey;

		// set the colours in the current Menu
		if (this.currentMenu) {
			this.currentMenu.setColours(fg, bg, highlight, selected, locked, border);
		}

		// set notification colour
		this.notification.colour = fg;
		this.notification.priorityColour = fg;

		// set RGB components
		this.setRGBComponents();

		// setup the text alert colours
		this.notification.shadowColour = bg;

		// convert the background colour to hex
		this.mainContext.fillStyle = bg;
		this.bgColHex = this.mainContext.fillStyle;
	};

	// create menu
	/** @returns {MenuList} */
	MenuManager.prototype.createMenu = function(/** @type {function(number,View):void} */ callback, /** @type {function(View): void} */ activate, /** @type {View} */ caller) {
		// create menu object
		var	/** @type {MenuList} */ menuList = new MenuList(this, callback, activate, caller, this.mainContext, this.defaultFont);

		// set default style
		menuList.fgCol = this.fgCol;
		menuList.fgAlpha = this.fgAlpha;
		menuList.bgCol = this.bgCol;
		menuList.bgAlpha = this.bgAlpha;
		menuList.hlCol = this.hlCol;
		menuList.hlAlpha = this.hlAlpha;
		menuList.selectedCol = this.selectedCol;
		menuList.selectedAlpha = this.selectedAlpha;
		menuList.lockedCol = this.lockedCol;
		menuList.lockedAlpha = this.lockedAlpha;
		menuList.borderCol = this.borderCol;
		menuList.borderAlpha = this.borderAlpha;
		menuList.border = this.border;

		// return new menu
		return menuList;
	};

	// draw tooltip
	MenuManager.prototype.drawToolTip = function() {
		// get current menu
		var	/** @type {MenuList} */ current = this.currentMenu,

			// x scale
			/** @type {number} */ xScale = current.xScale,

			// control
			/** @type {MenuItem} */ control = null,

			// control width and height
			/** @type {number} */ controlWidth = 0,
			/** @type {number} */ controlHeight = 0,

			// control location
			/** @type {number} */ controlX = 0,
			/** @type {number} */ controlY = 0,

			// get the drawing context
			/** @type {CanvasRenderingContext2D} */ oc = this.mainContext,

			// tooltip text
			/** @type {string} */ toolTip = "",

			// extra line of text if too wide
			/** @type {string} */ extraTip = "",

			// tooltip position
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,

			// tooltip width
			/** @type {number} */ width = 0,
			/** @type {number} */ extraWidth = 0,
			/** @type {number} */ targetWidth = 0,
			/** @type {string} */ currentChar = "",
			/** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {string} */ textPart = "",

			// height for tooltip box
			/** @type {number} */ height = 0,

			// number of lines of text to draw
			/** @type {number} */ lines = 1,

			// font size
			/** @type {number} */ fontSize = 18,

			// border size
			/** @type {number} */ borderSize = 4,

			// whether the tooltip contains a newline
			/** @type {number} */ newLine = -1;

		// check for active item
		if (current.activeItem !== -1 || (current.activeItem === -1 && current.mouseOverItem === -1)) {
			this.toolTipLastActive = current.activeItem;
		}

		// check for active menu item
		if (current.mouseOverItem === -1 || (this.toolTipLastActive !== -1 && (this.toolTipLastActive === current.mouseOverItem))) {
			// check for multi-item move
			if (current.mouseOverItem !== -1) {
				control = current.menuItems[current.mouseOverItem];
				if  (control.id === this.toolTipControl && control.highlightItem !== this.toolTipMulti) {
					this.toolTipLastActive = -1;
				}
			}

			// nothing active so increase tool tip delay
			if (this.toolTipCounter < this.toolTipDelay) {
				this.toolTipCounter += 1;
			}
		} else {
			// get the control
			control = current.menuItems[current.mouseOverItem];

			// check if the control is the same as last time or the same control has a different multi-item
			if (control.id !== this.toolTipControl || (control.id === this.toolTipControl && control.highlightItem !== this.toolTipMulti)) {
				// different so save new control/multi item
				this.toolTipControl = control.id;
				this.toolTipMulti = control.highlightItem;

				// increase tooltip delay up to the maximum
				if (this.toolTipCounter < this.toolTipDelay) {
					this.toolTipCounter += 1;
				}
			} else {
				// same control so check for delay
				if (this.toolTipCounter >= 0) {
					this.toolTipCounter -= 1;
				}
			}

			// get the tooltip
			if (this.toolTipMulti !== -1) {
				toolTip = control.toolTip[this.toolTipMulti];
			} else {
				if (Array.isArray(control.toolTip)) {
					toolTip = "";
				} else {
					toolTip = /** @type {!string} */ (control.toolTip);
					if (toolTip === null) {
						toolTip = "";
					}
				}
			}

			// check for newline
			newLine = toolTip.indexOf("\n");

			// check if there is a tooltip and delay expired
			if (toolTip !== "" && this.toolTipCounter === -1 && !control.highlightLocked) {
				this.toolTipLastActive = -1;
				// get the control width, height and location
				controlX = control.x;
				controlY = control.y;
				controlWidth = control.width;
				controlHeight = control.height;

				// check for multi controls
				if (control.highlightItem !== -1) {
					// check orientation
					if (control.orientation === Menu.horizontal) {
						// adjust x position and width
						controlX += (controlWidth / /** @type {!Array} */ (control.lower).length) * control.highlightItem;
						controlWidth /= /** @type {!Array} */ (control.lower).length;
					} else {
						// adjust y position and width
						controlY += (controlHeight / /** @type {!Array} */ (control.lower).length) * control.highlightItem;
						controlHeight /= /** @type {!Array} */ (control.lower).length;
					}
				}

				// set the font
				fontSize *= xScale;
				oc.font = (fontSize | 0) + "px Arial";
				borderSize *= xScale;

				// measure the tooltip width
				width = oc.measureText(toolTip).width;

				// get the center of the control
				x = Math.round(controlX + controlWidth / 2);
				y = Math.round(controlY + controlHeight / 2);

				// center over the control
				x -= width / 2;

				// check the tooltip fits
				if (x < borderSize + 1) {
					x = borderSize + 1;
				} else {
					if (x + width + borderSize > oc.canvas.width) {
						x = oc.canvas.width - width - borderSize - 1;
					}
				}

				// check if the control height is bigger than width
				if (controlHeight > controlWidth) {
					// ensure minimum control width
					if (this.minToolTipX !== -1 && (controlWidth < this.minToolTipX)) {
						controlWidth = this.minToolTipX;
					}

					// check if the control is on the left or right half
					if (x > oc.canvas.width / 2) {
						x = controlX - width - (controlWidth / 2);
					} else {
						x = controlX + control.width + (controlWidth / 2);
					}
				} else {
					// ensure minimum control height
					if (this.minToolTipY !== -1 && (controlHeight < this.minToolTipY)) {
						controlHeight = this.minToolTipY;
					}

					// check if the control is in the top or bottom half
					if (y > oc.canvas.height / 2) {
						y -= controlHeight;
					} else {
						y += controlHeight;
					}
				}

				// check if the width is greater than the window
				if (width > oc.canvas.width) {
					// compute the target width
					targetWidth = (width >> 1) + fontSize + borderSize;
					if (targetWidth > oc.canvas.width) {
						targetWidth = oc.canvas.width;
					}
					// find the longest string that fits in the target width
					i = 1;
					while (oc.measureText(toolTip.substring(0, i)).width < targetWidth) {
						i += 1;
					}
					// see if there is a space, comma, slash or pipe nearby
					j = i - 1;
					while (j > i - 5) {
						currentChar = toolTip[j];
						if (currentChar === " " || currentChar === "," || currentChar === "/" || currentChar === "|") {
							// split at the character found
							i = j + 2;
							j = i - 5;
						} else {
							j -= 1;
						}
					}

					// split the string
					extraTip = toolTip.substring(i - 1);
					toolTip = toolTip.substring(0, i - 1);
					width = oc.measureText(toolTip).width;
					extraWidth = oc.measureText(extraTip).width;
					if (extraWidth > width) {
						width = extraWidth;
					}
					lines = 2;
				} else {
					// check for newline
					if (newLine !== -1) {
						extraTip = toolTip.substring(newLine + 1);
						extraWidth = oc.measureText(extraTip).width;
						toolTip = toolTip.substring(0, newLine);
						width = oc.measureText(toolTip).width;
						if (extraWidth > width) {
							width = extraWidth;
						}
						lines = 2;
					}
				}

				// if drawing two lines and in the bottom half start one line up
				height = fontSize * lines + borderSize * 2;
				if (lines === 2 && (y > oc.canvas.height / 2)) {
					y -= (fontSize + borderSize);
					height += borderSize;
				}

				// draw the tooltip box
				oc.globalAlpha = this.bgAlpha;
				oc.fillStyle = this.bgCol;
				oc.fillRect(((x - borderSize) | 0) - 0.5, ((y - fontSize / 2 - borderSize) | 0) - 0.5, width + 2 + borderSize * 2, height);

				// draw the tooltip border
				oc.globalAlpha = this.borderAlpha;
				oc.strokeStyle = this.borderCol;
				oc.strokeRect(((x - borderSize) | 0) - 0.5, ((y - fontSize / 2 - borderSize) | 0) - 0.5, width + 2 + borderSize * 2, height);

				// draw the shadow
				oc.globalAlpha = this.bgAlpha;
				oc.strokeStyle = this.bgCol;
				oc.beginPath();
				oc.moveTo((x - borderSize | 0) + 0.5, ((y - fontSize / 2 - borderSize) | 0) + 0.5 + height);
				oc.lineTo((x - borderSize | 0) + 0.5 + width + 2 + borderSize * 2, ((y - fontSize / 2 - borderSize) | 0) + 0.5 + height);
				oc.lineTo((x - borderSize | 0) + 0.5 + width + 2 + borderSize * 2, ((y - fontSize / 2 - borderSize) | 0) + 0.5);
				oc.stroke();

				// draw the tooltip
				oc.globalAlpha = 1;
				oc.fillStyle = this.bgCol;
				oc.fillText(toolTip, x + 2, y + 2);
				if (extraTip !== "") {
					oc.fillText(extraTip, x + 2, y + fontSize + borderSize + 2);
				}
				oc.fillStyle = this.fgCol;

				// check for hotkey
				i = toolTip.indexOf("[");
				j = toolTip.lastIndexOf("]");
				if (i !== -1 && j !== -1) {
					textPart = toolTip.substring(0, i + 1);
					width = oc.measureText(textPart).width;
					oc.fillText(textPart, x, y);
					oc.fillStyle = this.hotkeyCol;
					textPart = toolTip.substring(i + 1, j);
					oc.fillText(textPart, x + width, y);
					oc.fillStyle = this.fgCol;
					textPart = toolTip.substring(j);
					width = oc.measureText(toolTip.substring(0, j)).width;
					oc.fillText(textPart, x + width, y);
				} else {
					oc.fillText(toolTip, x, y);
				}
				if (extraTip !== "") {
					i = extraTip.indexOf("[");
					j = extraTip.lastIndexOf("]");
					if (i !== -1 && j !== -1) {
						textPart = extraTip.substring(0, i + 1);
						width = oc.measureText(textPart).width;
						oc.fillText(textPart, x, y + fontSize + borderSize);
						oc.fillStyle = this.hotkeyCol;
						textPart = extraTip.substring(i + 1, j);
						oc.fillText(textPart, x + width, y + fontSize + borderSize);
						oc.fillStyle = this.fgCol;
						textPart = extraTip.substring(j);
						width = oc.measureText(extraTip.substring(0, j)).width;
						oc.fillText(textPart, x + width, y + fontSize + borderSize);
					} else {
						oc.fillText(extraTip, x, y + fontSize + borderSize);
					}
				}
			}
		}
	};

	// process callback
	MenuManager.prototype.processCallback = function(/** @type {MenuManager} */ me) {
		var	/** @type {number} */ newMenu,
			/** @type {number} */ newWork,
			/** @type {number} */ newFrame,
			/** @type {number} */ menu,
			/** @type {number} */ work,
			/** @type {number} */ frame,
			/** @type {number} */ total,
			/** @type {string} */ menuStr,
			/** @type {string} */ workStr,
			/** @type {string} */ totalStr,
			/** @type {number} */ i,

			// performance load
			/** @type {number} */ load = 1,

			// get the drawing context
			/** @type {CanvasRenderingContext2D} */ oc = me.mainContext,

			// text message
			/** @type {string} */ message = "",

			// text message width
			/** @type {number} */ messageWidth = 0,

			// timing display position
			/** @type {number} */ x = oc.canvas.width - 86,
			/** @type {number} */ y = 90,

			// display scale
			/** @type {number} */ xScale = 1,
			/** @type {number} */ yScale = 1;

		// move fps display if in thumbnail mode
		if (me.thumbnail) {
			y = 0;
		}

		// mark update processed
		me.updateScheduled = false;

		// mark update has happened since last mouse down
		me.updateSinceMouseDown = true;

		// load new menu if required
		if (me.loadMenu) {
			// set the active menu
			me.currentMenu = me.loadMenu;
			me.loadMenu = null;

			// initialise the menu
			oc.font = me.defaultFont;
			me.currentMenu.init();

			// call the activate callback if defined
			if (me.currentMenu.activateCallback) {
				me.currentMenu.activateCallback(me.currentMenu.caller);
			}
		}

		// scale information display
		if (me.currentMenu) {
			xScale = me.currentMenu.xScale;
			yScale = me.currentMenu.yScale;
		}

		// update timing display position
		x = oc.canvas.width - 86 * xScale;
		y *= yScale;

		// time menu draw and callback work
		newWork = performance.now();
		if (me.idle) {
			// if idle then set time to one frame
			me.lastUpdate = newWork - (1000 / me.refreshRate);
		}

		// schedule the next update if auto update on or notification is displayed
		if (me.autoUpdate || me.notification.displayed() || me.updateCount || (me.toolTipDelay !== me.toolTipCounter && me.toolTipCounter !== -1)) {
			me.scheduleNextUpdate(me);

			if (me.updateCount) {
				me.updateCount -= 1;
			}
			me.idle = false;
		} else {
			// flag no update happened
			me.idle = true;
		}

		// compute the time since last call
		newFrame = newWork - me.lastUpdate;
		me.lastUpdate = newWork;

		// execute the callback if it exists
		if (me.currentMenu.callback) {
			me.currentMenu.callback(newFrame, me.currentMenu.caller);
		}

		// get the callback work time
		newWork = performance.now() - newWork;

		// time the menu draw
		newMenu = performance.now();

		// draw menu and schedule next update
		me.drawMenu();
		me.clickHappened = false;

		// check for tool tip
		me.drawToolTip();

		// draw the notification
		me.notification.update();

		// get the menu draw time
		newMenu = performance.now() - newMenu;

		// save the menu timing
		me.lastMenu[me.timingIndex] = newMenu;

		// average the menu time
		menu = 0;
		for (i = 0; i < me.numTimings; i += 1) {
			menu += me.lastMenu[i];
		}
		menu = menu / me.numTimings;

		// save the work timing
		me.lastWork[me.timingIndex] = newWork;

		// average the work time
		work = 0;
		for (i = 0; i < me.numTimings; i += 1) {
			work += me.lastWork[i];
		}
		work = work / me.numTimings;

		// save the frame timing
		me.lastFrame[me.timingIndex] = newFrame;

		// average the frame time
		frame = 0;
		for (i = 0; i < me.numTimings; i += 1) {
			frame += me.lastFrame[i];
		}
		frame = frame / me.numTimings;

		// increment index
		me.timingIndex = (me.timingIndex + 1) % me.numTimings;

		// get the total fps
		total = 1000 / frame;
		if (total > me.refreshRate) {
			total = me.refreshRate;
		}

		// update total time
		this.loadTotal += (1000 / (newWork + newMenu));
		this.loadCount += 1;

		// draw the timing statistics if enabled
		if (me.showTiming) {
			// set the menu font
			oc.font = ((12 * xScale) | 0) + "px Arial";

			// draw the shaded rectangle
			oc.globalAlpha = 0.7;
			oc.fillStyle = me.bgCol;

			// check for extended timing
			if (me.showExtendedTiming) {
				oc.fillRect(x, y, ((88 * xScale) | 0), ((83 * yScale) | 0));
			} else {
				oc.fillRect(x, y, ((88 * xScale) | 0), ((20 * yScale) | 0));
			}

			// compute weighted load
			load = (work + menu) / 16.666666;
			if (load > 1) {
				load = 1;
			}

			// draw load background
			if (load < 0.5) {
				// fade from green to yellow
				oc.fillStyle = "rgb(" + ((255 * load * 2) | 0) + ",255,0)";
			} else {
				// fade from yellow to red
				oc.fillStyle = "rgb(255," + ((255 * (1 - (load - 0.5) * 2)) | 0) + ",0)";
			}
			oc.fillRect(x, y, ((88 * load * xScale) | 0), ((20 * yScale) | 0));

			// convert to one decimal place
			menuStr = menu.toFixed(1);
			workStr = work.toFixed(1);
			if (total.toFixed(1).length < 4) {
				totalStr = total.toFixed(1);
			} else {
				totalStr = String(total | 0);
			}

			// draw the text shadows
			oc.globalAlpha = 1;
			oc.fillStyle = me.bgCol;

			// draw fps
			message = totalStr + "fps";
			oc.fillText(message, x + (6 * xScale), y + (12 * yScale));

			// draw load%
			message = ((100 * load) | 0) + "%";
			messageWidth = oc.measureText(message).width;
			oc.fillText(message, x + ((8 + 76) * xScale) - messageWidth, y + (12 * yScale));

			if (me.showExtendedTiming && me.eventWasTouch) {
				oc.save();
				oc.fillStyle = "black";
				oc.font = "18px Arial";

				i = 0;
				while (i < 3) {
					oc.fillText(String(me.currentTouchId1), 4 - i, 50 - i);
					oc.fillText(me.caller.pinchCurrentX1 + ", " + me.caller.pinchCurrentY1, 4 - i, 80 - i);
					oc.fillText(String(me.currentTouchId2), 4 - i, 110 - i);
					oc.fillText(me.caller.pinchCurrentX2 + ", " + me.caller.pinchCurrentY2, 4 - i, 140 - i);
					i += 2;
					oc.fillStyle = "white";
				}

				oc.restore();
			}

			// draw extended timing if enabled
			if (me.showExtendedTiming) {
				// draw labels
				oc.fillText("menu", x + (6 * xScale), y + (28 * yScale));
				oc.fillText("work", x + (6 * xScale), y + (44 * yScale));
				oc.fillText("update", x + (6 * xScale), y + (60 * yScale));
				oc.fillText("focus", x + (6 * xScale), y + (76 * yScale));

				// draw menu ms
				message = menuStr + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((8 + 76) * xScale) - messageWidth, y + (28 * yScale));

				// draw work ms
				message = workStr + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((8 + 76) * xScale) - messageWidth, y + (44 * yScale));

				// draw autoupdate
				message = (me.autoUpdate ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((8 + 76) * xScale) - messageWidth, y + (60 * yScale));

				// draw focus
				message = (me.hasFocus ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((8 + 76) * xScale) - messageWidth, y + (76 * yScale));
			}

			// draw the text
			oc.fillStyle = me.fgCol;

			// draw fps
			message = totalStr + "fps";
			oc.fillText(message, x + (4 * xScale), y + (10 * yScale));

			// draw load%
			message = ((100 * load) | 0) + "%";
			messageWidth = oc.measureText(message).width;
			oc.fillText(message, x + ((6 + 76) * xScale) - messageWidth, y + (10 * yScale));

			// draw extended timing if enabled
			if (me.showExtendedTiming) {
				// draw labels
				oc.fillText("menu", x + (4 * xScale), y + (26 * yScale));
				oc.fillText("work", x + (4 * xScale), y + (42 * yScale));
				oc.fillText("update", x + (4 * xScale), y + (58 * yScale));
				oc.fillText("focus", x + (4 * xScale), y + (74 * yScale));

				// draw menu ms
				message = menuStr + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((6 + 76) * xScale) - messageWidth, y + (26 * yScale));

				// draw work ms
				message = workStr + "ms";
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((6 + 76) * xScale) - messageWidth, y + (42 * yScale));

				// draw autoupdate
				message = (me.autoUpdate ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((6 + 76) * xScale) - messageWidth, y + (58 * yScale));

				// draw focus
				message = (me.hasFocus ? "on" : "off");
				messageWidth = oc.measureText(message).width;
				oc.fillText(message, x + ((6 + 76) * xScale) - messageWidth, y + (74 * yScale));
			}

			// reset alpha
			oc.globalAlpha = 1;
		}

		// update the cursor if it has changed
		if (me.currentMenu.cursorCurrent !== me.currentMenu.cursorSet) {
			me.currentMenu.cursorSet = me.currentMenu.cursorCurrent;
			// set the cursor style
			me.mainCanvas.style.cursor = me.currentMenu.cursorSet;
		}

		// mark that event processed
		me.processedEvent = true;
	};

	// set active menu list
	MenuManager.prototype.activeMenu = function(/** @type {MenuList} */ activeMenuList) {
		// set the icon manager for the acive menu
		activeMenuList.iconManager = this.iconManager;

		// check if there is an active menu
		if (this.currentMenu) {
			// set the menu to load next update
			this.loadMenu = activeMenuList;
		} else {
			// load the menu now
			this.loadMenu = null;

			// initialise the menu
			this.currentMenu = activeMenuList;
			this.mainContext.font = this.defaultFont;
			this.currentMenu.init();

			// call the activate callback if defined
			if (this.currentMenu.activateCallback) {
				this.currentMenu.activateCallback(this.currentMenu.caller);
			}

			// schedule callback
			this.scheduleNextUpdate(this);
		}
	};

	// draw active menu
	MenuManager.prototype.drawMenu = function() {
		var	/** @type {number} */ i,
			/** @type {MenuList} */ currentMenu,
			/** @type {MenuItem} */ currentItem;

		// check there is an active menu
		if (this.currentMenu) {
			currentMenu = this.currentMenu;

			// set the menu font
			this.mainContext.font = this.defaultFont;

			// set the mouse position
			currentMenu.mouseX = this.mouseLastX;
			currentMenu.mouseY = this.mouseLastY;
			currentMenu.mouseDown = this.mouseDown;
			currentMenu.clickHappened = this.clickHappened;

			// draw and update the menu and check if we need to toggle
			if (currentMenu.drawMenu() || this.toggleRequired) {
				for (i = 0; i < currentMenu.numMenuItems; i += 1) {
					currentItem = currentMenu.menuItems[i];
					currentMenu.toggleMenu(currentItem);
				}
				this.toggleRequired = false;
			}
		}
	};

	// schedule next update
	MenuManager.prototype.scheduleNextUpdate = function(/** @type {MenuManager} */ me) {
		// check whether there is already an update scheduled
		if (!me.updateScheduled) {
			// check which event mechanism exists
			if (requestAnimationFrame) {
				requestAnimationFrame(me.callbackFunction);
			} else {
				setTimeout(me.callbackFunction, 16);
			}

			// mark update scheduled
			me.updateScheduled = true;
		}
	};

	// start pinch
	MenuManager.prototype.startPinch = function() {
		var	/** @type {Array<number>} */ pos1 = this.getCursorPosition(this, this.touchId1X, this.touchId1Y),
			/** @type {Array<number>} */ pos2 = this.getCursorPosition(this, this.touchId2X, this.touchId2Y);

		if (this.pinchCallback) {
			this.pinchCallback(pos1[0], pos1[1], pos2[0], pos2[1], 0, this.caller);
		}
	};

	// update pinch
	MenuManager.prototype.movePinch = function(/** @type {Touch} */ touch) {
		var	/** @type {Array<number>} */ pos = [];
		if (touch.identifier === this.currentTouchId1) {
			pos = this.getCursorPosition(this, this.touchId1X, this.touchId1Y);
			this.pinchCallback(pos[0], pos[1], 0, 0, 1, this.caller);
		} else {
			pos = this.getCursorPosition(this, this.touchId2X, this.touchId2Y);
			this.pinchCallback(pos[0], pos[1], 0, 0, 2, this.caller);
		}
	};

	// cancel pinch
	MenuManager.prototype.cancelPinch = function() {
		this.setAutoUpdate(true);
	};

	// touch event handler
	MenuManager.prototype.touchHandler = function(/** @type {MenuManager} */ me, /** @type {TouchEvent} */ event) {
		var	/** @type {TouchList} */ changes = event.changedTouches,
			/** @type {Touch} */ thisChange = null,
			/** @type {number} */ numChanges = changes.length,
			/** @type {number} */ i = 0;

		// determine which event was received
		switch (event.type) {
		// touch start
		case "touchstart":
			// check if processing a touch
			if (me.currentTouchId1 === -1 && me.currentTouchId2 === -1) {
				// no touch being processed so check how many touches just started
				switch (numChanges) {
					// single touch so handle like a mouse down event
					case 1:
						thisChange = changes[0];
						me.currentTouchId1 = thisChange.identifier;
						me.touchId1X = thisChange.pageX;
						me.touchId1Y = thisChange.pageY;
						me.performDown(me, thisChange.pageX, thisChange.pageY);
						break;

					// double touch so handle like a pinch event
					case 2:
						// start the pinch
						thisChange = changes[0];
						me.currentTouchId1 = thisChange.identifier;
						me.touchId1X = thisChange.pageX;
						me.touchId1Y = thisChange.pageY;

						thisChange = changes[1];
						me.currentTouchId2 = thisChange.identifier;
						me.touchId2X = thisChange.pageX;
						me.touchId2Y = thisChange.pageY;

						me.startPinch();
						break;

					// ignore other multi touches
					default:
						break;
				}
			} else {
				// touch being processed so check if pinch in progress
				if (me.currentTouchId1 === -1) {
					// single touch in progress so stop it
					me.performUp(me, me.touchId2X, this.touchId2Y); 

					// start the pinch
					thisChange = changes[0];
					me.currentTouchId1 = thisChange.identifier;
					me.touchId1X = thisChange.pageX;
					me.touchId1Y = thisChange.pageY;

					me.startPinch();
					break;
				} else {
					if (me.currentTouchId2 === -1) {
						// single touch in progress so stop it
						me.performUp(me, this.touchId1X, this.touchId1Y); 

						// start the pinch
						thisChange = changes[0];
						me.currentTouchId2 = thisChange.identifier;
						me.touchId2X = thisChange.pageX;
						me.touchId2Y = thisChange.pageY;

						me.startPinch();
					}
				}
			}
			break;

		// touch end
		case "touchend":
			// process each change record
			for (i = 0; i < numChanges; i += 1) {
				thisChange = changes[i];
				
				// check if the change relates to one of the current touches in progress
				if (thisChange.identifier === me.currentTouchId1) {
					// matches the first touch so check if single or pinch is in progress
					if (me.currentTouchId2 === -1) {
						// currently processing single so end it
						me.performUp(me, thisChange.pageX, thisChange.pageY);
						me.currentTouchId1 = -1;
					} else {
						// currently processing pinch so end it
						me.currentTouchId1 = -1;
						me.cancelPinch();

						// mouse down for the remaining touch
						me.performDown(me, me.touchId2X, me.touchId2Y);
					}
				} else {
					if (thisChange.identifier === me.currentTouchId2) {
						// matches the second touch so check if single or pinch is in progress
						if (me.currentTouchId1 === -1) {
							// currently processing single so end it
							me.performUp(me, thisChange.pageX, thisChange.pageY);
							me.currentTouchId2 = -1;
						} else {
							// currently processing pinch so end it
							me.currentTouchId2 = -1;
							me.cancelPinch();

							// mouse down for the remaining touch
							me.performDown(me, me.touchId1X, me.touchId2X);
						}
					}
				}
			}
			break;

		// touch move
		case "touchmove":
			// process each change record
			for (i = 0; i < numChanges; i += 1) {
				thisChange = changes[i];

				// check if the change relates to one of the current touches in progress
				if (thisChange.identifier === me.currentTouchId1) {
					// matches the first touch so check if single or pinch is in progress
					if (me.currentTouchId2 === -1) {
						// currently processing single so move it
						me.performMove(me, thisChange.pageX, thisChange.pageY);
					} else {
						// currently processing pinch so move it
						me.touchId1X = thisChange.pageX;
						me.touchId1Y = thisChange.pageY;
						me.movePinch(thisChange);
					}
				} else {
					if (thisChange.identifier === me.currentTouchId2) {
						// matches the second touch so check if single or pinch is in progress
						if (me.currentTouchId1 === -1) {
							// currently processing single so move it
							me.performMove(me, thisChange.pageX, thisChange.pageY);
						} else {
							// currently processing pinch so move it
							me.touchId2X = thisChange.pageX;
							me.touchId2Y = thisChange.pageY;
							me.movePinch(thisChange);
						}
					}
				}
			}
			break;

		// touch cancel
		case "touchcancel":
			// process each change record
			for (i = 0; i < numChanges; i += 1) {
				thisChange = changes[i];
				
				// check if the change relates to one of the current touches in progress
				if (thisChange.identifier === me.currentTouchId1) {
					// matches the first touch so check if single or pinch is in progress
					if (me.currentTouchId2 === -1) {
						// currently processing single so end it
						me.performUp(me, thisChange.pageX, thisChange.pageY);
						me.currentTouchId1 = -1;
					} else {
						// currently processing pinch so end it
						me.currentTouchId1 = -1;
						me.cancelPinch();

						// mouse down for the remaining touch
						me.performDown(me, me.touchId2X, me.touchId2Y);
					}
				} else {
					if (thisChange.identifier === me.currentTouchId2) {
						// matches the second touch so check if single or pinch is in progress
						if (me.currentTouchId1 === -1) {
							// currently processing single so end it
							me.performUp(me, thisChange.pageX, thisChange.pageY);
							me.currentTouchId2 = -1;
						} else {
							// currently processing pinch so end it
							me.currentTouchId2 = -1;
							me.cancelPinch();

							// mouse down for the remaining touch
							me.performDown(me, me.touchId1X, me.touchId2X);
						}
					}
				}
			}
			break;
		}

		// mark last event as a touch event
		me.eventWasTouch = true;

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		if (event.cancelable) {
			event.preventDefault();
		}
	};

	// perform mouse/touch down event
	MenuManager.prototype.performDown = function(/** @type {MenuManager} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// update cursor position
		me.updateCursorPosition(me, x, y);

		// mark mouse down
		me.mouseDown = true;

		// mark that no update has happened since this mouse down
		me.updateSinceMouseDown = false;
	};

	// perform mouse/touch up event
	MenuManager.prototype.performUp = function(/** @type {MenuManager} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// remember current mouse up time
		me.lastMouseUp = performance.now();

		// update cursor position
		me.updateCursorPosition(me, x, y);

		// mark mouse not down
		me.mouseDown = false;

		// if no update was processed since last mouse down then a click happened
		if (!me.updateSinceMouseDown) {
			me.clickHappened = true;
		}

		// check if the up event is over the canvas
		if (me.mouseLastX >= 0 && me.mouseLastX < me.mainCanvas.width && me.mouseLastY >= 0 && me.mouseLastY < me.mainCanvas.height) {
			// check if the canvas has focus
			if (!me.hasFocus) {
				// set focus on canvas element
				if (!me.eventWasTouch) {
					me.mainCanvas.focus();
				}
				me.hasFocus = true;

				// clear click to focus notification
				me.notification.clear(true, false);

				// call focus callback if registered
				if (me.focusCallback) {
					me.focusCallback(me.caller);
				}
			}
		} else {
			if (me.eventWasTouch) {
				// clear notification as touch released outside viewer
				me.notification.clear(true, false);
			}
		}
	};

	// perform mouse/touch move event
	MenuManager.prototype.performMove = function(/** @type {MenuManager} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// check if this has focus
		me.checkFocusAndNotify(me);

		// update cursor position
		me.updateCursorPosition(me, x, y);
	};

	// perform mouse/touch over event
	MenuManager.prototype.performOver = function(/** @type {MenuManager} */ me) {
		// check if this has focus
		me.checkFocusAndNotify(me);
	};

	// perform mouse/touch out event
	MenuManager.prototype.performOut = function(/** @type {MenuManager} */ me) {
		// check if enough time has past since last mouse up
		var	/** @type {number} */ timeSinceUp = performance.now() - me.lastMouseUp;

		// check if enough time has past since last mouse up
		if (timeSinceUp > 1) {
			// check if window has focus
			if (!me.hasFocus) {
				me.notification.clear(true, false);
			}

			// remove focus
			me.mainCanvas.blur();
			me.hasFocus = false;

			// mark mouse not down
			me.mouseDown = false;

			// clear mouse coordinates
			me.mouseLastX = -1;
			me.mouseLastY = -1;

			// clear click to interact flag
			me.clickToInteract = false;

			// schedule update if no update scheduled
			if (!me.updateScheduled) {
				me.scheduleNextUpdate(me);
				if (me.updateCount < me.defaultUpdateCount) {
					me.updateCount = me.defaultUpdateCount;
				}
			}
		}
	};

	// mouse down event
	MenuManager.prototype.canvasMouseDown = function(/** @type {MenuManager} */ me, /** @type {MouseEvent} */ event) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// check if passing events
		if (!me.passEvents) {
			// get event position
			if (event.pageX || event.pageY) {
				x = event.pageX;
				y = event.pageY;
			} else {
				x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}

			// perform down event
			me.performDown(me, x, y);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
			me.eventWasTouch = false;
		}
	};

	// mouse up event
	MenuManager.prototype.canvasMouseUp = function(/** @type {MenuManager} */ me, /** @type {MouseEvent} */ event) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// remember current mouse up time
		me.lastMouseUp = performance.now();

		// check if passing events
		if (!me.passEvents) {
			// get event position
			if (event.pageX || event.pageY) {
				x = event.pageX;
				y = event.pageY;
			} else {
				x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}

			// perform up event
			me.performUp(me, x, y);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
			me.eventWasTouch = false;
		}
	};

	// check if canvas has focus and if not notify
	MenuManager.prototype.checkFocusAndNotify = function(/** @type {MenuManager} */ me) {
		// check if this has focus and GUI enabled
		if (!me.hasFocus) {
			// check if click to interact has been displayed
			if (!me.clickToInteract || me.notification.priorityMessage === "") {
				// notify click to interact
				if (me.noGUI) {
					if (!me.noCopy) {
						me.notification.notify("Copy", 15, 3600, 15, true);
					}
				} else {
					if (me.thumbnail) {
						if (me.thumbLaunch) {
							me.notification.notify("Launch", 15, 3600, 15, true);
						} else {
							me.notification.notify("Expand", 15, 3600, 15, true);
						}
					} else {
						me.notification.notify("Click to control", 15, 3600, 15, true);
					}
				}
				me.notification.animate = true;
				me.clickToInteract = true;
			}
		}
	};

	// mouse move event
	MenuManager.prototype.canvasMouseMove = function(/** @type {MenuManager} */ me, /** @type {MouseEvent} */ event) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// check if passing events
		if (!me.passEvents) {
			// get event position
			if (event.pageX || event.pageY) {
				x = event.pageX;
				y = event.pageY;
			} else {
				x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}

			// perform move event
			me.performMove(me, x, y);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
			me.eventWasTouch = false;
		}
	};

	// mouse over event
	MenuManager.prototype.canvasMouseOver = function(/** @type {MenuManager} */ me, /** @type {MouseEvent} */ event) {
		// check if passing events
		if (!me.passEvents) {
			// perform over event
			me.performOver(me);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
			me.eventWasTouch = false;
		}
	};

	// mouse out event
	MenuManager.prototype.canvasMouseOut = function(/** @type {MenuManager} */ me, /** @type {MouseEvent} */ event) {
		// check if passing events
		if (!me.passEvents) {
			// perform out event
			me.performOut(me);

			// stop event propagating
			if (event.stopPropagation) {
				event.stopPropagation();
			}
			event.preventDefault();
			me.eventWasTouch = false;
		}
	};

	// get element scale in x and y direction
	//** @returns {Array<number>} */
	MenuManager.prototype.getElementScale = function(/** @type {Element} */ element) {
		var	/** @type {Array<number>} */ result = [1, 1],
			/** @type {CSSStyleDeclaration} */ css = null,
			/** @type {string} */ transform = "",
			/** @type {Array<string>} */ matrix = [];

		while (element !== null) {
			css = window.getComputedStyle(element);
			transform = css.getPropertyValue("transform");

			// result will be "none" or "matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)"
			if (transform !== "none") {
				// convert the string into six elements
				matrix = transform.split(", ");
				matrix[0] = matrix[0].substring(7);
				matrix[5] = matrix[5].substring(0, matrix[5].length - 1);

				// update the scale x and y
				result[0] *= parseFloat(matrix[0]);	// scaleX
				result[1] *= parseFloat(matrix[3]);	// scaleY
			}

			element = element.parentElement;
		}

		return result;
	};

	// get cursor position over canvas
	/** @returns {Array<number>} */
	MenuManager.prototype.getCursorPosition = function(/** @type {MenuManager} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// get the bounding rectangle of the canvas
		var	rect = this.mainCanvas.getBoundingClientRect(),
			/** @type {Array<number>} */ scale = me.getElementScale(me.mainCanvas);

		// adjust for window scroll
		if (!window.scrollX) {
			x -= rect.left + window.pageXOffset;
			y -= rect.top + window.pageYOffset;
		} else {
			x -= rect.left + window.scrollX;
			y -= rect.top + window.scrollY;
		}

		// apply css scale
		x /= scale[0];
		y /= scale[1];

		// apply zoom
		if (scale[0] === 1 && scale[1] === 1) {
			x /= me.windowZoom;
			y /= me.windowZoom;
		}

		return [(x - 1) | 0, (y - 1) | 0];
	};

	// get cursor position over canvas
	MenuManager.prototype.updateCursorPosition = function(/** @type {MenuManager} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// get the bounding rectangle of the canvas
		var	/** @type {Array<number>} */ position = me.getCursorPosition(me, x, y);

		// update position
		me.mouseLastX = position[0];
		me.mouseLastY = position[1];

		// schedule update
		me.scheduleNextUpdate(me);
		if (me.updateCount < me.defaultUpdateCount) {
			me.updateCount = me.defaultUpdateCount;
		}
	};

	// get active menu item
	/** @returns {MenuItem} */
	MenuManager.prototype.activeItem = function() {
		var	/** @type {MenuItem} */ result = null;

		// check if there is a current menu
		if (this.currentMenu) {
			// check if the current menu has an active item
			if (this.currentMenu.activeItem != -1) {
				// return the active item
				result = this.currentMenu.menuItems[this.currentMenu.activeItem];
			}
		}

		return result;
	};

	// set auto update mode
	MenuManager.prototype.setAutoUpdate = function(/** @type {boolean} */ mode) {
		// check if switching on from off
		if ((mode || this.notification.displayed()) && !this.autoUpdate) {
			this.scheduleNextUpdate(this);
		}

		// set the mode
		this.autoUpdate = mode;
	};
