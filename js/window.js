// Popup Window
// Handles the standalone LifeViewer popup window.

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

	// PopupWindow
	/**
	 * @constructor
	 */
	function PopupWindow(/** @type {HTMLDivElement} */ element, /** @type {View} */ view) {
		var	/** @type {PopupWindow} */ me = this,
			/** @type {HTMLDivElement} */ title = /** @type {!HTMLDivElement} */ (element.getElementsByTagName("div")[0]);

		// whether using touch events (so ignore mouse events)
		/** @type {boolean} */ this.usingTouch = false;

		// current touch id
		/** @type {number} */ this.currentTouchId = -1;

		// window zoom
		/** @type {number} */ this.windowZoom = 1;

		// wrapped element
		/** @type {HTMLDivElement} */ this.wrappedElement = element;

		// view
		/** @type {View} */ this.view = view;

		// menu manager
		/** @type {MenuManager} */ this.menuManager = view.menuManager;

		// current position
		/** @type {number} */ this.left = 0;
		/** @type {number} */ this.top = 0;
		if (element.style.left !== "") {
			this.left = parseInt(element.style.left, 10);
		}
		if (element.style.top !== "") {
			this.top = parseInt(element.style.top, 10);
		}

		// whether window is displayed
		/** @type {boolean} */ this.displayed = false;

		// mouse status
		/** @type {boolean} */ this.mouseDown = false;
		/** @type {number} */ this.mouseLastX = -1;
		/** @type {number} */ this.mouseLastY = -1;

		// last touch coordinates
		/** @type {number} */ this.lastScreenX = -1;
		/** @type {number} */ this.lastScreenY = -1;
		/** @type {number} */ this.lastClientX = -1;
		/** @type {number} */ this.lastClientY = -1;

		// element offset
		/** @type {number} */ this.offsetLeft = 0;
		/** @type {number} */ this.offsetTop = 0;

		// x offset when resizing to keep window right edge at a constant position
		/** @type {number} */ this.resizeDx = 0;

		// register event listeners for element click
		registerEvent(title, "mousedown", function(/** @type {MouseEvent} */ event) {me.elementMouseDown(me, event);}, false);
		registerEvent(document, "mousemove", function(/** @type {MouseEvent} */ event) {me.elementMouseMove(me, event);}, false);
		registerEvent(document, "mouseup", function(/** @type {MouseEvent} */ event) {me.elementMouseUp(me, event);}, false);

		// register event listeners for touch
		registerEvent(title, "touchstart", function(/** @type {TouchEvent} */ event) {me.touchHandler(me, event);}, false);
		registerEvent(title, "touchmove", function(/** @type {TouchEvent} */ event) {me.touchHandler(me, event);}, false);
		registerEvent(title, "touchend", function(/** @type {TouchEvent} */ event) {me.touchHandler(me, event);}, false);

		// register event listener for window resize
		registerEvent(window, "resize", function() {me.resizeWindow(me);}, false);
	}

	// find touch change by identified
	/** @returns {Touch} */
	PopupWindow.prototype.findChangeById = function(/** @type {TouchList} */ changes, /** @type {number} */ id) {
		var	/** @type {Touch} */ change = null,
			/** @type {number} */ i = 0;

		// search the change list for the change with the specified id
		while (change === null && i < changes.length) {
			if (changes[i].identifier === id) {
				change = changes[i];
			} else {
				i += 1;
			}
		}

		return change;
	};

	// reset popup window event handling
	PopupWindow.prototype.reset = function() {
		this.mouseDown = false;
		this.currentTouchId = -1;
	};

	// touch event handler
	PopupWindow.prototype.touchHandler = function(/** @type {PopupWindow} */ me, /** @type {TouchEvent} */ event) {
		var	/** @type {TouchList} */ changes = event.changedTouches,
			/** @type {Touch} */ thisChange = null;

		// mark that touch events are being used (so ignore mouse events)
		this.usingTouch = true;

		// determine which event was received
		switch (event.type) {
		// touch start
		case "touchstart":
			// check if processing a touch
			if (me.currentTouchId === -1) {
				thisChange = changes[0];
				me.currentTouchId = thisChange.identifier;
				me.performDown(me, thisChange.pageX, thisChange.pageY);
			}
			break;

		// touch end
		case "touchend":
			// find the change record for the current touch
			thisChange = me.findChangeById(changes, me.currentTouchId);
			if (thisChange !== null) {
				me.performUp(me, thisChange.pageX, thisChange.pageY);
				me.currentTouchId = -1;
			}
			break;

		// touch move
		case "touchmove":
			// find the change record for the current touch
			thisChange = me.findChangeById(changes, me.currentTouchId);
			if (thisChange !== null) {
				me.performMove(me, thisChange.pageX, thisChange.pageY);
			}
			break;
		}

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		if (event.cancelable) {
			event.preventDefault();
		}
	};

	// resize window
	/* eslint-disable no-unused-vars */
	PopupWindow.prototype.resizeWindow = function(/** @type {PopupWindow} */ me) {
		var	/** @type {View} */ view = this.view;

		// check if window needs rescaling
		view.displayWidth = view.origDisplayWidth;
		view.displayHeight = view.origDisplayHeight;
		view.scalePopup();
		view.divItem.style.transform = "scale(" + view.windowZoom + "," + view.windowZoom + ")";
		view.divItem.style.transformOrigin = "top left";
		if (view.popupWidthChanged) {
			this.menuManager.setAutoUpdate(true);
			view.resize();
		}

		/* eslint-enable no-unused-vars */
		// check the popup window is on the display
		me.setWindowPosition(me.left + me.resizeDx, me.top);
		me.resizeDx = 0;
	};

	// move element
	PopupWindow.prototype.updatePosition = function(/** @type {number} */ dx, /** @type {number} */ dy) {
		// set the window position by applying the supplied offset
		this.setWindowPosition(this.left + dx, this.top + dy);
	};

	// set window position
	PopupWindow.prototype.setWindowPosition = function(/** @type {number} */ x, /** @type {number} */ y) {
		// get the width and height of the element
		var	/** @type {number} */ width = this.wrappedElement.clientWidth * this.windowZoom,
			/** @type {number} */ height = this.wrappedElement.clientHeight * this.windowZoom,

			// get the maximum x and y position
			/** @type {number} */ maxX = window.innerWidth - width,
			/** @type {number} */ maxY = window.innerHeight - height,

			// scrollbar width
			/** @type {number} */ scrollBarWidth = window.innerWidth - document.body.clientWidth;

		// check for scrollbar
		maxX -= scrollBarWidth * this.windowZoom;

		// ensure window on screen
		if (x > maxX) {
			x = maxX;
		}
		if (y > maxY) {
			y = maxY;
		}
		if (x < 0) {
			x = 0;
		}
		if (y < 0) {
			y = 0;
		}

		// update the element
		this.wrappedElement.style.left = (x + "px");
		this.wrappedElement.style.top = (y + "px");
		this.wrappedElement.style.position = "fixed";

		// save the new position
		this.left = x;
		this.top = y;
	};

	// touch start event
	PopupWindow.prototype.performDown = function(/** @type {PopupWindow} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// update cursor position
		me.updateCursorPosition(me, x, y);

		// mark mouse down
		me.mouseDown = true;

		// tell embedded canvas to pass up mouse events
		me.menuManager.passEvents = true;
	};

	// perform mouse/touch up event
	PopupWindow.prototype.performUp = function(/** @type {PopupWindow} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// update cursor position
		me.updateCursorPosition(me, x, y);

		// mark mouse not down
		me.mouseDown = false;

		// tell embedded canvas to catch mouse events
		me.menuManager.passEvents = false;
	};

	// perform mouse/touch move event
	PopupWindow.prototype.performMove = function(/** @type {PopupWindow} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// check if mouse down (and so dragging)
		if (me.mouseDown) {
			me.updatePosition(x - me.mouseLastX, y - me.mouseLastY);
		}

		// save position
		me.mouseLastX = x;
		me.mouseLastY = y;
	};

	// mouse down event
	PopupWindow.prototype.elementMouseDown = function(/** @type {PopupWindow} */ me, /** @type {MouseEvent} */ event) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// ignore if using touch
		if (!me.usingTouch) {
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
		}

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();
	};

	// mouse up event
	PopupWindow.prototype.elementMouseUp = function(/** @type {PopupWindow} */ me, /** @type {MouseEvent} */ event) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// ignore if using touch events
		if (!me.usingTouch) {
			// ignore if popup not displayed
			if (me.displayed && me.mouseDown) {
				// get event position
				if (event.pageX || event.pageY) {
					x = event.pageX;
					y = event.pageY;
				} else {
					x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				}

				// update cursor position
				me.performUp(me, x, y);
			}
		}

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();
	};

	// mouse move event
	PopupWindow.prototype.elementMouseMove = function(/** @type {PopupWindow} */ me, /** @type {MouseEvent} */ event) {
		var	/** @type {number} */ x = 0,
			/** @type {number} */ y = 0;

		// ignore if using touch events
		if (!me.usingTouch) {
			// ignore if popup not displayed
			if (me.displayed && me.mouseDown) {
				// get event position
				if (event.pageX || event.pageY) {
					x = event.pageX;
					y = event.pageY;
				} else {
					x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				}

				// update cursor position
				me.performMove(me, x, y);
			}
		}

		// allow event propagation otherwise dragging to select text fails
	};

	// get cursor position over element
	PopupWindow.prototype.updateCursorPosition = function(/** @type {PopupWindow} */ me, /** @type {number} */ x, /** @type {number} */ y) {
		// update position
		me.mouseLastX = x | 0;
		me.mouseLastY = y | 0;
	};
